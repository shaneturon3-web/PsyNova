import { API_BASE, getToken } from './api.js';

async function readCmsJson(url, headers = {}) {
  const res = await fetch(url, {
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

export async function cmsFetchBundle(options = {}) {
  const preview = !!options.preview;
  const params = new URLSearchParams();

  if (preview) params.set('preview', '1');

  const headers = {};
  const token = getToken();

  if (preview && token) headers.Authorization = `Bearer ${token}`;

  const q = params.toString();
  const liveUrl = `${API_BASE}/cms/bundle${q ? `?${q}` : ''}`;
  const staticUrl = `${API_BASE}/cms/bundle.json`;

  try {
    return await readCmsJson(liveUrl, headers);
  } catch (err) {
    if (!preview) {
      return readCmsJson(staticUrl, headers);
    }
    throw err;
  }
}

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

// Backward-compatible alias used by cms-admin-panel.js.
export const fetchCmsBundle = cmsFetchBundle;
