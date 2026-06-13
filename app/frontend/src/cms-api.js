import { API_BASE, getToken } from './api.js';

/**
 * @param {{ preview?: boolean }} opts
 * Preview mode includes drafts when the user is admin and `preview` is true.
 */
export async function fetchCmsBundle(opts = {}) {
  const preview = !!opts.preview;
  const params = new URLSearchParams();
  if (preview) params.set('preview', '1');
  const headers = {};
  if (preview && getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }
  const q = params.toString();
  const res = await fetch(`${API_BASE}/cms/bundle${q ? `?${q}` : ''}`, {
    headers,
    credentials: 'omit',
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'CMS request failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * @param {object} body — { target, id, field, value }
 */
export async function cmsPatchField(body) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/cms/admin/patch-field`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'PATCH failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function cmsUpsertHomeSection(body) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/cms/admin/home-sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Save failed');
  return data;
}

export async function cmsDeleteHomeSection(id) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/cms/admin/home-sections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Delete failed');
  }
  return res.json().catch(() => ({}));
}

/**
 * @param {string} doctorId
 * @param {File} file
 */
export async function cmsUploadDoctorAvatar(doctorId, file) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/cms/admin/doctors/${encodeURIComponent(doctorId)}/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Upload failed');
  return data;
}

/**
 * @param {string} testimonialId
 * @param {File} file
 */
export async function cmsUploadTestimonialAvatar(testimonialId, file) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(
    `${API_BASE}/cms/admin/testimonials/${encodeURIComponent(testimonialId)}/avatar`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Upload failed');
  return data;
}
