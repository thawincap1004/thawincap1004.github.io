/* =========================================================================
   Srinivasa Group — Interactions
   ========================================================================= */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupNavScrolled();
    setupMobileMenu();
    setupNavSpy();
    setupReveal();
    setupCounters();
    setupServicesTabs();
    setupCoverageMap();
    setupFAQ();
    setupContactForm();
  }

  /* Sticky nav scrolled state */
  function setupNavScrolled() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      nav.classList.toggle('scrolled', y > 12);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* Mobile menu */
  function setupMobileMenu() {
    var toggle = document.getElementById('menuToggle');
    var links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    function setOpen(o) {
      toggle.classList.toggle('active', o);
      links.classList.toggle('active', o);
      toggle.setAttribute('aria-expanded', String(o));
      document.body.style.overflow = o ? 'hidden' : '';
    }
    toggle.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!links.classList.contains('active')); });
    Array.prototype.forEach.call(links.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('active')) { setOpen(false); toggle.focus(); }
    });
  }

  /* Active nav highlighting based on scroll position */
  function setupNavSpy() {
    var sections = ['home','services','about','group','contact']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var links = document.querySelectorAll('.nav-links a[data-nav]');
    if (!sections.length || !links.length) return;

    function setActive(id) {
      links.forEach(function (l) { l.classList.toggle('active', l.dataset.nav === id); });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* Reveal on scroll */
  function setupReveal() {
    var sels = ['.section-head', '.panel-body', '.panel-media', '.feature', '.t-card', '.t-item', '.group-card', '.coverage-list li', '.coverage-map-wrap', '.faq-item', '.contact-info', '.contact-form'];
    var nodes = document.querySelectorAll(sels.join(','));
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('reveal','in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (n, i) {
      n.classList.add('reveal');
      n.style.transitionDelay = (i % 6) * 60 + 'ms';
      io.observe(n);
    });
  }

  /* Counters */
  function setupCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.textContent = formatNum(n); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.dataset.counted) return;
        e.target.dataset.counted = '1';
        animate(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    nodes.forEach(function (n) { io.observe(n); });

    function formatNum(el) {
      var t = parseFloat(el.dataset.count);
      var s = el.dataset.suffix || '';
      return (t % 1 === 0 ? t.toLocaleString() : t.toFixed(1)) + s;
    }
    function animate(el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var hasDecimal = String(target).indexOf('.') !== -1;
      var dur = 1400, start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        var v = target * eased;
        var rendered = hasDecimal ? v.toFixed(1) : (v >= 1000 ? Math.round(v).toLocaleString() : Math.round(v));
        el.textContent = rendered + suffix;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = (hasDecimal ? target.toFixed(1) : target.toLocaleString()) + suffix;
      }
      el.textContent = (hasDecimal ? '0.0' : '0') + suffix;
      requestAnimationFrame(frame);
    }
  }

  /* Services tabs */
  function setupServicesTabs() {
    var tabs = document.querySelectorAll('.tab');
    var panels = document.querySelectorAll('.panel');
    if (!tabs.length) return;
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var key = t.dataset.tab;
        tabs.forEach(function (x) { x.classList.toggle('active', x === t); x.setAttribute('aria-selected', String(x === t)); });
        panels.forEach(function (p) { p.classList.toggle('active', p.dataset.panel === key); });
      });
    });

    // Auto-cycle when not interacted with
    var idx = 0, autoCycle;
    function cycle() {
      idx = (idx + 1) % tabs.length;
      tabs[idx].click();
    }
    function start() { autoCycle = setInterval(cycle, 6500); }
    function stop() { clearInterval(autoCycle); }
    document.querySelector('.services-tabs')?.addEventListener('mouseenter', stop);
    document.querySelector('.services-tabs')?.addEventListener('mouseleave', start);
    if ('IntersectionObserver' in window) {
      var sec = document.getElementById('services');
      if (sec) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
        }, { threshold: 0.3 });
        io.observe(sec);
      }
    }
  }

  /* Coverage map sync between list + svg */
  function setupCoverageMap() {
    var listItems = document.querySelectorAll('#coverageList li');
    var paths = document.querySelectorAll('.coverage-map .state-path');
    if (!listItems.length || !paths.length) return;

    function setActive(state) {
      listItems.forEach(function (li) { li.classList.toggle('active', li.dataset.state === state); });
      paths.forEach(function (p) { p.classList.toggle('active', p.dataset.state === state); });
    }
    listItems.forEach(function (li) {
      li.addEventListener('mouseenter', function () { setActive(li.dataset.state); });
      li.addEventListener('click', function () { setActive(li.dataset.state); });
    });
    paths.forEach(function (p) {
      p.addEventListener('mouseenter', function () { setActive(p.dataset.state); });
      p.addEventListener('click', function () { setActive(p.dataset.state); });
    });
  }

  /* FAQ accordion */
  function setupFAQ() {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(function (i) {
          i.classList.remove('open');
          var b = i.querySelector('.faq-q');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* Contact form */
  function setupContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var success = document.getElementById('formSuccess');
    var btn = document.getElementById('submitBtn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (el) {
        var field = el.closest('.field');
        var ok = el.checkValidity();
        if (field) field.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) { return; }

      var txt = btn.querySelector('.btn-text');
      btn.disabled = true;
      if (txt) txt.textContent = 'Sending…';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.success) {
            form.reset();
            success.hidden = false;
            setTimeout(function () { success.hidden = true; }, 6000);
          } else {
            alert('Sorry, something went wrong. Please email info@srinivasa-group.com.');
          }
        })
        .catch(function () {
          alert('Network error. Please email info@srinivasa-group.com.');
        })
        .finally(function () {
          if (txt) txt.textContent = 'Send message';
          btn.disabled = false;
        });
    });

    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var f = el.closest('.field');
        if (f && el.checkValidity()) f.classList.remove('invalid');
      });
    });
  }

})();
