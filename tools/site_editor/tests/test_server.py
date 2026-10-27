from __future__ import annotations

import base64
import json
import tempfile
import unittest
from pathlib import Path

from tools.site_editor.server import EditorError, EditorState, file_hash, sanitize_name, validate_date


PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")


class EditorStateTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "doc" / "_static" / "moments").mkdir(parents=True)
        for page, filename in {
            "research": "research.md",
            "blogs": "enter_blogs.md",
            "news": "news.md",
            "moments": "moments.md",
        }.items():
            (self.root / "doc" / filename).write_text(f"# {page.title()}\n", encoding="utf-8")
        self.state = EditorState(self.root)

    def tearDown(self):
        self.temporary.cleanup()

    def stage_moment(self, name="friends"):
        return self.state.stage_asset({
            "page": "moments",
            "date": "2026.08.07",
            "name": name,
            "label": "friends",
            "originalName": "photo.png",
            "data": base64.b64encode(PNG).decode("ascii"),
        })

    def test_name_and_date_validation(self):
        self.assertEqual(sanitize_name(" My friends! "), "My_friends")
        self.assertEqual(validate_date("2026.08.07"), "20260807")
        with self.assertRaises(EditorError):
            validate_date("2026.02.30")

    def test_image_is_staged_without_touching_doc_assets(self):
        image = self.stage_moment()
        self.assertEqual(image["relative_path"], "_static/moments/20260807_friends.png")
        self.assertIn("[friends]", image["markup"])
        self.assertFalse((self.root / "doc" / image["relative_path"]).exists())

    def test_collision_gets_suffix(self):
        (self.root / "doc" / "_static" / "moments" / "20260807_friends.png").write_bytes(PNG)
        image = self.stage_moment()
        self.assertEqual(image["relative_path"], "_static/moments/20260807_friends-2.png")

    def test_unsupported_image_is_rejected(self):
        with self.assertRaises(EditorError):
            self.state.stage_asset({
                "page": "moments",
                "date": "2026.08.07",
                "name": "phone-photo",
                "label": "photo",
                "originalName": "photo.heic",
                "data": base64.b64encode(b"not a web image").decode("ascii"),
            })

    def test_research_pdf_uses_publications_directory(self):
        document = self.state.stage_asset({
            "page": "research",
            "date": "2026.10.21",
            "name": "conference-slides",
            "label": "slides",
            "originalName": "slides.pdf",
            "data": base64.b64encode(b"%PDF-1.7\n%%EOF\n").decode("ascii"),
        })
        self.assertEqual(document["relative_path"], "_static/publications/20261021_conference-slides.pdf")
        self.assertEqual(document["kind"], "pdf")
        self.assertIn('target="_blank"', document["markup"])
        self.assertFalse((self.root / "doc" / document["relative_path"]).exists())

    def test_news_pdf_stays_in_news_directory(self):
        document = self.state.stage_asset({
            "page": "news",
            "date": "2026.10.21",
            "name": "conference-program",
            "label": "program",
            "originalName": "program.pdf",
            "data": base64.b64encode(b"%PDF-1.7\n%%EOF\n").decode("ascii"),
        })
        self.assertEqual(document["relative_path"], "_static/news/20261021_conference-program.pdf")

    def test_save_creates_asset_and_backup(self):
        image = self.stage_moment()
        source = self.root / "doc" / "moments.md"
        before = file_hash(source)
        content = source.read_text(encoding="utf-8") + f"- 2026.08.07 Met {image['markup']}\n"
        result = self.state.save_page({"page": "moments", "content": content, "baseHash": before, "stagedAssets": [image["id"]]})
        self.assertTrue((self.root / "doc" / image["relative_path"]).exists())
        self.assertIn("friends", source.read_text(encoding="utf-8"))
        manifest = self.root / ".site-editor" / "backups" / result["backupId"] / "manifest.json"
        self.assertTrue(manifest.exists())
        self.assertEqual(json.loads(manifest.read_text())["importedAssets"], [image["relative_path"]])

    def test_save_rejects_external_change(self):
        source = self.root / "doc" / "moments.md"
        old_hash = file_hash(source)
        source.write_text("# Changed elsewhere\n", encoding="utf-8")
        with self.assertRaises(EditorError) as raised:
            self.state.save_page({"page": "moments", "content": "draft", "baseHash": old_hash, "stagedAssets": []})
        self.assertEqual(raised.exception.status, 409)
        self.assertEqual(source.read_text(encoding="utf-8"), "# Changed elsewhere\n")

    def test_restore_moves_imported_asset_to_recoverable_backup(self):
        image = self.stage_moment()
        source = self.root / "doc" / "moments.md"
        original = source.read_text(encoding="utf-8")
        saved = self.state.save_page({
            "page": "moments",
            "content": original + image["markup"],
            "baseHash": file_hash(source),
            "stagedAssets": [image["id"]],
        })
        restored = self.state.restore_backup({"backupId": saved["backupId"], "baseHash": file_hash(source)})
        self.assertEqual(source.read_text(encoding="utf-8"), original)
        self.assertFalse((self.root / "doc" / image["relative_path"]).exists())
        recoverable = self.root / ".site-editor" / "backups" / restored["backupId"] / "assets" / image["relative_path"]
        self.assertTrue(recoverable.exists())

    def test_cleanup_removes_only_transient_session_data(self):
        backup = self.root / ".site-editor" / "backups" / "keep"
        backup.mkdir(parents=True)
        self.state.cleanup_transient()
        self.assertFalse(self.state.session_root.exists())
        self.assertFalse(self.state.preview_root.exists())
        self.assertTrue(backup.exists())


if __name__ == "__main__":
    unittest.main()
