/* DocLien — site script */
document.documentElement.classList.add('js');

/* Form delivery: requests email INQUIRY_EMAIL through FormSubmit. The first real
   submission sends a one-time activation email to that address; click it and every
   later request is delivered. Forms only send from the live domain. */
const INQUIRY_EMAIL = 'hello@doclien.com';
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + INQUIRY_EMAIL;
const LIVE = /(^|\.)doclien\.com$/.test(location.hostname);

/* Header border on scroll */
(function () {
  const h = document.querySelector('.hdr'); if (!h) return;
  const f = () => h.classList.toggle('scrolled', scrollY > 8); f();
  addEventListener('scroll', f, { passive: true });
})();

/* Mobile menu */
(function () {
  const btn = document.querySelector('.burger'), nav = document.getElementById('mnav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', false); }));
  addEventListener('keydown', e => { if (e.key === 'Escape') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });
})();

/* Hero case card: the case moves through its steps once on load */
(function () {
  const steps = [...document.querySelectorAll('.steps li')]; if (!steps.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const last = steps.length - 1;
  const finish = () => steps.forEach((s, i) => { s.classList.toggle('done', i < last); s.classList.toggle('now', i === last); });
  if (reduce) return finish();
  steps.forEach(s => s.classList.remove('done', 'now'));
  let i = 0;
  (function tick() {
    if (i > 0) { steps[i - 1].classList.remove('now'); steps[i - 1].classList.add('done'); }
    if (i <= last) { steps[i].classList.add('now'); i++; if (i <= last) setTimeout(tick, 650); }
  })();
  setTimeout(() => { steps[last].classList.add('now'); }, 650 * steps.length);
})();

/* Request form: show the fields for the chosen role; preselect from ?role= */
(function () {
  const form = document.querySelector('form[data-form]'); if (!form) return;
  const radios = form.querySelectorAll('input[name="Role"]');
  const set = v => { form.dataset.role = v; form.querySelectorAll('.only-firm input,.only-firm select').forEach(el => el.disabled = v !== 'firm'); form.querySelectorAll('.only-prov input,.only-prov select,.only-prov textarea').forEach(el => el.disabled = v !== 'provider'); };
  radios.forEach(r => r.addEventListener('change', () => { set(r.dataset.v); form.querySelector('.roles').closest('.field').classList.remove('bad'); }));
  const q = new URLSearchParams(location.search).get('role');
  const pre = [...radios].find(r => r.dataset.v === q);
  if (pre) { pre.checked = true; set(q); } else set('');
})();

/* Forms */
(function () {
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const phoneOk = v => v.replace(/\D/g, '').length >= 7;
  document.querySelectorAll('form[data-form]').forEach(form => {
    const msg = form.querySelector('.form-msg'), btn = form.querySelector('button[type=submit]'), label = btn.textContent;
    function check(el) {
      const wrap = el.closest('.field'); let bad = false;
      const v = el.value.trim();
      if (el.required && !v) bad = true;
      else if (v && el.type === 'email' && !emailOk(v)) bad = true;
      else if (v && el.type === 'tel' && !phoneOk(v)) bad = true;
      el.setAttribute('aria-invalid', bad); if (wrap) wrap.classList.toggle('bad', bad); return !bad;
    }
    const fields = () => [...form.querySelectorAll('input,select,textarea')].filter(el => !el.closest('.hp') && el.type !== 'radio' && !el.disabled);
    fields().forEach(el => el.addEventListener('blur', () => { if (el.getAttribute('aria-invalid') !== null) check(el); }));
    form.addEventListener('submit', async e => {
      e.preventDefault(); msg.className = 'form-msg';
      const roleSet = form.querySelector('input[name="Role"]:checked');
      const roleWrap = form.querySelector('.roles').closest('.field');
      roleWrap.classList.toggle('bad', !roleSet);
      const els = fields(), ok = els.map(check);
      if (!roleSet) { form.querySelector('input[name="Role"]').focus(); msg.textContent = 'Choose whether you are a law firm or a medical provider.'; msg.className = 'form-msg bad show'; return; }
      if (ok.includes(false)) { els[ok.indexOf(false)].focus(); msg.textContent = 'Check the highlighted fields and try again.'; msg.className = 'form-msg bad show'; return; }
      if (form.querySelector('.hp input').value) return;
      if (!LIVE) { msg.textContent = 'Preview mode: the form is working, but requests are only sent from doclien.com.'; msg.className = 'form-msg info show'; return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const data = new FormData(form);
        data.append('_subject', 'DocLien access request — ' + (roleSet.dataset.v === 'firm' ? 'Law firm' : 'Medical provider'));
        data.append('_template', 'table'); data.append('_captcha', 'false');
        data.append('_replyto', form.querySelector('input[type=email]').value);
        const r = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error();
        form.reset(); form.dataset.role = '';
        msg.textContent = 'Request received. Our team will contact you to set up your account.'; msg.className = 'form-msg ok show';
      } catch (err) {
        msg.textContent = 'The request did not go through. Try again, or email hello@doclien.com.'; msg.className = 'form-msg bad show';
      } finally { btn.disabled = false; btn.textContent = label; }
    });
  });
})();
