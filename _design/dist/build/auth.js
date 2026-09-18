/* ICHI mock auth — LocalStorage based.
   Swap the storage calls for a real Session/JWT API later; the public
   API (ICHIAuth.*) stays the same. */
(function () {
  var KEY = 'ichi_auth';
  // Admin accounts (mock). Swap for a real role claim from the auth API later.
  var ADMIN_IDS = ['admin'];

  function roleFor(user) {
    if (!user) return 'user';
    if (user.role) return user.role;
    return ADMIN_IDS.indexOf(user.id) !== -1 ? 'admin' : 'user';
  }

  var Auth = {
    isLoggedIn: function () {
      try { return !!JSON.parse(localStorage.getItem(KEY) || 'null'); }
      catch (e) { return false; }
    },
    getUser: function () {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
      catch (e) { return null; }
    },
    isAdmin: function () {
      var u = Auth.getUser();
      return !!u && roleFor(u) === 'admin';
    },
    login: function (user) {
      var prev = Auth.getUser() || {};
      var data = Object.assign({ loggedIn: true, at: Date.now() }, prev, user || {});
      data.role = roleFor(data);
      localStorage.setItem(KEY, JSON.stringify(data));
      apply();
      return data;
    },
    update: function (patch) {
      var data = Object.assign({}, Auth.getUser() || {}, patch || {});
      localStorage.setItem(KEY, JSON.stringify(data));
      apply();
      return data;
    },
    logout: function () {
      localStorage.removeItem(KEY);
      apply();
    },
    toast: function (msg) { showToast(msg); },
    toastAfterNav: function (msg) { try { sessionStorage.setItem('ichi_toast', msg); } catch (e) {} },
    confirm: function (opts) { openModal(opts || {}); }
  };
  window.ICHIAuth = Auth;

  /* ---------- nav state (class + name only, no node injection) ---------- */

  function apply() {
    var loggedIn = Auth.isLoggedIn();
    var user = Auth.getUser() || {};
    var name = (user.name || '회원') + '님';
    if (document.body) {
      document.body.classList.toggle('is-authed', loggedIn);
      document.body.classList.toggle('is-admin', loggedIn && roleFor(user) === 'admin');
    }
    var names = document.querySelectorAll('.nav-uname, .mm-uname');
    for (var i = 0; i < names.length; i++) {
      if (names[i].textContent !== name) names[i].textContent = name;
    }
  }

  /* ---------- modal + toast ---------- */

  var modalEl, toastEl, toastTimer, onConfirmFn;

  function injectUI() {
    modalEl = document.createElement('div');
    modalEl.className = 'auth-modal-overlay';
    modalEl.innerHTML =
      '<div class="auth-modal" role="dialog" aria-modal="true">' +
        '<h3 class="am-title"></h3>' +
        '<p class="am-body"></p>' +
        '<div class="am-actions">' +
          '<button type="button" class="am-cancel"></button>' +
          '<button type="button" class="am-confirm"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeModal(); });
    modalEl.querySelector('.am-cancel').addEventListener('click', closeModal);
    modalEl.querySelector('.am-confirm').addEventListener('click', function () {
      var fn = onConfirmFn; closeModal();
      if (fn) fn();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    toastEl = document.createElement('div');
    toastEl.className = 'ichi-toast';
    toastEl.innerHTML = '<span></span>';
    document.body.appendChild(toastEl);
  }

  function openModal(opts) {
    if (!modalEl) injectUI();
    modalEl.querySelector('.am-title').textContent = opts.title || '확인';
    modalEl.querySelector('.am-body').innerHTML = (opts.body || '').replace(/\n/g, '<br>');
    modalEl.querySelector('.am-cancel').textContent = opts.cancelText || '취소';
    var confirm = modalEl.querySelector('.am-confirm');
    confirm.textContent = opts.confirmText || '확인';
    confirm.classList.toggle('danger', !!opts.danger);
    onConfirmFn = opts.onConfirm || null;
    modalEl.classList.add('show');
  }

  function closeModal() { if (modalEl) modalEl.classList.remove('show'); onConfirmFn = null; }

  function showToast(msg) {
    if (!toastEl) injectUI();
    toastEl.querySelector('span').textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  function confirmLogout() {
    openModal({
      title: '로그아웃',
      body: '로그아웃하시겠습니까?',
      confirmText: '로그아웃',
      onConfirm: function () {
        Auth.logout();
        Auth.toastAfterNav('로그아웃되었습니다.');
        window.location.href = 'ICHI Site.dc.html';
      }
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    injectUI();
    apply();
    // Nav is rendered by React shortly after load. Poll briefly until it
    // appears, then stop — no continuous observation (avoids fighting React).
    var tries = 0;
    var iv = setInterval(function () {
      apply();
      tries++;
      if (document.querySelector('.nav-uname') || tries > 40) clearInterval(iv);
    }, 100);
    // Logout buttons live in each page's template — handle via delegation.
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.nav-logout, .mm-logout');
      if (t) { e.preventDefault(); confirmLogout(); }
    });
    window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });
    try {
      var pending = sessionStorage.getItem('ichi_toast');
      if (pending) { sessionStorage.removeItem('ichi_toast'); setTimeout(function () { showToast(pending); }, 400); }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
