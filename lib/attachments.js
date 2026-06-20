function a2bAttachmentFieldKeys(kind) {
  if (kind === 'cv') {
    return {
      documentId: 'cvDocumentId',
      custom: 'cvCustom',
      customType: 'cvCustomType'
    };
  }
  return {
    documentId: 'coverLetterDocumentId',
    custom: 'coverLetterCustom',
    customType: 'coverLetterCustomType'
  };
}

function a2bGetAttachmentSelectValue(job, kind) {
  const keys = a2bAttachmentFieldKeys(kind);
  if (job[keys.documentId]) return `doc:${job[keys.documentId]}`;
  if (job[keys.customType] === 'text') return A2B_ATTACH_CUSTOM_TEXT;
  if (job[keys.customType] === 'link') return A2B_ATTACH_CUSTOM_LINK;
  return A2B_ATTACH_NONE;
}

function a2bEscapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function a2bBuildAttachmentSelectOptions(documents, docType, job, kind) {
  const keys = a2bAttachmentFieldKeys(kind);
  const current = a2bGetAttachmentSelectValue(job || {}, kind);
  const filtered = documents.filter((d) => d.type === docType);

  let html = `<option value="${A2B_ATTACH_NONE}">— None —</option>`;
  filtered.forEach((doc) => {
    const val = `doc:${doc.id}`;
    const badge = doc.contentType === 'link' ? '🔗' : '📄';
    html += `<option value="${val}" ${val === current ? 'selected' : ''}>${badge} ${a2bEscapeHtml(doc.name)}</option>`;
  });
  html += `<option value="${A2B_ATTACH_CUSTOM_TEXT}" ${current === A2B_ATTACH_CUSTOM_TEXT ? 'selected' : ''}>✏️ Custom text</option>`;
  html += `<option value="${A2B_ATTACH_CUSTOM_LINK}" ${current === A2B_ATTACH_CUSTOM_LINK ? 'selected' : ''}>🔗 Custom link</option>`;
  return html;
}

function a2bSyncAttachmentFields(root, prefix, getEl) {
  const select = getEl(root, `${prefix}-select`);
  if (!select) return;
  const val = select.value;
  const textEl = getEl(root, `${prefix}-custom-text`);
  const linkEl = getEl(root, `${prefix}-custom-link`);
  if (textEl) textEl.hidden = val !== A2B_ATTACH_CUSTOM_TEXT;
  if (linkEl) linkEl.hidden = val !== A2B_ATTACH_CUSTOM_LINK;
}

function a2bFillAttachmentFields(root, prefix, job, documents, docType, kind, getEl, setHtml) {
  const select = getEl(root, `${prefix}-select`);
  if (!select) return;

  if (setHtml) {
    setHtml(select, a2bBuildAttachmentSelectOptions(documents, docType, job, kind));
  } else {
    select.innerHTML = a2bBuildAttachmentSelectOptions(documents, docType, job, kind);
  }

  const keys = a2bAttachmentFieldKeys(kind);
  const textEl = getEl(root, `${prefix}-custom-text`);
  const linkEl = getEl(root, `${prefix}-custom-link`);
  if (textEl) textEl.value = job[keys.customType] === 'text' ? job[keys.custom] || '' : '';
  if (linkEl) linkEl.value = job[keys.customType] === 'link' ? job[keys.custom] || '' : '';

  a2bSyncAttachmentFields(root, prefix, getEl);
}

function a2bReadAttachmentFields(root, prefix, kind, getEl) {
  const keys = a2bAttachmentFieldKeys(kind);
  const select = getEl(root, `${prefix}-select`);
  const result = {
    [keys.documentId]: null,
    [keys.custom]: '',
    [keys.customType]: null
  };

  if (!select) return result;

  const val = select.value;
  if (val.startsWith('doc:')) {
    result[keys.documentId] = val.slice(4);
    result[keys.custom] = '';
    result[keys.customType] = null;
  } else if (val === A2B_ATTACH_CUSTOM_TEXT) {
    result[keys.documentId] = null;
    const textEl = getEl(root, `${prefix}-custom-text`);
    result[keys.custom] = textEl ? textEl.value.trim() : '';
    result[keys.customType] = 'text';
  } else if (val === A2B_ATTACH_CUSTOM_LINK) {
    result[keys.documentId] = null;
    const linkEl = getEl(root, `${prefix}-custom-link`);
    result[keys.custom] = linkEl ? linkEl.value.trim() : '';
    result[keys.customType] = 'link';
  } else {
    result[keys.documentId] = null;
    result[keys.custom] = '';
    result[keys.customType] = null;
  }

  return result;
}

function a2bResolveAttachment(job, kind, documents) {
  const keys = a2bAttachmentFieldKeys(kind);
  if (job[keys.documentId]) {
    const doc = documents.find((d) => d.id === job[keys.documentId]);
    if (doc) {
      return {
        source: 'library',
        name: doc.name,
        contentType: doc.contentType,
        content: doc.content
      };
    }
    return {
      source: 'library',
      name: 'Removed from library',
      contentType: 'link',
      content: '',
      missing: true,
      documentId: job[keys.documentId]
    };
  }
  if (job[keys.customType] === 'text' && job[keys.custom]) {
    return { source: 'custom', name: 'Custom text', contentType: 'text', content: job[keys.custom] };
  }
  if (job[keys.customType] === 'link' && job[keys.custom]) {
    return { source: 'custom', name: 'Custom link', contentType: 'link', content: job[keys.custom] };
  }
  return null;
}

function a2bFormatAttachmentLabel(attachment) {
  if (!attachment) return '';
  if (attachment.contentType === 'link') return `${attachment.name} → ${attachment.content}`;
  const preview = attachment.content.length > 80
    ? attachment.content.slice(0, 80) + '…'
    : attachment.content;
  return `${attachment.name}: ${preview}`;
}

function a2bBindAttachmentSelects(root, prefixes, getEl, onChange) {
  prefixes.forEach((prefix) => {
    const select = getEl(root, `${prefix}-select`);
    if (!select || select.dataset.a2bBound) return;
    select.dataset.a2bBound = '1';
    select.addEventListener('mousedown', (e) => e.stopPropagation());
    select.addEventListener('click', (e) => e.stopPropagation());
    select.addEventListener('change', () => {
      a2bSyncAttachmentFields(root, prefix, getEl);
      if (onChange) onChange(prefix);
    });
  });
}

function a2bResetAttachmentFields(root, prefixes, getEl) {
  prefixes.forEach((prefix) => {
    a2bFillAttachmentFields(root, prefix, {}, [], null, prefix.includes('cv') ? 'cv' : 'cl', getEl);
  });
}

function a2bReadAllAttachments(root, cvPrefix, clPrefix, getEl) {
  return {
    ...a2bReadAttachmentFields(root, cvPrefix, 'cv', getEl),
    ...a2bReadAttachmentFields(root, clPrefix, 'cl', getEl)
  };
}
