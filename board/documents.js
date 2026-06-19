(function () {
  let allDocuments = [];
  let editingDocId = null;

  const overlay = document.getElementById('docs-overlay');
  const listCv = document.getElementById('docs-list-cv');
  const listCover = document.getElementById('docs-list-cover');
  const formOverlay = document.getElementById('doc-form-overlay');
  const docForm = document.getElementById('doc-form');
  const docFormTitle = document.getElementById('doc-form-title');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function toggleDocContentFields(contentType) {
    document.getElementById('doc-content-text-wrap').hidden = contentType !== 'text';
    document.getElementById('doc-content-link-wrap').hidden = contentType !== 'link';
  }

  function renderDocItem(doc) {
    const badge = doc.contentType === 'link' ? 'Link' : 'Text';
    const preview =
      doc.contentType === 'link'
        ? doc.content
        : doc.content.length > 60
          ? doc.content.slice(0, 60) + '…'
          : doc.content;

    return `
      <div class="doc-item" data-id="${doc.id}">
        <div class="doc-item-info">
          <div class="doc-item-name">${escapeHtml(doc.name)}</div>
          <div class="doc-item-meta"><span class="doc-badge">${badge}</span> ${escapeHtml(preview)}</div>
        </div>
        <div class="doc-item-actions">
          <button type="button" class="btn btn-secondary btn-sm doc-edit" data-id="${doc.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm doc-delete" data-id="${doc.id}">Delete</button>
        </div>
      </div>`;
  }

  function renderLists() {
    const cvs = allDocuments.filter((d) => d.type === A2B_DOC_TYPE_CV);
    const covers = allDocuments.filter((d) => d.type === A2B_DOC_TYPE_COVER);

    listCv.innerHTML = cvs.length
      ? cvs.map(renderDocItem).join('')
      : '<p class="docs-empty">No CVs saved yet. Add one to reuse across jobs.</p>';

    listCover.innerHTML = covers.length
      ? covers.map(renderDocItem).join('')
      : '<p class="docs-empty">No cover letters saved yet.</p>';
  }

  async function loadDocuments() {
    allDocuments = await a2bGetDocuments();
    renderLists();
    return allDocuments;
  }

  function openDocumentsModal() {
    overlay.hidden = false;
    loadDocuments();
  }

  function closeDocumentsModal() {
    overlay.hidden = true;
  }

  function openDocForm(type, doc) {
    editingDocId = doc ? doc.id : null;
    docFormTitle.textContent = doc
      ? 'Edit document'
      : type === A2B_DOC_TYPE_CV
        ? 'Add CV / Resume'
        : 'Add Cover Letter';

    document.getElementById('doc-type').value = type;
    document.getElementById('doc-name').value = doc ? doc.name : '';
    document.getElementById('doc-content-type').value = doc ? doc.contentType : 'link';
    document.getElementById('doc-content-text').value =
      doc && doc.contentType === 'text' ? doc.content : '';
    document.getElementById('doc-content-link').value =
      doc && doc.contentType === 'link' ? doc.content : '';

    toggleDocContentFields(document.getElementById('doc-content-type').value);
    formOverlay.hidden = false;
    document.getElementById('doc-name').focus();
  }

  function closeDocForm() {
    formOverlay.hidden = true;
    editingDocId = null;
    docForm.reset();
  }

  async function handleDocSubmit(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('doc-name').value.trim(),
      type: document.getElementById('doc-type').value,
      contentType: document.getElementById('doc-content-type').value,
      content:
        document.getElementById('doc-content-type').value === 'link'
          ? document.getElementById('doc-content-link').value.trim()
          : document.getElementById('doc-content-text').value.trim()
    };

    if (!data.name || !data.content) return;

    if (editingDocId) {
      await a2bUpdateDocument(editingDocId, data);
    } else {
      await a2bAddDocument(data);
    }

    closeDocForm();
    await loadDocuments();
    if (window.a2bRefreshAttachmentSelects) {
      window.a2bRefreshAttachmentSelects();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this document from your library?')) return;
    await a2bDeleteDocument(id);
    await loadDocuments();
    if (window.a2bRefreshAttachmentSelects) {
      window.a2bRefreshAttachmentSelects();
    }
  }

  document.getElementById('docs-btn').addEventListener('click', openDocumentsModal);
  document.getElementById('docs-close').addEventListener('click', closeDocumentsModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDocumentsModal();
  });

  document.getElementById('add-doc-cv').addEventListener('click', () => openDocForm(A2B_DOC_TYPE_CV));
  document.getElementById('add-doc-cover').addEventListener('click', () => openDocForm(A2B_DOC_TYPE_COVER));

  listCv.addEventListener('click', onListClick);
  listCover.addEventListener('click', onListClick);

  function onListClick(e) {
    const editBtn = e.target.closest('.doc-edit');
    const deleteBtn = e.target.closest('.doc-delete');
    if (editBtn) {
      const doc = allDocuments.find((d) => d.id === editBtn.dataset.id);
      if (doc) openDocForm(doc.type, doc);
    }
    if (deleteBtn) handleDelete(deleteBtn.dataset.id);
  }

  document.getElementById('doc-form-close').addEventListener('click', closeDocForm);
  document.getElementById('doc-form-cancel').addEventListener('click', closeDocForm);
  docForm.addEventListener('submit', handleDocSubmit);
  formOverlay.addEventListener('click', (e) => {
    if (e.target === formOverlay) closeDocForm();
  });

  document.getElementById('doc-content-type').addEventListener('change', (e) => {
    toggleDocContentFields(e.target.value);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[A2B_DOCUMENTS_KEY] && !overlay.hidden) {
      loadDocuments();
    }
  });

  window.a2bDocuments = { load: loadDocuments, open: openDocumentsModal };
})();
