/* Injected into every page of the standalone bundles.
   1) makes localStorage work even in opaque-origin (file://) frames
   2) reports link clicks to the shell via postMessage (works cross-origin) */
(function () {
  var PAGES = ['ICHI Site.dc.html', 'About.dc.html', 'Business.dc.html', 'Careers.dc.html', 'Contact.dc.html', 'login.dc.html', 'signup.dc.html', 'mypage.dc.html', 'Privacy.dc.html', 'Terms.dc.html'];

  function memStore() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; },
      clear: function () { m = {}; },
      key: function (i) { return Object.keys(m)[i] || null; },
      get length() { return Object.keys(m).length; }
    };
  }
  ['localStorage', 'sessionStorage'].forEach(function (name) {
    var ok = false;
    try { window[name].setItem('__t', '1'); window[name].removeItem('__t'); ok = true; } catch (e) {}
    if (!ok) { try { Object.defineProperty(window, name, { value: memStore(), configurable: true }); } catch (e) {} }
  });

  var AUTH = { loggedIn: true, name: '관리자', id: 'admin', email: 'admin@ichi.kr', phone: '010-0000-0000', birth: '1985-01-01', gender: '남성', joinDate: '2023-01-02', role: 'admin', at: Date.now() };
  try {
    if (!localStorage.getItem('ichi_auth')) {
      localStorage.setItem('ichi_auth', JSON.stringify(AUTH));
      localStorage.setItem('ichi_profile', JSON.stringify({ name: AUTH.name, email: AUTH.email, phone: AUTH.phone, birth: AUTH.birth, gender: AUTH.gender }));
    }
  } catch (e) {}

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#') return;
    var file = decodeURIComponent(raw.split('#')[0].split('?')[0].replace(/^\.\//, ''));
    if (PAGES.indexOf(file) === -1) return;
    e.preventDefault();
    try { parent.postMessage({ __ichiNav: file }, '*'); } catch (err) {}
  }, true);

  /* in-page JS navigations (logout, form success) route through the shell too */
  try {
    var assign = window.location.assign.bind(window.location);
    window.__ichiGo = function (url) {
      var file = decodeURIComponent(String(url).split('#')[0].replace(/^\.\//, ''));
      if (PAGES.indexOf(file) > -1) { try { parent.postMessage({ __ichiNav: file }, '*'); return; } catch (e) {} }
      assign(url);
    };
  } catch (e) {}
})();
