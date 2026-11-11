/* John Ray Cacananta — portfolio behaviour.
   Everything here is progressive enhancement: the page is complete without it. */
(() => {
  'use strict';

  window.__motionReady = true; // tells the inline <head> guard that reveal styles are safe to keep

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const root = document.documentElement;
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

  // Time-circuit readouts cycle briefly, then settle on the real Manila time.
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function settleClock(container) {
    const digits = $$('[data-clock]', container);
    if (reduceMotion || !digits.length) return;
    digits.forEach((d) => { d.dataset.scrambling = '1'; });
    let frames = 0;
    const id = setInterval(() => {
      digits.forEach((d) => {
        d.textContent = d.dataset.clock === 'month'
          ? MONTHS[Math.floor(Math.random() * 12)]
          : String(Math.floor(Math.random() * 10 ** d.textContent.length)).padStart(d.textContent.length, '0');
      });
      if (++frames > 10) {
        clearInterval(id);
        digits.forEach((d) => { delete d.dataset.scrambling; });
        tick();
      }
    }, 55);
  }

  /* ---------- Section reveals ---------- */
  // Stagger siblings only where order carries meaning (grids of peers).
  $$('.skills, .projects__grid, .goals, .creds').forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`));
  });

  /* ---------- Skills map: one segment per category, sized by how many tools it holds ---------- */
  const skillMap = $('.skills-map');
  const skillGroups = $$('.skill');
  if (skillMap && skillGroups.length) {
    const total = $$('.skill li').length;
    skillMap.innerHTML = `<p class="skills-map__label mono">${skillGroups.length} systems <span>·</span> ${total} tools</p><div class="skills-map__bar"></div>`;
    const bar = $('.skills-map__bar', skillMap);
    skillGroups.forEach((group, i) => {
      const seg = document.createElement('span');
      seg.style.flexGrow = $$('li', group).length;
      seg.style.setProperty('--d', `${i * 45}ms`);
      seg.title = group.querySelector('h3').textContent.replace(/^\s*\d+\s*/, '');
      if (group.classList.contains('skill--accent')) seg.classList.add('is-accent');
      bar.append(seg);
      const link = (on) => { seg.classList.toggle('is-hot', on); group.classList.toggle('is-hot', on); };
      [seg, group].forEach((node) => {
        node.addEventListener('pointerenter', () => link(true));
        node.addEventListener('pointerleave', () => link(false));
      });
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      if (entry.target.classList.contains('arrival')) settleClock(entry.target);
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  /* ---------- Active navigation link ---------- */
  const navLinks = new Map($$('.bar__nav a').map((a) => [a.hash.slice(1), a]));
  const navAlias = { experience: 'projects', archive: 'projects' };
  const sections = $$('main > section');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = navAlias[entry.target.id] || entry.target.id;
      navLinks.forEach((a, key) => {
        if (key === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  // Observers start after the intro so they don't run every frame underneath the overlay — and not in the
  // hand-off frame either: they wait for the overlay's fade, or start at once if the visitor scrolls first.
  let observing = false;
  const startObservers = () => {
    if (observing) return;
    observing = true;
    $$('[data-reveal]').forEach((el) => revealObserver.observe(el));
    sections.forEach((s) => navObserver.observe(s));
  };
  if (root.classList.contains('intro-on')) {
    document.addEventListener('sinag:intro-end', () => {
      setTimeout(startObservers, 750);
      addEventListener('scroll', startObservers, { once: true, passive: true });
    }, { once: true });
    setTimeout(startObservers, 9000); // matches the <head> failsafe
  } else {
    startObservers();
  }

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

  /* ---------- Hero arrival: present-time circuits settle once the hero is visible ---------- */
  const heroCircuit = $('.circuit__row--now');
  if (root.classList.contains('intro-on')) {
    document.addEventListener('sinag:intro-end', () => setTimeout(() => settleClock(heroCircuit), 700), { once: true });
  } else {
    setTimeout(() => settleClock(heroCircuit), 750);
  }

  $('.replay')?.addEventListener('click', () => window.SinagIntro?.play());

  /* ---------- Pointer depth (desktop, fine pointers only) ---------- */
  if (finePointer && !reduceMotion) {
    const hero = $('.hero');
    const panel = $('.circuit__panel');
    const light = $('.hero__light');
    hero.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      panel.style.setProperty('--rx', `${(-ny * 4).toFixed(2)}deg`);
      panel.style.setProperty('--ry', `${(nx * 6).toFixed(2)}deg`);
      light.style.transform = `translate3d(${nx * 6}vw, ${ny * 5}vh, 0)`;
    });
    hero.addEventListener('pointerleave', () => {
      panel.style.setProperty('--rx', '0deg');
      panel.style.setProperty('--ry', '0deg');
      light.style.transform = '';
    });

    // Project previews: light follows the pointer; the framed window tilts a degree or two.
    $$('.project__media').forEach((media) => {
      media.addEventListener('pointermove', (e) => {
        const r = media.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        media.style.setProperty('--mx', `${(nx + 0.5) * 100}%`);
        media.style.setProperty('--my', `${(ny + 0.5) * 100}%`);
        media.style.setProperty('--rx', `${(-ny * 3).toFixed(2)}deg`);
        media.style.setProperty('--ry', `${(nx * 4).toFixed(2)}deg`);
      });
      media.addEventListener('pointerleave', () => {
        media.style.setProperty('--rx', '0deg');
        media.style.setProperty('--ry', '0deg');
      });
    });

    // Portrait: the plate tilts slightly and the photo drifts against it, like looking through glass.
    const portrait = $('.portrait__frame');
    if (portrait) {
      portrait.addEventListener('pointermove', (e) => {
        const r = portrait.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        portrait.style.setProperty('--rx', `${(-ny * 4).toFixed(2)}deg`);
        portrait.style.setProperty('--ry', `${(nx * 5).toFixed(2)}deg`);
        portrait.style.setProperty('--px', `${(-nx * 8).toFixed(1)}px`);
        portrait.style.setProperty('--py', `${(-ny * 8).toFixed(1)}px`);
      });
      portrait.addEventListener('pointerleave', () => {
        ['--rx', '--ry'].forEach((v) => portrait.style.setProperty(v, '0deg'));
        ['--px', '--py'].forEach((v) => portrait.style.setProperty(v, '0px'));
      });
    }
  }

  /* ---------- Scroll-scrubbed scenes (GSAP + ScrollTrigger, optional) ---------- */
  // Creating triggers measures the whole page (forced layout), so while the intro is playing this
  // waits until it has ended and the browser is idle — the intro gets the main thread to itself.
  let scenesReady = false;
  function initScenes() {
    if (scenesReady || !window.gsap || !window.ScrollTrigger || reduceMotion) return;
    scenesReady = true;
    gsap.registerPlugin(ScrollTrigger);

    // Arrival → departure: the instrument recedes as the visitor leaves the hero.
    // Explicit start values: GSAP must not capture the CSS entrance's first frame (opacity 0).
    gsap.fromTo('.circuit', { y: 0, scale: 1, opacity: 1 }, {
      yPercent: -10, opacity: 0.3, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // Experience: each date circuit lights while its role is being read.
    $('.timeline').classList.add('is-tracked');
    $$('.timeline__item').forEach((item) => {
      ScrollTrigger.create({ trigger: item, start: 'top 65%', end: 'bottom 35%', toggleClass: 'is-active' });
    });

    // Experience: the timeline line charges as it is read.
    gsap.fromTo('.timeline', { '--t': 0 }, {
      '--t': 1, ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 75%', end: 'bottom 60%', scrub: 0.4 },
    });

    // Future: the horizon light widens as Career Goals arrives.
    gsap.fromTo('#goals', { '--f': 0 }, {
      '--f': 1, ease: 'none',
      scrollTrigger: { trigger: '#goals', start: 'top bottom', end: 'top 25%', scrub: 0.4 },
    });

    // Subtle depth: each framed window drifts against its backdrop while scrolling — desktop only.
    // Applied to the wrapper so it never crops the screenshot or fights the hover lift on .shot.
    gsap.matchMedia().add('(min-width: 900px)', () => {
      $$('.shot-wrap').forEach((wrap) => {
        gsap.fromTo(wrap, { y: 14 }, {
          y: -14, ease: 'none',
          scrollTrigger: { trigger: wrap.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });

    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load,resize' });
    ScrollTrigger.refresh();
  }

  const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  if (root.classList.contains('intro-on')) {
    document.addEventListener('sinag:intro-end', () => setTimeout(() => whenIdle(initScenes), 800), { once: true });
    setTimeout(() => whenIdle(initScenes), 9500); // matches the <head> failsafe if the intro never ran
  } else {
    whenIdle(initScenes);
  }

  /* ---------- Contact form: honest mailto workflow ---------- */
  const form = $('#contact-form');
  if (form) {
    form.noValidate = true; // replace browser bubbles with inline, screen-reader-friendly messages
    const status = $('#cf-status');
    const rules = {
      name: (el) => (el.value.trim() ? '' : 'Please enter your name.'),
      email: (el) => {
        if (!el.value.trim()) return 'Please enter your email address.';
        if (el.validity.typeMismatch) return 'That email address looks incomplete — for example, name@example.com.';
        return '';
      },
      message: (el) => (el.value.trim().length >= 10 ? '' : 'Please write a message of at least 10 characters.'),
    };
    const fields = [...form.elements].filter((el) => el.name in rules);

    const check = (el) => {
      const error = rules[el.name](el);
      $(`#${el.getAttribute('aria-describedby')}`).textContent = error;
      if (error) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
      return !error;
    };

    fields.forEach((el) => {
      el.addEventListener('input', () => { if (el.hasAttribute('aria-invalid')) check(el); });
      el.addEventListener('blur', () => { if (el.value) check(el); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = fields.filter((el) => !check(el));
      if (invalid.length) {
        status.textContent = `Please fix ${invalid.length} field${invalid.length > 1 ? 's' : ''} above.`;
        invalid[0].focus();
        return;
      }
      const [name, email, message] = fields.map((el) => el.value.trim());
      const subject = `Portfolio message from ${name}`;
      const body = `${message}\n\n— ${name}\n${email}`;
      window.location.href = `mailto:johnray.cacananta@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Your email app should now open with this message drafted. Nothing has been sent yet — press send there. If no app opened, write to johnray.cacananta@gmail.com directly.';
    });
  }
})();
