/* Makes a bundle of page-iframes behave like one real site: link clicks swap
   the visible frame, admin session is pre-seeded. No preview chrome. */
(function () {
  const PAGES = ['ICHI Site.dc.html', 'About.dc.html', 'Business.dc.html', 'Careers.dc.html', 'Contact.dc.html', 'login.dc.html', 'signup.dc.html', 'mypage.dc.html', 'Privacy.dc.html', 'Terms.dc.html'];
  const AUTH = { loggedIn: true, name: '관리자', id: 'admin', email: 'admin@ichi.kr', phone: '010-0000-0000', birth: '1985-01-01', gender: '남성', joinDate: '2023-01-02', role: 'admin' };
  try {
    localStorage.setItem('ichi_auth', JSON.stringify(Object.assign({}, AUTH, { at: Date.now() })));
    localStorage.setItem('ichi_profile', JSON.stringify({ name: AUTH.name, email: AUTH.email, phone: AUTH.phone, birth: AUTH.birth, gender: AUTH.gender }));
  } catch (e) {}

  function boot() {
    const frames = Array.from(document.querySelectorAll('iframe[data-file]'));
    let current = PAGES[0];

    function show(file) {
      if (!frames.some((f) => f.dataset.file === file)) return;
      current = file;
      frames.forEach((f) => { f.style.display = f.dataset.file === file ? 'block' : 'none'; });
      const f = frames.find((x) => x.dataset.file === file);
      try { f.contentWindow.scrollTo(0, 0); } catch (e) {}
    }

    function wire(frame) {
      let doc;
      try { doc = frame.contentDocument; } catch (e) { return; }
      if (!doc || doc.__ichiWired) return;
      doc.__ichiWired = true;
      /* real Pretendard from CDN when online (the offline bundle drops the 2MB local font) */
      setTimeout(function () {
        try {
          if (doc.querySelector('link[data-ichi-font]')) return;
          const l = doc.createElement('link');
          l.rel = 'stylesheet';
          l.setAttribute('data-ichi-font', '');
          l.href = ['https:/','/cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9','/dist/web/variable/pretendardvariable.min','.css'].join('');
          (doc.head || doc.documentElement).appendChild(l);
        } catch (e) { console.warn('font inject failed', e); }
      }, 0);
      doc.addEventListener('click', function (e) {
        const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        const raw = a.getAttribute('href') || '';
        if (!raw || raw.charAt(0) === '#') return;
        const file = decodeURIComponent(raw.split('#')[0].split('?')[0].replace(/^\.\//, ''));
        if (PAGES.indexOf(file) > -1) { e.preventDefault(); show(file); }
      }, true);
    }
    frames.forEach((f) => { f.addEventListener('load', () => wire(f)); wire(f); });
    window.addEventListener('message', function (e) {
      const file = e.data && e.data.__ichiNav;
      if (typeof file === 'string') show(file);
    });
    show(PAGES[0]);
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
