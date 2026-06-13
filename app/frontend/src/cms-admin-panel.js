import {
  cmsDeleteHomeSection,
  cmsPatchField,
  cmsUpsertHomeSection,
  cmsUploadDoctorAvatar,
  cmsUploadTestimonialAvatar,
  fetchCmsBundle,
} from './cms-api.js';

function ensureQuill() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Quill) {
      resolve();
      return;
    }
    if (typeof document === 'undefined') {
      reject(new Error('no document'));
      return;
    }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Quill load failed'));
    document.head.appendChild(s);
  });
}

/**
 * @param {object} state — app state with cms bundle
 * @param {function} esc
 */
export function viewCmsAdmin(state, esc) {
  const b = state.cms?.bundle;
  const err = state.cms?.error;
  if (!b && err) {
    return `<p class="error-msg">CMS: ${esc(err)}</p>`;
  }
  if (!b) {
    return `<p class="muted">Loading CMS…</p>`;
  }

  const enc = (s) => encodeURIComponent(s || '');
  const doctors = [...(b.doctors || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const doctorForms = doctors
    .map((d) => {
      const q = (name) =>
        `<label class="cms-lbl">${esc(name)}<textarea class="input-textarea cms-quill-target" name="${esc(name)}" rows="6" data-enc="${enc(d[name] || '')}"></textarea></label>`;
      return `<section class="card cms-card"><h3>${esc(d.slug)}</h3>
        <div class="cms-grid">
          <label>nameFr <input class="input-wide" name="nameFr" value="${esc(d.nameFr || '')}" /></label>
          <label>nameEn <input class="input-wide" name="nameEn" value="${esc(d.nameEn || '')}" /></label>
          <label>nameEs <input class="input-wide" name="nameEs" value="${esc(d.nameEs || '')}" /></label>
          <label>roleFr <input class="input-wide" name="roleFr" value="${esc(d.roleFr || '')}" /></label>
          <label>roleEn <input class="input-wide" name="roleEn" value="${esc(d.roleEn || '')}" /></label>
          <label>roleEs <input class="input-wide" name="roleEs" value="${esc(d.roleEs || '')}" /></label>
        </div>
        ${q('bioFr')}
        ${q('bioEn')}
        ${q('bioEs')}
        <label>illustration_note <input class="input-wide" name="illustrationNote" value="${esc(d.illustrationNote || '')}" /></label>
        <label><input type="checkbox" name="published" ${d.published ? 'checked' : ''} /> published</label>
        <p><input type="file" accept="image/*" name="avatar" class="cms-file" /> Replace cartoon avatar (upload)</p>
        <button type="button" class="btn cms-save-doctor" data-id="${esc(d.id)}">Save doctor</button>
      </section>`;
    })
    .join('');

  const services = [...(b.services || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0));
  const serviceForms = services
    .map(
      (s) => `
    <section class="card cms-card"><h3>${esc(s.slug)}</h3>
      <div class="cms-grid">
        <label>titleFr <input class="input-wide" name="titleFr" value="${esc(s.titleFr || '')}" /></label>
        <label>titleEn <input class="input-wide" name="titleEn" value="${esc(s.titleEn || '')}" /></label>
        <label>titleEs <input class="input-wide" name="titleEs" value="${esc(s.titleEs || '')}" /></label>
      </div>
      <label>bodyFr <textarea class="input-textarea cms-quill-target" name="bodyFr" rows="4" data-enc="${enc(s.bodyFr || '')}"></textarea></label>
      <label>bodyEn <textarea class="input-textarea cms-quill-target" name="bodyEn" rows="4" data-enc="${enc(s.bodyEn || '')}"></textarea></label>
      <label>bodyEs <textarea class="input-textarea cms-quill-target" name="bodyEs" rows="4" data-enc="${enc(s.bodyEs || '')}"></textarea></label>
      <label><input type="checkbox" name="published" ${s.published ? 'checked' : ''} /> published</label>
      <button type="button" class="btn cms-save-service" data-id="${esc(s.id)}">Save service</button>
    </section>`,
    )
    .join('');

  const testimonials = [...(b.testimonials || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0));
  const testimonialForms = testimonials
    .map(
      (t) => `
    <section class="card cms-card"><h3>${esc(t.id.slice(0, 8))}…</h3>
      <div class="cms-grid">
        <label>authorFr <input class="input-wide" name="authorFr" value="${esc(t.authorFr || '')}" /></label>
        <label>authorEn <input class="input-wide" name="authorEn" value="${esc(t.authorEn || '')}" /></label>
        <label>authorEs <input class="input-wide" name="authorEs" value="${esc(t.authorEs || '')}" /></label>
      </div>
      <label>quoteFr <textarea class="input-textarea cms-quill-target" name="quoteFr" rows="3" data-enc="${enc(t.quoteFr || '')}"></textarea></label>
      <label>quoteEn <textarea class="input-textarea cms-quill-target" name="quoteEn" rows="3" data-enc="${enc(t.quoteEn || '')}"></textarea></label>
      <label>quoteEs <textarea class="input-textarea cms-quill-target" name="quoteEs" rows="3" data-enc="${enc(t.quoteEs || '')}"></textarea></label>
      <label><input type="checkbox" name="published" ${t.published ? 'checked' : ''} /> published</label>
      <p><input type="file" accept="image/*" name="avatar" class="cms-file" /> Replace avatar</p>
      <button type="button" class="btn cms-save-testimonial" data-id="${esc(t.id)}">Save testimonial</button>
    </section>`,
    )
    .join('');

  const homeRows = [...(b.homeSections || [])]
    .sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0))
    .map(
      (h) => `
    <section class="card cms-card">
      <h3>${esc(h.sectionType)} · ${esc(h.id.slice(0, 8))}…</h3>
      <label>sortOrder <input type="number" name="sortOrder" value="${esc(String(h.sortOrder))}" /></label>
      <label>sectionType <input class="input-wide" name="sectionType" value="${esc(h.sectionType)}" /></label>
      <label>payload (JSON) <textarea class="input-textarea" name="payload" rows="10">${esc(JSON.stringify(h.payload || {}, null, 2))}</textarea></label>
      <label><input type="checkbox" name="published" ${h.published ? 'checked' : ''} /> published</label>
      <button type="button" class="btn cms-save-home" data-id="${esc(h.id)}">Save section</button>
      <button type="button" class="btn btn--ghost cms-del-home" data-id="${esc(h.id)}">Remove section</button>
    </section>`,
    )
    .join('');

  const posts = [...(b.blogPosts || [])].map(
    (p) => `
    <section class="card cms-card"><h3>${esc(p.slug)}</h3>
      <label>datePublished <input name="datePublished" value="${esc(p.datePublished || '')}" /></label>
      <div class="cms-grid">
        <label>titleFr <input class="input-wide" name="titleFr" value="${esc(p.titleFr || '')}" /></label>
        <label>titleEn <input class="input-wide" name="titleEn" value="${esc(p.titleEn || '')}" /></label>
        <label>titleEs <input class="input-wide" name="titleEs" value="${esc(p.titleEs || '')}" /></label>
      </div>
      <label>excerptFr <textarea name="excerptFr" rows="2" class="input-textarea">${esc(p.excerptFr || '')}</textarea></label>
      <label>excerptEn <textarea name="excerptEn" rows="2" class="input-textarea">${esc(p.excerptEn || '')}</textarea></label>
      <label>excerptEs <textarea name="excerptEs" rows="2" class="input-textarea">${esc(p.excerptEs || '')}</textarea></label>
      <label>bodyFr <textarea class="cms-quill-target" name="bodyFr" rows="6" data-enc="${enc(p.bodyFr || '')}"></textarea></label>
      <label>bodyEn <textarea class="cms-quill-target" name="bodyEn" rows="6" data-enc="${enc(p.bodyEn || '')}"></textarea></label>
      <label>bodyEs <textarea class="cms-quill-target" name="bodyEs" rows="6" data-enc="${enc(p.bodyEs || '')}"></textarea></label>
      <label><input type="checkbox" name="published" ${p.published ? 'checked' : ''} /> published</label>
      <button type="button" class="btn cms-save-blog" data-id="${esc(p.id)}">Save post</button>
    </section>`,
  );

  return `
    <div class="cms-admin">
      <p class="muted">${esc(b.tag || '')}</p>
      <div class="cms-toolbar card">
        <button type="button" class="btn" id="cms-reload">Reload from API</button>
        <label class="cms-inline"><input type="checkbox" id="cms-preview-drafts" /> Preview drafts (admin session)</label>
        <label class="cms-inline"><input type="checkbox" id="cms-inline-edit" /> Human script correction (click-to-edit on public pages)</label>
        <p class="muted" style="margin:0;">Rich text: Save converts WYSIWYG (Quill) to HTML. No redeploy — data lives in API/DB.</p>
      </div>
      <div class="cms-tabs" role="tablist">
        <button type="button" class="btn btn--ghost cms-tab" data-tab="doctors">Doctors</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="services">Services</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="testimonials">Testimonials</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="home">Home sections</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="blog">Blog</button>
      </div>
      <div id="cms-panel-doctors" class="cms-panel">${doctorForms}</div>
      <div id="cms-panel-services" class="cms-panel" hidden>${serviceForms}</div>
      <div id="cms-panel-testimonials" class="cms-panel" hidden>${testimonialForms}</div>
      <div id="cms-panel-home" class="cms-panel" hidden>
        ${homeRows}
        <section class="card"><h3>Add section</h3>
          <label>sortOrder <input type="number" id="cms-new-home-sort" value="99" /></label>
          <label>sectionType <input id="cms-new-home-type" value="richtext" /></label>
          <label>payload JSON <textarea id="cms-new-home-payload" rows="6" class="input-textarea">{}</textarea></label>
          <button type="button" class="btn" id="cms-add-home">Add section</button>
        </section>
      </div>
      <div id="cms-panel-blog" class="cms-panel" hidden>${posts.join('')}</div>
    </div>`;
}

function closestCard(el) {
  return el && el.closest && el.closest('.cms-card');
}

function readDoctorCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    nameFr: get('nameFr')?.value ?? '',
    nameEn: get('nameEn')?.value ?? '',
    nameEs: get('nameEs')?.value ?? '',
    roleFr: get('roleFr')?.value ?? '',
    roleEn: get('roleEn')?.value ?? '',
    roleEs: get('roleEs')?.value ?? '',
    illustrationNote: get('illustrationNote')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

function readServiceCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    titleFr: get('titleFr')?.value ?? '',
    titleEn: get('titleEn')?.value ?? '',
    titleEs: get('titleEs')?.value ?? '',
    bodyFr: get('bodyFr')?.value ?? '',
    bodyEn: get('bodyEn')?.value ?? '',
    bodyEs: get('bodyEs')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

function readTestimonialCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    authorFr: get('authorFr')?.value ?? '',
    authorEn: get('authorEn')?.value ?? '',
    authorEs: get('authorEs')?.value ?? '',
    quoteFr: get('quoteFr')?.value ?? '',
    quoteEn: get('quoteEn')?.value ?? '',
    quoteEs: get('quoteEs')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

function readBlogCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    datePublished: get('datePublished')?.value ?? '',
    titleFr: get('titleFr')?.value ?? '',
    titleEn: get('titleEn')?.value ?? '',
    titleEs: get('titleEs')?.value ?? '',
    excerptFr: get('excerptFr')?.value ?? '',
    excerptEn: get('excerptEn')?.value ?? '',
    excerptEs: get('excerptEs')?.value ?? '',
    bodyFr: get('bodyFr')?.value ?? '',
    bodyEn: get('bodyEn')?.value ?? '',
    bodyEs: get('bodyEs')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

/**
 * @param {object} ctx — { state, render, esc }
 */
export async function bindCmsAdmin(ctx) {
  const { state, render } = ctx;
  const root = document.querySelector('.cms-admin');
  if (!root) return;

  const mapTab = {
    doctors: 'cms-panel-doctors',
    services: 'cms-panel-services',
    testimonials: 'cms-panel-testimonials',
    home: 'cms-panel-home',
    blog: 'cms-panel-blog',
  };

  root.querySelectorAll('.cms-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      Object.values(mapTab).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
      });
      if (tab && mapTab[tab]) {
        const p = document.getElementById(mapTab[tab]);
        if (p) p.hidden = false;
      }
    });
  });

  document.getElementById('cms-reload')?.addEventListener('click', async () => {
    state.cms.loading = true;
    render();
    try {
      const preview =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem('psynova_cms_preview') === '1';
      state.cms.bundle = await fetchCmsBundle({ preview });
      state.cms.error = null;
    } catch (e) {
      state.cms.error = e.message || String(e);
    } finally {
      state.cms.loading = false;
      render();
      void bindCmsAdmin(ctx);
    }
  });

  const prev = document.getElementById('cms-preview-drafts');
  if (prev) {
    prev.checked = sessionStorage.getItem('psynova_cms_preview') === '1';
    prev.addEventListener('change', () => {
      if (prev.checked) sessionStorage.setItem('psynova_cms_preview', '1');
      else sessionStorage.removeItem('psynova_cms_preview');
    });
  }
  const inl = document.getElementById('cms-inline-edit');
  if (inl) {
    inl.checked = sessionStorage.getItem('psynova_cms_inline') !== '0';
    inl.addEventListener('change', () => {
      if (inl.checked) sessionStorage.setItem('psynova_cms_inline', '1');
      else sessionStorage.setItem('psynova_cms_inline', '0');
    });
  }

  try {
    await ensureQuill();
    root.querySelectorAll('textarea.cms-quill-target').forEach((ta) => {
      const host = document.createElement('div');
      host.className = 'cms-quill';
      host.style.minHeight = '120px';
      ta.parentNode.insertBefore(host, ta);
      ta.hidden = true;
      let html = '';
      try {
        const encv = ta.getAttribute('data-enc');
        html = encv ? decodeURIComponent(encv) : ta.value || '';
      } catch {
        html = '';
      }
      const q = new window.Quill(host, { theme: 'snow', modules: { toolbar: true } });
      q.clipboard.dangerouslyPasteHTML(html);
      ta.__quill = q;
    });
  } catch {
    /* textarea fallback */
  }

  const getQuillHtml = (ta) => {
    if (ta?.__quill) return ta.__quill.root.innerHTML;
    return ta?.value ?? '';
  };

  root.querySelectorAll('.cms-save-doctor').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readDoctorCard(card);
      const fileInp = card.querySelector('input.cms-file');
      const file = fileInp && fileInp.files && fileInp.files[0];
      try {
        if (file) await cmsUploadDoctorAvatar(id, file);
        for (const [k, v] of Object.entries(data)) {
          await cmsPatchField({ target: 'doctor', id, field: k, value: v });
        }
        for (const name of ['bioFr', 'bioEn', 'bioEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'doctor', id, field: name, value: html });
        }
        alert('Doctor saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-save-service').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readServiceCard(card);
      try {
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('body')) continue;
          await cmsPatchField({ target: 'service', id, field: k, value: v });
        }
        for (const name of ['bodyFr', 'bodyEn', 'bodyEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'service', id, field: name, value: html });
        }
        alert('Service saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-save-testimonial').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readTestimonialCard(card);
      const fileInp = card.querySelector('input.cms-file');
      const file = fileInp && fileInp.files && fileInp.files[0];
      try {
        if (file) await cmsUploadTestimonialAvatar(id, file);
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('quote')) continue;
          await cmsPatchField({ target: 'testimonial', id, field: k, value: v });
        }
        for (const name of ['quoteFr', 'quoteEn', 'quoteEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'testimonial', id, field: name, value: html });
        }
        alert('Testimonial saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-save-home').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const sortOrder = Number(card.querySelector('[name="sortOrder"]')?.value || 0);
      const sectionType = card.querySelector('[name="sectionType"]')?.value || 'richtext';
      const published = card.querySelector('[name="published"]')?.checked ?? false;
      let payload = {};
      try {
        payload = JSON.parse(card.querySelector('[name="payload"]')?.value || '{}');
      } catch {
        alert('Invalid JSON payload');
        return;
      }
      try {
        await cmsUpsertHomeSection({ id, sortOrder, sectionType, payload, published });
        alert('Home section saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-del-home').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!id || !confirm('Delete this homepage section?')) return;
      try {
        await cmsDeleteHomeSection(id);
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  document.getElementById('cms-add-home')?.addEventListener('click', async () => {
    const sortOrder = Number(document.getElementById('cms-new-home-sort')?.value || 0);
    const sectionType = document.getElementById('cms-new-home-type')?.value || 'richtext';
    let payload = {};
    try {
      payload = JSON.parse(document.getElementById('cms-new-home-payload')?.value || '{}');
    } catch {
      alert('Invalid JSON');
      return;
    }
    try {
      await cmsUpsertHomeSection({ sortOrder, sectionType, payload, published: false });
      state.cms.bundle = await fetchCmsBundle({
        preview: sessionStorage.getItem('psynova_cms_preview') === '1',
      });
      render();
      void bindCmsAdmin(ctx);
    } catch (e) {
      alert(e.message || String(e));
    }
  });

  root.querySelectorAll('.cms-save-blog').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readBlogCard(card);
      try {
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('body')) continue;
          const field = k === 'datePublished' ? 'datePublished' : k;
          await cmsPatchField({ target: 'blogPost', id, field, value: v });
        }
        for (const name of ['bodyFr', 'bodyEn', 'bodyEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'blogPost', id, field: name, value: html });
        }
        alert('Blog post saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });
}
