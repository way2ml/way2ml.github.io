#!/usr/bin/env python3
"""Local, repository-bound editor for the four primary Way2ML pages."""

from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import mimetypes
import os
import re
import secrets
import shutil
import subprocess
import tempfile
import threading
import unicodedata
import urllib.parse
import uuid
import webbrowser
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from markdown_it import MarkdownIt


REPO_ROOT = Path(__file__).resolve().parents[2]
DOC_ROOT = REPO_ROOT / "doc"
EDITOR_ROOT = REPO_ROOT / ".site-editor"
STATIC_ROOT = Path(__file__).resolve().parent / "static"

PAGE_CONFIG = {
    "research": {"label": "Research", "source": "research.md", "output": "research.html", "asset_dir": "research", "pdf_dir": "publications", "timeline": True},
    "blogs": {"label": "Blogs", "source": "enter_blogs.md", "output": "enter_blogs.html", "asset_dir": "blogs/index", "timeline": False},
    "news": {"label": "News", "source": "news.md", "output": "news.html", "asset_dir": "news", "timeline": True},
    "moments": {"label": "Moments", "source": "moments.md", "output": "moments.html", "asset_dir": "moments", "timeline": True},
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".pdf"}
MIME_BY_EXTENSION = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
}


class EditorError(Exception):
    def __init__(self, message: str, status: int = HTTPStatus.BAD_REQUEST):
        super().__init__(message)
        self.status = status


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def sanitize_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value.strip())
    value = re.sub(r"\s+", "_", value)
    value = "".join(character for character in value if character.isalnum() or character in "_-.")
    value = value.strip("._-")
    if not value:
        raise EditorError("Please enter a filename.")
    return value[:80]


def validate_date(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) != 8:
        raise EditorError("Date must contain year, month, and day.")
    try:
        datetime.strptime(digits, "%Y%m%d")
    except ValueError as error:
        raise EditorError("Date is not valid.") from error
    return digits


def validate_asset(extension: str, payload: bytes) -> None:
    if extension not in ALLOWED_EXTENSIONS:
        raise EditorError("Supported formats: JPG, JPEG, PNG, WebP, GIF, SVG, and PDF.")
    signatures = {
        ".jpg": payload.startswith(b"\xff\xd8\xff"),
        ".jpeg": payload.startswith(b"\xff\xd8\xff"),
        ".png": payload.startswith(b"\x89PNG\r\n\x1a\n"),
        ".gif": payload.startswith((b"GIF87a", b"GIF89a")),
        ".webp": len(payload) >= 12 and payload[:4] == b"RIFF" and payload[8:12] == b"WEBP",
        ".svg": b"<svg" in payload[:4096].lower(),
        ".pdf": payload.startswith(b"%PDF-"),
    }
    if not payload or not signatures[extension]:
        raise EditorError("The file contents do not match the selected file format.")


class EditorState:
    def __init__(self, repo_root: Path = REPO_ROOT):
        self.repo_root = repo_root.resolve()
        self.doc_root = self.repo_root / "doc"
        self.editor_root = self.repo_root / ".site-editor"
        self.session_id = secrets.token_urlsafe(10)
        self.session_root = self.editor_root / "sessions" / self.session_id
        self.preview_root = self.editor_root / "previews" / self.session_id
        self.backup_root = self.editor_root / "backups"
        self.state_path = self.editor_root / "state.json"
        self.session_root.mkdir(parents=True, exist_ok=True)
        self.preview_root.mkdir(parents=True, exist_ok=True)
        self._markdown = MarkdownIt("commonmark", {"html": True, "linkify": True, "typographer": False})
        self._staged: dict[str, dict[str, Any]] = {}
        self._previews: dict[str, Path] = {}
        self._lock = threading.RLock()

    def page(self, page_id: str) -> dict[str, Any]:
        config = PAGE_CONFIG.get(page_id)
        if not config:
            raise EditorError("Unknown page.", HTTPStatus.NOT_FOUND)
        return config

    def source_path(self, page_id: str) -> Path:
        return self.doc_root / self.page(page_id)["source"]

    def read_page(self, page_id: str) -> dict[str, Any]:
        path = self.source_path(page_id)
        return {
            "id": page_id,
            "label": self.page(page_id)["label"],
            "content": path.read_text(encoding="utf-8"),
            "hash": file_hash(path),
            "timeline": self.page(page_id)["timeline"],
        }

    def render_quick(self, content: str) -> str:
        content = re.sub(r"\A---\s*\n.*?\n---\s*\n", "", content, count=1, flags=re.DOTALL)
        return self._markdown.render(content)

    def _destination_name(self, page_id: str, date: str, name: str, extension: str) -> tuple[str, Path]:
        page = self.page(page_id)
        directory_name = page.get("pdf_dir", page["asset_dir"]) if extension == ".pdf" else page["asset_dir"]
        asset_directory = Path("_static") / directory_name
        stem = f"{validate_date(date)}_{sanitize_name(name)}"
        candidate = f"{stem}{extension}"
        index = 2
        existing_staged = {entry["relative_path"] for entry in self._staged.values()}
        while (self.doc_root / asset_directory / candidate).exists() or (asset_directory / candidate).as_posix() in existing_staged:
            candidate = f"{stem}-{index}{extension}"
            index += 1
        relative_path = asset_directory / candidate
        return f"./{relative_path.as_posix()}", relative_path

    def stage_asset(self, data: dict[str, Any]) -> dict[str, Any]:
        page_id = str(data.get("page", ""))
        self.page(page_id)
        original_name = Path(str(data.get("originalName", ""))).name
        extension = Path(original_name).suffix.lower()
        try:
            payload = base64.b64decode(str(data.get("data", "")), validate=True)
        except (ValueError, TypeError) as error:
            raise EditorError("File upload is not valid.") from error
        if len(payload) > 40 * 1024 * 1024:
            raise EditorError("Files larger than 40 MB are not supported.")
        validate_asset(extension, payload)

        date = str(data.get("date", ""))
        name = str(data.get("name", ""))
        label = str(data.get("label", "")).strip() or sanitize_name(name)
        href, relative_path = self._destination_name(page_id, date, name, extension)
        asset_id = uuid.uuid4().hex
        staged_path = self.session_root / f"{asset_id}{extension}"
        staged_path.write_bytes(payload)
        if extension == ".pdf":
            markup = f'<a href="{html.escape(href, quote=True)}" target="_blank" rel="noopener">[{html.escape(label)}]</a>'
        elif self.page(page_id)["timeline"]:
            markup = f'<a href="{html.escape(href, quote=True)}">[{html.escape(label)}]</a>'
        else:
            markdown_label = label.replace("[", "\\[").replace("]", "\\]")
            markup = f"![{markdown_label}]({href})"
        entry = {
            "id": asset_id,
            "page": page_id,
            "label": label,
            "relative_path": relative_path.as_posix(),
            "href": href,
            "markup": markup,
            "staged_path": staged_path,
            "mime": MIME_BY_EXTENSION[extension],
            "kind": "pdf" if extension == ".pdf" else "image",
        }
        self._staged[asset_id] = entry
        return {key: value for key, value in entry.items() if key != "staged_path"}

    def staged_asset(self, asset_id: str) -> tuple[Path, str]:
        entry = self._staged.get(asset_id)
        if not entry:
            raise EditorError("Staged image not found.", HTTPStatus.NOT_FOUND)
        return entry["staged_path"], entry["mime"]

    def _new_backup_id(self, page_id: str) -> str:
        return datetime.now().strftime("%Y%m%d-%H%M%S-%f") + f"_{page_id}"

    def _create_backup(self, page_id: str, imported_assets: list[str] | None = None, reason: str = "save") -> tuple[str, Path]:
        backup_id = self._new_backup_id(page_id)
        backup_dir = self.backup_root / backup_id
        backup_dir.mkdir(parents=True, exist_ok=False)
        source = self.source_path(page_id)
        shutil.copy2(source, backup_dir / source.name)
        manifest = {
            "id": backup_id,
            "page": page_id,
            "label": self.page(page_id)["label"],
            "createdAt": datetime.now().astimezone().isoformat(timespec="seconds"),
            "source": source.relative_to(self.repo_root).as_posix(),
            "sourceHash": file_hash(source),
            "importedAssets": imported_assets or [],
            "reason": reason,
        }
        atomic_write(backup_dir / "manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        return backup_id, backup_dir

    def _load_changed_paths(self) -> set[str]:
        try:
            data = json.loads(self.state_path.read_text(encoding="utf-8"))
            return {str(path) for path in data.get("changedPaths", [])}
        except (FileNotFoundError, json.JSONDecodeError):
            return set()

    def _record_changed_paths(self, paths: list[str]) -> None:
        changed = self._load_changed_paths()
        changed.update(paths)
        self.editor_root.mkdir(parents=True, exist_ok=True)
        atomic_write(self.state_path, json.dumps({"changedPaths": sorted(changed)}, indent=2) + "\n")

    def save_page(self, data: dict[str, Any]) -> dict[str, Any]:
        page_id = str(data.get("page", ""))
        content = str(data.get("content", ""))
        expected_hash = str(data.get("baseHash", ""))
        requested_assets = [str(value) for value in data.get("stagedAssets", [])]
        source = self.source_path(page_id)

        with self._lock:
            if file_hash(source) != expected_hash:
                raise EditorError("The file changed outside the editor. Reload it before saving.", HTTPStatus.CONFLICT)
            entries = []
            for asset_id in requested_assets:
                entry = self._staged.get(asset_id)
                if not entry or entry["page"] != page_id:
                    raise EditorError("A staged image is missing or belongs to another page.")
                if entry["href"] not in content:
                    continue
                destination = self.doc_root / entry["relative_path"]
                if destination.exists():
                    raise EditorError(f"Image already exists: {entry['relative_path']}", HTTPStatus.CONFLICT)
                entries.append(entry)

            backup_id, _ = self._create_backup(page_id, [entry["relative_path"] for entry in entries])
            created_assets: list[Path] = []
            try:
                for entry in entries:
                    destination = self.doc_root / entry["relative_path"]
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    temporary = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.tmp")
                    shutil.copy2(entry["staged_path"], temporary)
                    os.replace(temporary, destination)
                    created_assets.append(destination)
                atomic_write(source, content)
            except Exception:
                for path in created_assets:
                    path.unlink(missing_ok=True)
                raise

            changed_paths = [source.relative_to(self.repo_root).as_posix()]
            changed_paths.extend(path.relative_to(self.repo_root).as_posix() for path in created_assets)
            self._record_changed_paths(changed_paths)
            for entry in entries:
                entry["staged_path"].unlink(missing_ok=True)
                self._staged.pop(entry["id"], None)
            return {"hash": file_hash(source), "backupId": backup_id, "changedPaths": changed_paths}

    def list_backups(self, page_id: str | None = None) -> list[dict[str, Any]]:
        if page_id:
            self.page(page_id)
        backups = []
        if not self.backup_root.exists():
            return backups
        for manifest_path in self.backup_root.glob("*/manifest.json"):
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            if not page_id or manifest.get("page") == page_id:
                backups.append(manifest)
        return sorted(backups, key=lambda item: item.get("createdAt", ""), reverse=True)

    def restore_backup(self, data: dict[str, Any]) -> dict[str, Any]:
        backup_id = Path(str(data.get("backupId", ""))).name
        backup_dir = self.backup_root / backup_id
        manifest_path = backup_dir / "manifest.json"
        if not manifest_path.exists():
            raise EditorError("Backup not found.", HTTPStatus.NOT_FOUND)
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        page_id = str(manifest["page"])
        source = self.source_path(page_id)
        expected_hash = str(data.get("baseHash", ""))
        with self._lock:
            if file_hash(source) != expected_hash:
                raise EditorError("The page changed after the backup list was opened.", HTTPStatus.CONFLICT)
            current_backup_id, current_backup_dir = self._create_backup(page_id, reason="before-restore")
            restored_content = (backup_dir / source.name).read_text(encoding="utf-8")
            moved_assets = []
            for relative in manifest.get("importedAssets", []):
                asset = self.doc_root / relative
                href = f"./{relative}"
                if asset.exists() and href not in restored_content:
                    recoverable = current_backup_dir / "assets" / relative
                    recoverable.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(asset, recoverable)
                    moved_assets.append(asset.relative_to(self.repo_root).as_posix())
            atomic_write(source, restored_content)
            changed = [source.relative_to(self.repo_root).as_posix(), *moved_assets]
            self._record_changed_paths(changed)
            return {"hash": file_hash(source), "backupId": current_backup_id, "movedAssets": moved_assets}

    def _overlay_static(self, target: Path, staged_entries: list[dict[str, Any]]) -> None:
        overrides = {Path(entry["relative_path"]).relative_to("_static"): entry for entry in staged_entries}

        def mirror(source_dir: Path, target_dir: Path, prefix: Path = Path()) -> None:
            target_dir.mkdir(parents=True, exist_ok=True)
            for child in source_dir.iterdir():
                relative = prefix / child.name
                needs_overlay = child.is_dir() and any(path == relative or relative in path.parents for path in overrides)
                if needs_overlay:
                    mirror(child, target_dir / child.name, relative)
                elif relative not in overrides:
                    (target_dir / child.name).symlink_to(child, target_is_directory=child.is_dir())
        mirror(self.doc_root / "_static", target)
        for relative, entry in overrides.items():
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(entry["staged_path"], destination)

    def build_preview(self, data: dict[str, Any]) -> dict[str, Any]:
        page_id = str(data.get("page", ""))
        content = str(data.get("content", ""))
        requested_assets = [str(value) for value in data.get("stagedAssets", [])]
        entries = []
        for asset_id in requested_assets:
            entry = self._staged.get(asset_id)
            if entry and entry["page"] == page_id and entry["href"] in content:
                entries.append(entry)

        preview_id = uuid.uuid4().hex
        root = self.preview_root / preview_id
        source_root = root / "source"
        output_root = root / "output"
        source_root.mkdir(parents=True)
        data_root = self.repo_root / "data"
        if data_root.is_dir():
            (root / "data").symlink_to(data_root, target_is_directory=True)
        selected_name = self.page(page_id)["source"]
        for child in self.doc_root.iterdir():
            if child.name in {"_build", selected_name, "_static"}:
                continue
            (source_root / child.name).symlink_to(child, target_is_directory=child.is_dir())
        atomic_write(source_root / selected_name, content)
        self._overlay_static(source_root / "_static", entries)
        command = ["sphinx-build", "-E", "-q", str(source_root), str(output_root)]
        try:
            completed = subprocess.run(command, cwd=self.repo_root, capture_output=True, text=True, timeout=120)
        except (OSError, subprocess.TimeoutExpired) as error:
            shutil.rmtree(root, ignore_errors=True)
            raise EditorError(f"Could not run Sphinx: {error}", HTTPStatus.INTERNAL_SERVER_ERROR) from error
        if completed.returncode:
            details = (completed.stderr or completed.stdout)[-6000:]
            shutil.rmtree(root, ignore_errors=True)
            raise EditorError("Sphinx preview failed.\n" + details, HTTPStatus.UNPROCESSABLE_ENTITY)
        previous_previews = list(self._previews.values())
        self._previews.clear()
        self._previews[preview_id] = output_root
        for previous in previous_previews:
            shutil.rmtree(previous.parent, ignore_errors=True)
        return {
            "previewId": preview_id,
            "url": f"/preview/{preview_id}/{self.page(page_id)['output']}",
            "warnings": (completed.stderr or "")[-6000:],
        }

    def cleanup_transient(self) -> None:
        shutil.rmtree(self.session_root, ignore_errors=True)
        shutil.rmtree(self.preview_root, ignore_errors=True)

    def preview_file(self, preview_id: str, relative: str) -> Path:
        root = self._previews.get(preview_id)
        if not root:
            raise EditorError("Preview not found.", HTTPStatus.NOT_FOUND)
        path = (root / relative).resolve()
        if root.resolve() not in path.parents and path != root.resolve():
            raise EditorError("Invalid preview path.", HTTPStatus.FORBIDDEN)
        if not path.is_file():
            raise EditorError("Preview file not found.", HTTPStatus.NOT_FOUND)
        return path

    def git_preview(self) -> dict[str, Any]:
        paths = sorted(self._load_changed_paths())
        if not paths:
            return {"paths": [], "status": "", "diff": ""}
        status = subprocess.run(["git", "status", "--short", "--", *paths], cwd=self.repo_root, capture_output=True, text=True, check=True).stdout
        diff = subprocess.run(["git", "diff", "--no-ext-diff", "--", *paths], cwd=self.repo_root, capture_output=True, text=True, check=True).stdout
        untracked = [line[3:] for line in status.splitlines() if line.startswith("?? ")]
        if untracked:
            diff += "\nUntracked files to include:\n" + "\n".join(f"  {path}" for path in untracked)
        return {"paths": paths, "status": status, "diff": diff[-60000:]}

    def git_snapshot(self, message: str) -> dict[str, Any]:
        preview = self.git_preview()
        paths = preview["paths"]
        if not paths or not preview["status"].strip():
            raise EditorError("There are no editor changes to commit.")
        message = message.strip() or f"Site editor snapshot {datetime.now():%Y-%m-%d %H:%M}"
        subprocess.run(["git", "add", "--", *paths], cwd=self.repo_root, check=True, capture_output=True, text=True)
        completed = subprocess.run(["git", "commit", "--only", "-m", message, "--", *paths], cwd=self.repo_root, capture_output=True, text=True)
        if completed.returncode:
            raise EditorError((completed.stderr or completed.stdout).strip(), HTTPStatus.UNPROCESSABLE_ENTITY)
        atomic_write(self.state_path, json.dumps({"changedPaths": []}, indent=2) + "\n")
        commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=self.repo_root, capture_output=True, text=True, check=True).stdout.strip()
        return {"commit": commit, "message": message}


class EditorHandler(SimpleHTTPRequestHandler):
    server_version = "Way2MLEditor/1.0"

    @property
    def app(self) -> "EditorServer":
        return self.server  # type: ignore[return-value]

    def log_message(self, format_string: str, *args: Any) -> None:
        print(f"[{self.log_date_time_string()}] {format_string % args}")

    def _json(self, payload: Any, status: int = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _error(self, error: Exception) -> None:
        if isinstance(error, EditorError):
            self._json({"error": str(error)}, error.status)
        else:
            print(f"Unexpected editor error: {error!r}")
            self._json({"error": "Unexpected editor error. See the terminal for details."}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def _authorized(self) -> bool:
        return secrets.compare_digest(self.headers.get("X-Editor-Token", ""), self.app.token)

    def _read_json(self) -> dict[str, Any]:
        if not self._authorized():
            raise EditorError("Editor session token is missing or invalid.", HTTPStatus.FORBIDDEN)
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise EditorError("Invalid request length.") from error
        if length > 60 * 1024 * 1024:
            raise EditorError("Request is too large.", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise EditorError("Request body must be valid JSON.") from error

    def _send_file(self, path: Path, cache: bool = False) -> None:
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        payload = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "public, max-age=3600" if cache else "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        try:
            if path == "/":
                self._send_file(STATIC_ROOT / "index.html")
                return
            if path.startswith("/static/"):
                relative = path.removeprefix("/static/")
                target = (STATIC_ROOT / relative).resolve()
                if STATIC_ROOT.resolve() not in target.parents or not target.is_file():
                    raise EditorError("Static file not found.", HTTPStatus.NOT_FOUND)
                self._send_file(target)
                return
            if path.startswith("/doc/"):
                relative = urllib.parse.unquote(path.removeprefix("/doc/"))
                target = (self.app.state.doc_root / relative).resolve()
                if self.app.state.doc_root.resolve() not in target.parents or not target.is_file():
                    raise EditorError("Document asset not found.", HTTPStatus.NOT_FOUND)
                self._send_file(target)
                return
            if path.startswith("/staged/"):
                asset_id = Path(path).name
                target, mime = self.app.state.staged_asset(asset_id)
                payload = target.read_bytes()
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(len(payload)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(payload)
                return
            if path.startswith("/preview/"):
                parts = path.split("/", 3)
                if len(parts) != 4:
                    raise EditorError("Invalid preview URL.", HTTPStatus.NOT_FOUND)
                self._send_file(self.app.state.preview_file(parts[2], urllib.parse.unquote(parts[3])))
                return
            if path == "/api/pages":
                if not self._authorized():
                    raise EditorError("Editor session token is missing or invalid.", HTTPStatus.FORBIDDEN)
                self._json({"pages": [self.app.state.read_page(page_id) for page_id in PAGE_CONFIG]})
                return
            if path == "/api/backups":
                if not self._authorized():
                    raise EditorError("Editor session token is missing or invalid.", HTTPStatus.FORBIDDEN)
                query = urllib.parse.parse_qs(parsed.query)
                self._json({"backups": self.app.state.list_backups(query.get("page", [None])[0])})
                return
            if path == "/api/git-preview":
                if not self._authorized():
                    raise EditorError("Editor session token is missing or invalid.", HTTPStatus.FORBIDDEN)
                self._json(self.app.state.git_preview())
                return
            raise EditorError("Not found.", HTTPStatus.NOT_FOUND)
        except Exception as error:
            self._error(error)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            data = self._read_json()
            routes = {
                "/api/render": lambda: {"html": self.app.state.render_quick(str(data.get("content", "")))},
                "/api/stage-asset": lambda: self.app.state.stage_asset(data),
                "/api/stage-image": lambda: self.app.state.stage_asset(data),
                "/api/preview": lambda: self.app.state.build_preview(data),
                "/api/save": lambda: self.app.state.save_page(data),
                "/api/restore": lambda: self.app.state.restore_backup(data),
                "/api/git-snapshot": lambda: self.app.state.git_snapshot(str(data.get("message", ""))),
            }
            action = routes.get(parsed.path)
            if not action:
                raise EditorError("Not found.", HTTPStatus.NOT_FOUND)
            self._json(action())
        except Exception as error:
            self._error(error)


class EditorServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address: tuple[str, int], token: str, state: EditorState):
        super().__init__(address, EditorHandler)
        self.token = token
        self.state = state


def select_port(preferred: int) -> int:
    import socket

    for port in range(preferred, preferred + 20):
        with socket.socket() as candidate:
            try:
                candidate.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise SystemExit("No available local port found.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the local Way2ML site editor.")
    parser.add_argument("--port", type=int, default=8768, help="Preferred local port (default: 8768).")
    parser.add_argument("--no-browser", action="store_true", help="Do not open the editor in a browser.")
    args = parser.parse_args()

    token = secrets.token_urlsafe(24)
    state = EditorState()
    port = select_port(args.port)
    server = EditorServer(("127.0.0.1", port), token, state)
    url = f"http://127.0.0.1:{port}/?token={urllib.parse.quote(token)}"
    print(f"Way2ML editor: {url}")
    print("Press Ctrl+C to stop.")
    if not args.no_browser:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Way2ML editor.")
    finally:
        server.server_close()
        state.cleanup_transient()


if __name__ == "__main__":
    main()
