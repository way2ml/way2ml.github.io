(() => {
  'use strict';

  const token = new URLSearchParams(location.search).get('token') || '';
  const apiHeaders = {'Content-Type': 'application/json', 'X-Editor-Token': token};
  const editor = document.querySelector('#editor');
  const pageSelect = document.querySelector('#page-select');
  const preview = document.querySelector('#preview');
  const status = document.querySelector('#status');
  const dirtyState = document.querySelector('#dirty-state');
  const saveButton = document.querySelector('#save-button');
  const buildButton = document.querySelector('#build-button');
  const quickTab = document.querySelector('#quick-tab');
  const exactTab = document.querySelector('#exact-tab');
  const dropZone = document.querySelector('#drop-zone');
  const toast = document.querySelector('#toast');
  const imageDialog = document.querySelector('#image-dialog');
  const imageForm = document.querySelector('#image-form');
  const listDialog = document.querySelector('#list-dialog');

  let pages = new Map();
  let currentPage = null;
  let baseHash = '';
  let savedContent = '';
  let stagedAssets = [];
  let exactPreviewUrl = '';
  let previewTimer = null;
  let toastTimer = null;
  let pendingImageResolve = null;

  async function api(path, options = {}) {
    const response = await fetch(path, {...options, headers: {...apiHeaders, ...(options.headers || {})}});
    let payload;
    try { payload = await response.json(); } catch { payload = {error: `Request failed (${response.status})`}; }
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function setStatus(message) { status.textContent = message; }

  function isDirty() { return editor.value !== savedContent; }

  function updateDirtyState() {
    const dirty = isDirty();
    dirtyState.textContent = dirty ? 'Unsaved' : 'Saved';
    dirtyState.classList.toggle('dirty', dirty);
    saveButton.disabled = !dirty && !activeStagedAssets().length;
  }

  function activeStagedAssets() {
    return stagedAssets.filter(asset => editor.value.includes(asset.href));
  }

  function switchPreview(mode) {
    const exact = mode === 'exact';
    quickTab.classList.toggle('active', !exact);
    exactTab.classList.toggle('active', exact);
    if (exact && exactPreviewUrl) {
      preview.setAttribute('sandbox', 'allow-same-origin allow-scripts');
      preview.removeAttribute('srcdoc');
      preview.src = exactPreviewUrl;
    }
    else renderQuick();
  }

  function previewDocument(body) {
    return `<!doctype html><html><head><meta charset="utf-8"><base href="/doc/"><style>
      body{max-width:850px;margin:0 auto;padding:32px 38px 80px;color:#202936;font:16px/1.65 system-ui,sans-serif}
      h1{font-size:2rem;margin-top:0} h2{margin-top:2rem} a{color:#147d91} img{max-width:100%;height:auto;border-radius:5px}
      pre{overflow:auto;padding:1rem;background:#f6f8fa;border-radius:5px} code{font-family:ui-monospace,monospace}
      blockquote{margin-left:0;padding-left:1rem;border-left:3px solid #d0d5dd;color:#667085}
      table{border-collapse:collapse} td,th{border:1px solid #d0d5dd;padding:.4rem .6rem}
    </style></head><body>${body}</body></html>`;
  }

  async function renderQuick() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      try {
        const result = await api('/api/render', {method: 'POST', body: JSON.stringify({content: editor.value})});
        preview.setAttribute('sandbox', 'allow-same-origin');
        preview.removeAttribute('src');
        preview.srcdoc = previewDocument(result.html);
      } catch (error) {
        setStatus(error.message);
      }
    }, 240);
  }

  async function loadPage(pageId, force = false) {
    if (!force && currentPage && isDirty() && !confirm('Discard the unsaved changes on this page?')) {
      pageSelect.value = currentPage;
      return;
    }
    const page = pages.get(pageId);
    currentPage = pageId;
    baseHash = page.hash;
    savedContent = page.content;
    editor.value = page.content;
    stagedAssets = stagedAssets.filter(asset => asset.page !== pageId);
    exactPreviewUrl = '';
    updateDirtyState();
    switchPreview('quick');
    setStatus(`${page.label} loaded`);
  }

  function dateAtCursor(position) {
    const before = editor.value.slice(0, position);
    const line = before.slice(before.lastIndexOf('\n') + 1);
    const match = line.match(/^\s*-\s+(\d{4})[.\-/](\d{2})[.\-/](\d{2})\b/);
    if (match) return `${match[1]}${match[2]}${match[3]}`;
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  }

  function safeName(value) {
    return value.trim().normalize('NFKC').replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_.-]/gu, '').replace(/^[._-]+|[._-]+$/g, '') || 'image';
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function askImageDetails(file, date) {
    const objectUrl = URL.createObjectURL(file);
    const stem = file.name.replace(/\.[^.]+$/, '');
    const isPdf = /\.pdf$/i.test(file.name);
    document.querySelector('#image-original-name').textContent = file.name;
    document.querySelector('#asset-dialog-title').textContent = isPdf ? 'Add PDF' : 'Add image';
    const imageThumbnail = document.querySelector('#image-thumbnail');
    const pdfThumbnail = document.querySelector('#pdf-thumbnail');
    imageThumbnail.hidden = isPdf;
    pdfThumbnail.hidden = !isPdf;
    if (!isPdf) imageThumbnail.src = objectUrl;
    document.querySelector('#image-date').value = date;
    document.querySelector('#image-label').value = stem;
    document.querySelector('#image-name').value = stem;

    function updatePath() {
      const page = pages.get(currentPage);
      const extension = file.name.includes('.') ? `.${file.name.split('.').pop().toLowerCase()}` : '';
      const assetDir = isPdf ? page.pdfDir : page.assetDir;
      const cleanDate = document.querySelector('#image-date').value.replace(/\D/g, '');
      const cleanName = safeName(document.querySelector('#image-name').value);
      document.querySelector('#image-path').textContent = `doc/_static/${assetDir}/${cleanDate}_${cleanName}${extension}`;
    }
    document.querySelector('#image-date').oninput = updatePath;
    document.querySelector('#image-name').oninput = updatePath;
    updatePath();
    imageDialog.showModal();

    return new Promise(resolve => {
      pendingImageResolve = result => {
        URL.revokeObjectURL(objectUrl);
        resolve(result);
      };
    });
  }

  imageForm.addEventListener('submit', event => {
    event.preventDefault();
    const submitter = event.submitter;
    imageDialog.close();
    if (!pendingImageResolve) return;
    if (submitter?.value === 'cancel') pendingImageResolve(null);
    else pendingImageResolve({
      date: document.querySelector('#image-date').value,
      label: document.querySelector('#image-label').value,
      name: document.querySelector('#image-name').value,
    });
    pendingImageResolve = null;
  });

  async function stageFiles(files, insertionPoint) {
    const supported = /\.(?:jpe?g|png|webp|gif|svg|pdf)$/i;
    let cursor = insertionPoint;
    for (const file of files) {
      if (!supported.test(file.name)) {
        showToast(`${file.name}: unsupported file format`, true);
        continue;
      }
      const details = await askImageDetails(file, dateAtCursor(cursor));
      if (!details) continue;
      setStatus(`Staging ${file.name}…`);
      try {
        const dataUrl = await readAsDataUrl(file);
        const result = await api('/api/stage-asset', {
          method: 'POST',
          body: JSON.stringify({
            page: currentPage,
            originalName: file.name,
            data: dataUrl.split(',', 2)[1],
            ...details,
          }),
        });
        stagedAssets.push(result);
        const prefix = cursor > 0 && !/\s/.test(editor.value[cursor - 1]) ? ' ' : '';
        const insertion = `${prefix}${result.markup}`;
        editor.setRangeText(insertion, cursor, cursor, 'end');
        cursor += insertion.length;
        updateDirtyState();
        renderQuick();
        showToast(`Staged ${result.relative_path}`);
      } catch (error) {
        showToast(error.message, true);
      }
    }
    editor.focus();
    editor.setSelectionRange(cursor, cursor);
    setStatus('Image staging finished');
  }

  dropZone.addEventListener('dragenter', event => { event.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragover', event => { event.preventDefault(); });
  dropZone.addEventListener('dragleave', event => { if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('dragging'); });
  dropZone.addEventListener('drop', event => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
    const files = [...event.dataTransfer.files];
    if (files.length) stageFiles(files, editor.selectionStart);
  });

  async function save() {
    saveButton.disabled = true;
    setStatus('Saving…');
    try {
      const result = await api('/api/save', {
        method: 'POST',
        body: JSON.stringify({page: currentPage, content: editor.value, baseHash, stagedAssets: activeStagedAssets().map(asset => asset.id)}),
      });
      baseHash = result.hash;
      savedContent = editor.value;
      const savedIds = new Set(activeStagedAssets().map(asset => asset.id));
      stagedAssets = stagedAssets.filter(asset => !savedIds.has(asset.id));
      const page = pages.get(currentPage);
      page.hash = baseHash;
      page.content = savedContent;
      updateDirtyState();
      setStatus(`Saved · backup ${result.backupId}`);
      showToast('Saved with a local backup');
    } catch (error) {
      showToast(error.message, true);
      setStatus('Save failed');
    } finally {
      updateDirtyState();
    }
  }

  async function buildExactPreview() {
    buildButton.disabled = true;
    setStatus('Building exact Sphinx preview…');
    try {
      const result = await api('/api/preview', {
        method: 'POST',
        body: JSON.stringify({page: currentPage, content: editor.value, stagedAssets: activeStagedAssets().map(asset => asset.id)}),
      });
      exactPreviewUrl = result.url;
      preview.setAttribute('sandbox', 'allow-same-origin allow-scripts');
      preview.removeAttribute('srcdoc');
      preview.src = exactPreviewUrl;
      quickTab.classList.remove('active');
      exactTab.classList.add('active');
      setStatus(result.warnings ? 'Exact preview ready · Sphinx reported warnings' : 'Exact preview ready');
      if (result.warnings) console.warn(result.warnings);
    } catch (error) {
      showToast(error.message, true);
      setStatus('Exact preview failed');
    } finally {
      buildButton.disabled = false;
    }
  }

  function openListDialog(title, description, content, actions = []) {
    document.querySelector('#list-title').textContent = title;
    document.querySelector('#list-description').textContent = description;
    const container = document.querySelector('#list-content');
    container.replaceChildren(content);
    const actionContainer = document.querySelector('#list-actions');
    actionContainer.replaceChildren(...actions);
    listDialog.showModal();
  }

  async function showBackups() {
    try {
      const result = await api(`/api/backups?page=${encodeURIComponent(currentPage)}`);
      const container = document.createElement('div');
      if (!result.backups.length) container.innerHTML = '<div class="empty">No backups yet.</div>';
      result.backups.forEach(backup => {
        const row = document.createElement('div');
        row.className = 'backup-row';
        const info = document.createElement('div');
        info.innerHTML = `<strong>${new Date(backup.createdAt).toLocaleString()}</strong><div class="backup-meta">${backup.reason} · ${backup.importedAssets.length} imported image(s)</div>`;
        const restore = document.createElement('button');
        restore.className = 'button secondary compact';
        restore.textContent = 'Restore';
        restore.onclick = async () => {
          if (isDirty()) return showToast('Save or discard the current draft before restoring.', true);
          if (!confirm(`Restore ${backup.label} from ${new Date(backup.createdAt).toLocaleString()}?`)) return;
          try {
            const restored = await api('/api/restore', {method: 'POST', body: JSON.stringify({backupId: backup.id, baseHash})});
            const fresh = await api('/api/pages');
            pages = new Map(fresh.pages.map(page => [page.id, enrichPage(page)]));
            listDialog.close();
            await loadPage(currentPage, true);
            showToast(`Restored. Current version backed up as ${restored.backupId}`);
          } catch (error) { showToast(error.message, true); }
        };
        row.append(info, restore);
        container.append(row);
      });
      openListDialog('Local backups', 'A backup is created before every save and restore.', container);
    } catch (error) { showToast(error.message, true); }
  }

  async function showGitSnapshot() {
    try {
      const result = await api('/api/git-preview');
      const content = document.createElement('pre');
      content.className = 'diff-view';
      content.textContent = result.status.trim() ? `${result.status}\n${result.diff}` : 'No editor-managed changes to commit.';
      const actions = [];
      if (result.status.trim()) {
        const commit = document.createElement('button');
        commit.className = 'button primary';
        commit.textContent = 'Create snapshot';
        commit.onclick = async () => {
          const message = prompt('Commit message', `Site editor snapshot ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
          if (message === null) return;
          commit.disabled = true;
          try {
            const saved = await api('/api/git-snapshot', {method: 'POST', body: JSON.stringify({message})});
            listDialog.close();
            showToast(`Created Git snapshot ${saved.commit}`);
          } catch (error) { showToast(error.message, true); commit.disabled = false; }
        };
        actions.push(commit);
      }
      openListDialog('Git snapshot', 'Only files changed through this editor are included. Nothing is pushed.', content, actions);
    } catch (error) { showToast(error.message, true); }
  }

  function enrichPage(page) {
    const dirs = {research: 'research', blogs: 'blogs/index', news: 'news', moments: 'moments'};
    return {...page, assetDir: dirs[page.id], pdfDir: page.id === 'research' ? 'publications' : dirs[page.id]};
  }

  async function init() {
    if (!token) return showToast('Open the editor using the URL printed in the terminal.', true);
    try {
      const result = await api('/api/pages');
      pages = new Map(result.pages.map(page => [page.id, enrichPage(page)]));
      for (const page of pages.values()) {
        const option = document.createElement('option');
        option.value = page.id;
        option.textContent = page.label;
        pageSelect.append(option);
      }
      pageSelect.value = 'moments';
      await loadPage('moments', true);
    } catch (error) {
      showToast(error.message, true);
      setStatus('Could not load the editor');
    }
  }

  editor.addEventListener('input', () => { updateDirtyState(); exactPreviewUrl = ''; renderQuick(); });
  pageSelect.addEventListener('change', () => loadPage(pageSelect.value));
  saveButton.addEventListener('click', save);
  buildButton.addEventListener('click', buildExactPreview);
  quickTab.addEventListener('click', () => switchPreview('quick'));
  exactTab.addEventListener('click', () => exactPreviewUrl ? switchPreview('exact') : buildExactPreview());
  document.querySelector('#history-button').addEventListener('click', showBackups);
  document.querySelector('#git-button').addEventListener('click', showGitSnapshot);
  document.querySelector('#list-close').addEventListener('click', () => listDialog.close());
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', event => { if (isDirty()) { event.preventDefault(); event.returnValue = ''; } });

  init();
})();
