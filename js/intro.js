/* The DeLorean arrival — a ~5s intro that plays once per session.
   System online → car revealed → 0–88 mph → temporal displacement → SINAG mark → hero.
   Always skippable (button, Esc, scroll); a <head> failsafe removes it even if this file never runs. */
(() => {
  'use strict';

  const root = document.documentElement;
  const intro = document.getElementById('intro');
  if (!intro) return;

  const $ = (sel) => intro.querySelector(sel);
  const $$ = (sel) => [...intro.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'sinag-intro';

  const el = {
    stage: $('.intro__stage'), glow: $('.intro__glow'), hud: $('.intro__hud'), leds: $$('.intro__leds i'),
    status: $('.intro__status'), scene: $('.intro__scene'), floor: $('.intro__floor'), lanes: $('.intro__lanes'),
    fires: $$('.intro__fire'), portal: $('.intro__portal'), car: $('.intro__car'), trails: $$('.intro__trail'),
    beam: $('.dmc-beam'), head: $('.dmc-head'), sheen: $('.dmc-sheen'), spins: $$('.dmc-spin'),
    arcs: $$('.dmc-arcs polyline'), speedo: $('.intro__speedo'), speedNum: $('.intro__speedo b'),
    flash: $('.intro__flash'), brand: $('.intro__brand'), axis: $('.mk-axis'), strokes: $$('.mk-s'),
    dot: $('.mk-dot'), word: $('.intro__word'), name: $('.intro__name'), role: $('.intro__role'),
    skip: $('.intro__skip'),
  };

  const state = { speed: 0, angle: 0, lane: 0 };
  let tl = null;
  let done = true;

  // Wheels, road, and electrical arcs all read the same speed value, so they stay in sync.
  function drive(time, deltaMs) {
    const dt = Math.min(deltaMs, 50) / 1000;
    state.angle = (state.angle + state.speed * 14 * dt) % 360;
    state.lane = (state.lane + state.speed * 26 * dt) % 160;
    el.spins.forEach((g) => { g.style.transform = `rotate(${state.angle}deg)`; });
    el.lanes.style.transform = `rotateX(74deg) translate3d(${-state.lane}px, 0, 0)`;
    el.speedNum.textContent = String(Math.round(state.speed)).padStart(2, '0');

    // Arcs only appear near the top of the build; redrawn ~12×/s rather than every frame.
    const charge = Math.max(0, (state.speed - 58) / 30);
    if (charge > 0 && Math.random() < 0.22) {
      el.arcs.forEach((pl, i) => {
        const y0 = 40 + i * 60;
        let pts = '';
        for (let x = -40; x <= 880; x += 55) pts += `${x},${y0 + (Math.random() - 0.5) * 26 * charge} `;
        pl.setAttribute('points', pts);
        pl.style.opacity = Math.random() < charge ? 0.3 + charge * 0.3 : 0;
      });
    } else if (charge === 0) {
      el.arcs.forEach((pl) => { pl.style.opacity = 0; });
    }
  }

  function finish(fast) {
    if (done) return;
    done = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked: intro may replay, never blocks */ }
    gsap.ticker.remove(drive);
    if (tl) tl.kill();
    removeListeners();
    root.classList.remove('intro-on'); // hero entrance plays underneath the fading overlay
    document.dispatchEvent(new CustomEvent('sinag:intro-end'));
    gsap.to(intro, {
      autoAlpha: 0, scale: 1.015, duration: fast ? 0.3 : 0.7, ease: 'power2.inOut',
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
    Object.assign(state, { speed: 0, angle: 0, lane: 0 });
    gsap.set(intro, { autoAlpha: 1, scale: 1 });
    gsap.set([el.hud, el.floor, el.car, el.speedo, el.brand, el.name, el.role, el.word], { autoAlpha: 0 });
    gsap.set(el.leds, { opacity: 0.15 });
    gsap.set(el.scene, { scale: 1.08, y: 0, autoAlpha: 1 });
    gsap.set(el.car, { xPercent: -4, x: 0, scaleX: 1, skewX: 0, transformOrigin: '50% 100%' });
    gsap.set(el.trails, { scaleX: 0 });
    gsap.set([el.beam, el.head], { opacity: 0 });
    gsap.set(el.sheen, { x: 0 });
    gsap.set(el.glow, { opacity: 0.15 });
    gsap.set(el.portal, { scaleY: 0, scaleX: 1, autoAlpha: 1 });
    gsap.set(el.flash, { opacity: 0 });
    gsap.set(el.fires, { scaleX: 0, opacity: 1 });
    gsap.set(el.strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(el.axis, { scaleX: 0, transformOrigin: '50% 50%' });
    gsap.set(el.dot, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(el.name, { y: 16 });
    gsap.set(el.role, { y: 10 });
    el.status.textContent = 'Temporal system // online';
    el.strokes.forEach((p) => p.setAttribute('pathLength', '1'));
  }

  function play() {
    done = false;
    root.classList.add('intro-on', 'intro-playing');
    scrollTo(0, 0);
    reset();
    addListeners();

    if (reduceMotion) { // replay for reduced-motion visitors: the mark, held briefly, no movement
      gsap.set([el.brand, el.name, el.role, el.word], { autoAlpha: 1, y: 0 });
      gsap.set(el.strokes, { strokeDashoffset: 0 });
      gsap.set([el.axis, el.dot], { scale: 1, scaleX: 1 });
      gsap.set(el.scene, { autoAlpha: 0 });
      gsap.delayedCall(1, () => finish(false));
      return;
    }

    gsap.ticker.add(drive);
    const status = (text) => () => { el.status.textContent = text; };

    tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => finish(false) })
      // 01 — System initialization
      .to(el.hud, { autoAlpha: 1, duration: 0.4 }, 0)
      .to(el.leds, { opacity: 1, duration: 0.12, stagger: 0.14, ease: 'steps(2)' }, 0.1)
      // 02 — Reveal: light sweeps the steel, headlights power on, the camera settles
      .to(el.floor, { autoAlpha: 1, duration: 0.8 }, 0.3)
      .to(el.car, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.35)
      .to(el.sheen, { x: 1300, duration: 1.2, ease: 'power2.inOut' }, 0.35)
      .to(el.scene, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0.3)
      .to(state, { speed: 6, duration: 0.8, ease: 'power1.inOut' }, 0.4)
      .to([el.head, el.beam], { keyframes: [{ opacity: 0.7 }, { opacity: 0.2 }, { opacity: 1 }], duration: 0.3, ease: 'none' }, 0.85)
      .to(el.speedo, { autoAlpha: 1, duration: 0.4 }, 0.9)
      // 03 — Acceleration: 0 → 88
      .add(status('Accelerating'), 1.15)
      .to(state, { speed: 88, duration: 1.75, ease: 'power2.in' }, 1.15)
      .to(el.trails, { scaleX: 1, duration: 1.75, ease: 'power2.in', stagger: 0.08 }, 1.15)
      .to(el.car, { xPercent: 4, skewX: -4, duration: 1.75, ease: 'power2.in' }, 1.15)
      .to(el.glow, { opacity: 1, duration: 1.75, ease: 'power2.in' }, 1.15)
      // 04 — Temporal displacement
      .add(status('88 mph // displacement'), 2.9)
      .to(el.portal, { scaleY: 1, duration: 0.22, ease: 'power2.out' }, 2.88)
      .to(el.car, { x: () => innerWidth * 0.55, scaleX: 1.5, autoAlpha: 0, duration: 0.34, ease: 'power3.in' }, 2.92)
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

  // Only start if the <head> gate decided this session should see it.
  if (root.classList.contains('intro-on')) {
    if (window.gsap) play();
    else root.classList.remove('intro-on');
  }

  window.SinagIntro = { play: () => { if (window.gsap && done) play(); } };
})();
