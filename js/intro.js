/* The DeLorean arrival — a ~5s intro that plays once per session.
   System online → car revealed → 0–88 mph → temporal displacement → SINAG mark → hero.
   Always skippable (button, Esc, scroll); a <head> failsafe removes it even if this file never runs.

   Rendering budget: the car body is a static SVG painted once. Everything that moves is a composited
   layer animated with transform/opacity (wheel spokes, road, light sweep, trails, beam, portal, flash).
   No per-frame JavaScript except the arc redraw, which runs ~10×/s for under a second. */
(() => {
  'use strict';

  const root = document.documentElement;
  const intro = document.getElementById('intro');
  if (!intro) return;

  const $ = (sel) => intro.querySelector(sel);
  const $$ = (sel) => [...intro.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Lighter effects on small screens and modest hardware; the sequence and timing stay identical.
  const lite = matchMedia('(max-width: 899px)').matches
    || (navigator.hardwareConcurrency || 8) <= 4
    || (navigator.deviceMemory || 8) <= 4;
  const KEY = 'sinag-intro';
  if (lite) intro.classList.add('is-lite');
  // ScrollTrigger refreshes (a full-page forced layout) on window 'load', which can land mid-intro.
  // Nothing needs measuring until the intro ends; main.js refreshes once it creates its triggers.
  if (window.ScrollTrigger && root.classList.contains('intro-on')) ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,resize' });

  const el = {
    glow: $('.intro__glow'), hud: $('.intro__hud'), leds: $$('.intro__leds i'), status: $('.intro__status'),
    scene: $('.intro__scene'), floor: $('.intro__floor'), lanes: $('.intro__lanes'), fires: $$('.intro__fire'),
    portal: $('.intro__portal'), car: $('.intro__car'), trails: $$('.intro__trail'), beam: $('.dmc-beam'),
    sheen: $('.dmc-sheen i'), spokes: $$('.dmc-wheel svg'), blurs: $$('.dmc-blur'),
    arcs: $$('.dmc-arcs polyline').slice(0, lite ? 1 : 3),
    speedo: $('.intro__speedo'), speedNum: $('.intro__speedo b'), flash: $('.intro__flash'),
    brand: $('.intro__brand'), axis: $('.mk-axis'), strokes: $$('.mk-s'), dot: $('.mk-dot'),
    word: $('.intro__word'), name: $('.intro__name'), role: $('.intro__role'), skip: $('.intro__skip'),
  };

  const speed = { mph: 0 };
  let shownMph = -1;
  let tl = null;
  let done = true;
  let lastArc = 0;

  // Only touches the DOM when the displayed integer changes (~88 writes in total).
  function renderSpeed() {
    const v = Math.round(speed.mph);
    if (v !== shownMph) { shownMph = v; el.speedNum.textContent = String(v).padStart(2, '0'); }
  }

  // Electrical arcs near the top of the build. Throttled; the layer is tiny and separate from the car.
  function arcs(time) {
    if (time - lastArc < (lite ? 0.14 : 0.09)) return;
    lastArc = time;
    const charge = Math.max(0, (speed.mph - 58) / 30);
    el.arcs.forEach((pl, i) => {
      if (Math.random() > charge) { pl.style.opacity = 0; return; }
      const y0 = 40 + i * 60;
      let pts = '';
      for (let x = -40; x <= 880; x += 55) pts += `${x},${(y0 + (Math.random() - 0.5) * 26 * charge).toFixed(1)} `;
      pl.setAttribute('points', pts);
      pl.style.opacity = 0.3 + charge * 0.3;
    });
  }
  const stopArcs = () => { gsap.ticker.remove(arcs); el.arcs.forEach((pl) => { pl.style.opacity = 0; }); };

  function finish(fast) {
    if (done) return;
    done = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked: intro may replay, never blocks */ }
    stopArcs();
    if (tl) { tl.kill(); tl = null; }
    removeListeners();
    root.classList.remove('intro-on'); // hero entrance plays underneath the fading overlay
    document.dispatchEvent(new CustomEvent('sinag:intro-end'));
    gsap.to(intro, {
      autoAlpha: 0, duration: fast ? 0.3 : 0.7, ease: 'power2.inOut',
      onComplete: () => { root.classList.remove('intro-playing'); gsap.set(intro, { clearProps: 'all' }); },
    });
  }

  const skip = () => finish(true);
  const onKey = (e) => { if (e.key === 'Escape') skip(); };
  function addListeners() {
    el.skip.addEventListener('click', skip);
    addEventListener('keydown', onKey);
    addEventListener('wheel', skip, { passive: true });
    addEventListener('touchmove', skip, { passive: true });
  }
  function removeListeners() {
    el.skip.removeEventListener('click', skip);
    removeEventListener('keydown', onKey);
    removeEventListener('wheel', skip);
    removeEventListener('touchmove', skip);
  }

  function reset() {
    speed.mph = 0; shownMph = -1; renderSpeed();
    gsap.set(intro, { autoAlpha: 1 });
    gsap.set([el.hud, el.floor, el.car, el.speedo, el.brand, el.name, el.role, el.word], { autoAlpha: 0 });
    gsap.set(el.leds, { opacity: 0.15 });
    gsap.set(el.scene, { scale: 1.08 });
    gsap.set(el.car, { xPercent: -4, x: 0, scaleX: 1, skewX: 0, transformOrigin: '50% 100%' });
    gsap.set(el.lanes, { x: 0, rotationX: 74, transformOrigin: '50% 0%' });
    gsap.set(el.spokes, { rotation: 0, transformOrigin: '50% 50%' });
    gsap.set(el.blurs, { opacity: 0 });
    gsap.set(el.trails, { scaleX: 0 });
    gsap.set(el.beam, { opacity: 0 });
    gsap.set(el.sheen, { xPercent: 0 });
    gsap.set(el.glow, { opacity: 0.15 });
    gsap.set(el.portal, { scaleY: 1, scaleX: 1, opacity: 0.001, visibility: 'visible' }); // warm, invisible
    gsap.set(el.flash, { opacity: 0.001 }); // warm: rasterised during scene 1, not at the jump
    gsap.set(el.fires, { scaleX: 1, opacity: 0.001 }); // warm, invisible
    el.strokes.forEach((p) => p.setAttribute('pathLength', '1'));
    gsap.set(el.strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(el.axis, { scaleX: 0, transformOrigin: '50% 50%' });
    gsap.set(el.dot, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(el.name, { y: 16 });
    gsap.set(el.role, { y: 10 });
    el.status.textContent = 'Temporal system // online';
  }

  // Overlay up, initial frame set, skip controls live — before anything animates.
  function begin() {
    done = false;
    root.classList.add('intro-on', 'intro-playing');
    scrollTo(0, 0);
    reset();
    addListeners();
  }

  function play() {
    if (!done) return; // never two timelines at once
    begin();
    run();
  }

  function run() {
    if (done) return; // skipped while waiting to start
    if (reduceMotion) { // replay for reduced-motion visitors: the mark, held briefly, no movement
      gsap.set([el.brand, el.name, el.role, el.word], { autoAlpha: 1, y: 0 });
      gsap.set(el.strokes, { strokeDashoffset: 0 });
      gsap.set([el.axis, el.dot], { scale: 1, scaleX: 1 });
      gsap.set(el.scene, { autoAlpha: 0 });
      tl = gsap.timeline().to({}, { duration: 1, onComplete: () => finish(false) });
      return;
    }

    const status = (text) => () => { el.status.textContent = text; };
    const ACC = 1.75; // seconds from 6 to 88 mph
    // Wheel and road travel are the integrals of speed: power3.in distance has a power2.in velocity,
    // ending exactly at the 88 mph rate (1,232°/s for the wheels, 2,288px/s for the road).
    const WHEEL_ACC = (88 * 14 * ACC) / 3;
    const ROAD_ACC = (88 * 26 * ACC) / 3;

    tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => finish(false) })
      // 01 — System initialization
      .to(el.hud, { autoAlpha: 1, duration: 0.4 }, 0)
      .to(el.leds, { opacity: 1, duration: 0.12, stagger: 0.14, ease: 'steps(2)' }, 0.1)
      // 02 — Reveal: light sweeps the steel, headlights power on, the camera settles, the car rolls
      .to(el.floor, { autoAlpha: 1, duration: 0.8 }, 0.3)
      .to(el.car, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.35)
      .to(el.sheen, { xPercent: 470, duration: 1.2, ease: 'power2.inOut' }, 0.35)
      .to(el.scene, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0.3)
      .to(speed, { mph: 6, duration: 0.8, ease: 'power1.inOut', onUpdate: renderSpeed }, 0.35)
      .to(el.spokes, { rotation: 70, duration: 0.8, ease: 'power1.in' }, 0.35)
      .to(el.lanes, { x: -130, duration: 0.8, ease: 'power1.in' }, 0.35)
      .to(el.beam, { keyframes: [{ opacity: 0.7 }, { opacity: 0.2 }, { opacity: 1 }], duration: 0.3, ease: 'none' }, 0.85)
      .to(el.speedo, { autoAlpha: 1, duration: 0.4 }, 0.9)
      // 03 — Acceleration: 6 → 88
      .add(status('Accelerating'), 1.15)
      .to(speed, { mph: 88, duration: ACC, ease: 'power2.in', onUpdate: renderSpeed }, 1.15)
      .to(el.spokes, { rotation: `+=${WHEEL_ACC}`, duration: ACC, ease: 'power3.in' }, 1.15)
      .to(el.lanes, { x: `-=${ROAD_ACC}`, duration: ACC, ease: 'power3.in' }, 1.15)
      .to(el.blurs, { opacity: 0.85, duration: ACC, ease: 'power3.in' }, 1.15)
      .to(el.trails, { scaleX: 1, duration: ACC, ease: 'power2.in', stagger: 0.08 }, 1.15)
      .to(el.car, { xPercent: 4, skewX: -4, duration: ACC, ease: 'power2.in' }, 1.15)
      .to(el.glow, { opacity: 1, duration: ACC, ease: 'power2.in' }, 1.15)
      .add(() => gsap.ticker.add(arcs), 2.3)
      // 04 — Temporal displacement (road keeps streaming at full speed while the car leaves)
      .add(status('88 mph // displacement'), 2.9)
      .to(el.lanes, { x: `-=${88 * 26 * 0.45}`, duration: 0.45, ease: 'none' }, 2.9)
      .set(el.portal, { scaleY: 0, opacity: 1 }, 2.88)
      .to(el.portal, { scaleY: 1, duration: 0.22, ease: 'power2.out' }, 2.88)
      .to(el.car, { x: () => innerWidth * 0.55, scaleX: 1.5, autoAlpha: 0, duration: 0.34, ease: 'power3.in' }, 2.92)
      .add(stopArcs, 3.05)
      .set(el.fires, { scaleX: 0, opacity: 1 }, 2.95)
      .to(el.fires, { scaleX: 1, duration: 0.3, ease: 'power2.out', stagger: 0.04 }, 2.95)
      .to(el.trails, { scaleX: 0, duration: 0.3, ease: 'power2.in' }, 3.1)
      .to(el.flash, { keyframes: [{ opacity: 0.45, duration: 0.12, ease: 'power1.out' }, { opacity: 0, duration: 0.55, ease: 'power2.out' }] }, 3.2)
      .to(el.portal, { scaleX: 0, duration: 0.25, ease: 'power3.in' }, 3.22)
      .to(el.fires, { opacity: 0, duration: 0.7, ease: 'power1.out' }, 3.3)
      .to([el.hud, el.speedo, el.floor], { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 3.25)
      // SINAG mark resolves out of the light
      .set(el.brand, { autoAlpha: 1 }, 3.3)
      .to(el.axis, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, 3.3)
      .to(el.strokes, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.12 }, 3.38)
      .to(el.dot, { scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, 3.75)
      .to(el.word, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 3.8)
      .to(el.name, { autoAlpha: 1, y: 0, duration: 0.6 }, 3.95)
      .to(el.role, { autoAlpha: 1, y: 0, duration: 0.6 }, 4.05)
      .to({}, { duration: 0.45 }); // hold the final frame before handing off to the hero
  }

  // Start once webfonts are ready (so the speedometer never reflows mid-sequence) and after the
  // rest of the page's deferred scripts have run — capped so a slow font never delays the intro.
  function start() {
    begin();
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 700))])
      .then(() => requestAnimationFrame(() => requestAnimationFrame(run)));
  }

  // Only start if the <head> gate decided this session should see it.
  if (root.classList.contains('intro-on')) {
    if (window.gsap) start();
    else root.classList.remove('intro-on');
  }

  window.SinagIntro = { play: () => { if (window.gsap && done) play(); } };
})();
