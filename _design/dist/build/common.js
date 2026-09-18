/* ICHI shared scroll-reveal utility.
   Marks the document so reveal CSS applies only with JS, then observes any
   `.reveal` elements (including ones React mounts later) and adds `.in`
   when they enter the viewport. No-JS fallback: without this file the
   `js-reveal` class is never set, so `.reveal` stays fully visible. */
(function () {
  document.documentElement.classList.add('js-reveal');

  function start() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var observed = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });

    function scan() {
      document.querySelectorAll('.reveal').forEach(function (el) {
        if (!observed.has(el)) { observed.add(el); io.observe(el); }
      });
    }
    scan();
    var mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: if anything is in view but never fired, reveal it.
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
