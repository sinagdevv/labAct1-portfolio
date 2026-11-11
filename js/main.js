/* John Ray Cacananta — portfolio behaviour.
   Everything here is progressive enhancement: the page is complete without it. */
(() => {
  'use strict';

  window.__motionReady = true; // tells the inline <head> guard that reveal styles are safe to keep

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Present time (Manila) for the time circuits ---------- */
  const clockFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function readClock() {
    const p = Object.fromEntries(clockFormat.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { month: p.month.toUpperCase(), day: p.day, year: p.year, hh: p.hour, mm: p.minute };
  }
  function tick() {
    const now = readClock();
    $$('[data-clock]').forEach((el) => {
      if (!el.dataset.scrambling) el.textContent = now[el.dataset.clock];
    });
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Section reveals ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('[data-reveal]').forEach((el) => revealObserver.observe(el));

  /* ---------- Active navigation link ---------- */
  const navLinks = new Map($$('.bar__nav a').map((a) => [a.hash.slice(1), a]));
  const sections = $$('main > section');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((a, key) => {
        if (key === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObserver.observe(s));

  /* ---------- Progress instrument + speedometer (88 mph easter egg) ---------- */
  const bar = $('.progress__bar');
  const odometer = $('.odometer');
  const odoEra = $('.odometer__era');
  const odoSec = $('.odometer__sec');
  const odoMph = $('.odometer__mph b');
  const toast = $('.toast');
  const streak = $('.streak');
  const total = String(sections.length).padStart(2, '0');

  let lastY = scrollY;
  let lastT = performance.now();
  let mph = 0;
  let rafId = 0;
  let fired = false;

  function timeTravel() {
    odometer.classList.add('is-hot');
    toast.textContent = '88 mph — temporal displacement confirmed.';
    toast.classList.add('is-shown');
    if (!reduceMotion) {
      streak.classList.remove('is-active');
      void streak.offsetWidth; // restart the animation
      streak.classList.add('is-active');
    }
    setTimeout(() => toast.classList.remove('is-shown'), 3200);
    setTimeout(() => odometer.classList.remove('is-hot'), 1600);
  }

  function frame(t) {
    const y = scrollY;
    const dt = Math.max(16, t - lastT);
    const speed = Math.abs(y - lastY) / dt; // px per ms
    lastY = y;
    lastT = t;
    // ponytail: 1 px/ms ≈ 32 mph is a feel-based calibration; tune the constant if 88 is too easy/hard.
    mph += (Math.min(99, speed * 32) - mph) * 0.22;

    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    let current = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * 0.4) current = i; });
    odometer.classList.toggle('is-visible', y > innerHeight * 0.6);
    if (current >= 0) {
      odoEra.textContent = sections[current].dataset.era;
      odoSec.textContent = `${String(current + 1).padStart(2, '0')}/${total}`;
    }
    odoMph.textContent = String(Math.round(mph)).padStart(3, '0');

    if (mph >= 88 && !fired) { fired = true; timeTravel(); }

    rafId = mph > 0.5 ? requestAnimationFrame(frame) : 0;
  }
  addEventListener('scroll', () => { if (!rafId) rafId = requestAnimationFrame(frame); }, { passive: true });
  frame(performance.now());

  // Keyboard route to the same easter egg: type "88" anywhere outside a form field.
  let lastEight = 0;
  addEventListener('keydown', (e) => {
    if (e.key !== '8' || e.target.closest('input, textarea')) return;
    const now = Date.now();
    if (now - lastEight < 600) timeTravel();
    lastEight = now;
  });

  /* ---------- Pointer depth (desktop, fine pointers only) ---------- */
  if (finePointer && !reduceMotion) {
    const hero = $('.hero');
    const panel = $('.circuit__panel');
    hero.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      panel.style.setProperty('--rx', `${(-ny * 4).toFixed(2)}deg`);
      panel.style.setProperty('--ry', `${(nx * 6).toFixed(2)}deg`);
    });
    hero.addEventListener('pointerleave', () => {
      panel.style.setProperty('--rx', '0deg');
      panel.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Scroll-scrubbed scenes (GSAP + ScrollTrigger, optional) ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Arrival → departure: the instrument recedes as the visitor leaves the hero.
    // Explicit start values: GSAP must not capture the CSS entrance's first frame (opacity 0).
    gsap.fromTo('.circuit', { y: 0, scale: 1, opacity: 1 }, {
      yPercent: -10, opacity: 0.3, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
})();
