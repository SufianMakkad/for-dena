
  // ---- Entry overlay ----
  // Tapping this button is a real, direct user gesture, so it's used to
  // start the music with total certainty — no autoplay-policy guessing —
  // in the same click that fades the blur away. fadeInMusic() is defined
  // further down but hoisted (function declaration), so it's safe to call
  // from here.
  const entryOverlay = document.getElementById('entry-overlay');
  const entryBtn = document.getElementById('entry-btn');
  if (entryBtn && entryOverlay){
    entryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      forceAudiblePlay();
      entryOverlay.classList.add('entered');
    }, { once: true });
  }

  // ---- Mouse parallax, desktop only ----
  // matchMedia('(pointer: fine)') is true on devices with a mouse/trackpad,
  // false on touch-only devices. This is how we make it PC-only.
  const stage = document.getElementById('stage');
  const bgLayer = document.getElementById('bg-layer');
  const flowerLayer = document.getElementById('flower-layer');
  const nextScreenParallax = document.getElementById('next-screen-parallax');
  // All the tap-to-reveal story screens (placeholder + screens 4-7) get
  // the same text-layer parallax as page 2 — collected into one list so
  // adding a future page just means adding its element here.
  const storyParallaxEls = [
    document.getElementById('placeholder-parallax'),
    document.getElementById('parallax-4'),
    document.getElementById('parallax-5'),
    document.getElementById('parallax-6'),
    document.getElementById('parallax-7'),
    document.getElementById('parallax-8'),
    document.getElementById('reveal-parallax')
  ].filter(Boolean);
  const isDesktop = window.matchMedia('(pointer: fine)').matches;

  if (isDesktop) {
    window.addEventListener('mousemove', (e) => {
      // how far the mouse is from the center of the screen, as a fraction (-1 to 1)
      const xFraction = (e.clientX / window.innerWidth - 0.5) * 2;
      const yFraction = (e.clientY / window.innerHeight - 0.5) * 2;

      // three depth layers, each with its own drift amount:
      // envelope (closest, moves most) > flowers (middle) > background (furthest, moves least)
      const maxDriftFg = 14;      // envelope
      const maxDriftFlowers = 10; // flowers — slightly slower than the envelope
      const maxDriftBg = 4;       // background
      const maxDriftText = 16;     // slide 2 text + buttons — noticeably more than the background

      stage.style.transform = `translate(${xFraction * maxDriftFg}px, ${yFraction * maxDriftFg}px)`;
      flowerLayer.style.transform = `translate(${xFraction * maxDriftFlowers}px, ${yFraction * maxDriftFlowers}px)`;
      bgLayer.style.transform = `translate(${xFraction * maxDriftBg}px, ${yFraction * maxDriftBg}px)`;
      nextScreenParallax.style.setProperty('--parallax-x', `${xFraction * maxDriftText}px`);
      nextScreenParallax.style.setProperty('--parallax-y', `${yFraction * maxDriftText}px`);
      storyParallaxEls.forEach((el) => {
        el.style.setProperty('--parallax-x', `${xFraction * maxDriftText}px`);
        el.style.setProperty('--parallax-y', `${yFraction * maxDriftText}px`);
      });
    });
  } else {
    // ---- Tilt parallax, phones only ----
    // Same idea as the mousemove effect above, but driven by the device's
    // gyroscope: tilting the phone left/right/forward/back shifts the
    // three depth layers instead of a mouse position.
    const maxDriftFg = 14;
    const maxDriftFlowers = 10;
    const maxDriftBg = 4;
    const maxDriftText = 16;     // slide 2 text + buttons — noticeably more than the background
    const maxTiltDeg = 20; // how far she has to tilt to hit max drift

    function applyTilt(betaDeg, gammaDeg){
      // gamma: left/right tilt (-90 to 90), beta: front/back tilt (-180 to 180)
      const xFraction = Math.max(-1, Math.min(1, gammaDeg / maxTiltDeg));
      const yFraction = Math.max(-1, Math.min(1, (betaDeg - 30) / maxTiltDeg)); // ~30° is a natural "holding the phone" angle, treated as center

      stage.style.transform = `translate(${xFraction * maxDriftFg}px, ${yFraction * maxDriftFg}px)`;
      flowerLayer.style.transform = `translate(${xFraction * maxDriftFlowers}px, ${yFraction * maxDriftFlowers}px)`;
      bgLayer.style.transform = `translate(${xFraction * maxDriftBg}px, ${yFraction * maxDriftBg}px)`;
      nextScreenParallax.style.setProperty('--parallax-x', `${xFraction * maxDriftText}px`);
      nextScreenParallax.style.setProperty('--parallax-y', `${yFraction * maxDriftText}px`);
      storyParallaxEls.forEach((el) => {
        el.style.setProperty('--parallax-x', `${xFraction * maxDriftText}px`);
        el.style.setProperty('--parallax-y', `${yFraction * maxDriftText}px`);
      });
    }


    function handleOrientation(e){
      if (e.beta === null || e.gamma === null) return;
      applyTilt(e.beta, e.gamma);
    }

    function startTiltListening(){
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // iOS 13+ requires an explicit permission prompt, and that prompt must
    // be triggered directly from a user gesture (a tap). Android and older
    // iOS just start listening right away, no prompt needed.
    const needsIOSPermission =
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function';

    if (needsIOSPermission) {
      let askedForTiltPermission = false;
      document.addEventListener('click', function requestTiltOnce(){
        if (askedForTiltPermission) return;
        askedForTiltPermission = true;
        DeviceOrientationEvent.requestPermission()
          .then((result) => {
            if (result === 'granted') startTiltListening();
          })
          .catch(() => {});
      }, { once: true });
    } else {
      startTiltListening();
    }
  }

  // ---- Page indicator dots ----
  // TOTAL_PAGES + currentPageIndex track where she is in the journey.
  // Bump TOTAL_PAGES (and add a matching .dot in the HTML) each time a
  // new page is added.
  const TOTAL_PAGES = 10; // envelope (0) + next-screen (1) + placeholder/3 (2) + screen-6/7/4/5/8 in that order (3-7) + letterbox reveal (8) + discord (9)
  let currentPageIndex = 0;

  function updateDots(){
    document.querySelectorAll('#page-dots .dot').forEach((dot) => {
      const idx = parseInt(dot.dataset.page, 10);
      dot.classList.toggle('active', idx === currentPageIndex);
    });
  }
  updateDots();

  // ---- Tap-to-open (mirrors the hover effect for touch devices) ----
  // Hover already opens the flap + reveals the tulip on desktop. Tapping
  // toggles the same "open" state via a class, so it works with touch too.
  const envelope = document.getElementById('envelope');
  let hasTransitioned = false;
  envelope.addEventListener('click', () => {
    envelope.classList.toggle('is-open');
    // Only move to the next screen the first time it's opened.
    if (envelope.classList.contains('is-open') && !hasTransitioned) {
      hasTransitioned = true;
      // Give the flap-opening / tulip-reveal animation a moment to play
      // before the whole scene fades out, so it doesn't feel abrupt.
      setTimeout(() => {
        document.body.classList.add('transitioning');
        currentPageIndex = 1;
        updateDots();
        startStory();
        // The hint's done its job once she's moved past the home screen —
        // it should never come back, even if she goes back to the envelope.
        const hint = document.getElementById('song-hint');
        if (hint) hint.classList.add('hidden');
      }, 550);
    }
  });

  // ---- Back button ----
  // Reverses the envelope-open transition: fades the next screen out,
  // fades the envelope scene back in, and resets the envelope + dots so
  // she can open it again if she wants. Swaps 'transitioning' for
  // 'closing' (rather than just removing 'transitioning') so the CSS
  // reverse-transition rules kick in and it animates instead of snapping.
  const backBtn = document.getElementById('back-btn');
  const CLOSE_ANIM_MS = 650; // slightly longer than the 0.6s CSS transition
  backBtn.addEventListener('click', () => {
    document.body.classList.remove('transitioning');
    document.body.classList.add('closing');
    envelope.classList.remove('is-open');
    hasTransitioned = false;
    currentPageIndex = 0;
    updateDots();
    resetStory();

    setTimeout(() => {
      document.body.classList.remove('closing');
    }, CLOSE_ANIM_MS);
  });

  // ---- Auto-scroll as story text grows ----
  // Each story screen scrolls internally (overflow-y:auto) once its
  // content grows taller than the viewport. Rather than making her
  // scroll manually to see the newest line or the "keep going" button,
  // this eases the container's scroll position up just enough to bring
  // a given anchor element (the tap hint, or the forward button once
  // revealed) comfortably into view.
  // Slow, hand-eased scroll (rather than the browser's native 'smooth'
  // behavior, which is quick and varies from browser to browser). Runs
  // over a fixed duration with an ease-in-out curve so each new line
  // drifts up gently instead of snapping into place.
  const SCROLL_EASE_MS = 900;

  function easeInOutCubic(t){
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Animates a story-track element's translateY offset (never real
  // scrolling — the outer screen is overflow:hidden, so no scrollbar can
  // ever appear). trackEl.dataset.trackOffset holds the current push-up
  // amount in px so repeated calls stack correctly instead of resetting.
  function animateTrackTo(trackEl, targetOffset){
    const startOffset = parseFloat(trackEl.dataset.trackOffset || '0');
    const distance = targetOffset - startOffset;
    if (Math.abs(distance) < 1) return;

    // Cancel any in-flight push-up on this track so rapid taps don't
    // fight each other and cause jitter.
    if (trackEl._scrollAnimFrame){
      cancelAnimationFrame(trackEl._scrollAnimFrame);
    }

    const startTime = performance.now();
    function step(now){
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / SCROLL_EASE_MS);
      const offset = startOffset + distance * easeInOutCubic(t);
      trackEl.dataset.trackOffset = String(offset);
      trackEl.style.transform = `translateY(${-offset}px)`;
      if (t < 1){
        trackEl._scrollAnimFrame = requestAnimationFrame(step);
      } else {
        trackEl._scrollAnimFrame = null;
      }
    }
    trackEl._scrollAnimFrame = requestAnimationFrame(step);
  }

  // Only pushes the track up if the newly-revealed anchor (the tap hint,
  // or the forward button once revealed) would otherwise sit below the
  // container's visible bottom edge — i.e. only when actually needed.
  // Short stories that never fill the screen never move at all.
  function easeAnchorIntoView(container, trackEl, anchorRect){
    const containerRect = container.getBoundingClientRect();
    // 72px clears the page-indicator dots (bottom:20px + up to 16px tall,
    // plus breathing room) so "keep going" never lands on top of them.
    const bottomMargin = 72;
    const overflow = anchorRect.bottom - (containerRect.bottom - bottomMargin);
    if (overflow > 0){
      const currentOffset = parseFloat(trackEl.dataset.trackOffset || '0');
      animateTrackTo(trackEl, currentOffset + overflow);
    }
  }

  // ---- Tap-to-reveal story text (slide 2) ----
  // Lines are revealed one at a time on tap, each fading/rising into
  // place. Once the last line is shown, the "tap to continue" hint fades
  // out and, about a second later, the "keep going" button fades in
  // right where the text ends.
  const storyLines = [
    "before i confessed to you, i had always looked up to you",
    "i remember the night i confessed and since then i never looked back",
    "we watched 2 fast 2 furious together, it was the best night of my life",
    "i remember how you told me you imagined us cuddling",
    'it made me feel so special, like the luckiest boy in the world <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>'
  ];
  const storyLinesEl = document.getElementById('story-lines');
  const storyTrackEl = document.getElementById('story-track');
  const tapHint = document.getElementById('tap-hint');
  const nextScreenInner = document.getElementById('next-screen-inner');
  let storyIndex = 0;

  function revealNextStoryLine(){
    if (storyIndex >= storyLines.length) return;

    // FLIP technique: record where the tap-hint currently sits before the
    // new line pushes it down, then after the push, animate it smoothly
    // from its old spot to its new one instead of letting it snap.
    const beforeRect = tapHint.getBoundingClientRect();

    const p = document.createElement('p');
    p.className = 'story-line';
    p.innerHTML = storyLines[storyIndex];
    storyLinesEl.appendChild(p);
    // Add 'is-shown' a frame later so the opacity/transform transition
    // actually plays instead of snapping straight to visible.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => p.classList.add('is-shown'));
    });
    storyIndex++;

    const afterRect = tapHint.getBoundingClientRect();
    const deltaY = beforeRect.top - afterRect.top;
    if (deltaY !== 0){
      tapHint.style.transition = 'none';
      tapHint.style.transform = `translateY(${deltaY}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tapHint.style.transition = 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)';
          tapHint.style.transform = 'translateY(0)';
        });
      });
    }
    easeAnchorIntoView(nextScreenEl, storyTrackEl, afterRect);

    if (storyIndex >= storyLines.length){
      tapHint.classList.add('is-hidden');
      setTimeout(() => {
        forwardBtn.classList.add('is-visible');
        easeAnchorIntoView(nextScreenEl, storyTrackEl, forwardBtn.getBoundingClientRect());
      }, 1000);
    }
  }

  const nextScreenEl = document.getElementById('next-screen');
  const particleLayer = document.getElementById('particle-layer');

  // ---- Colour helpers for the floating particles ----
  // Every particle sits somewhere between purple (#dbb8ff) and pink
  // (#ffb8cb), then gets lightened some random amount toward white —
  // so colours only ever move UP toward white, never past those two
  // stops toward anything darker/richer.
  function hexToRgb(hex){
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex({ r, g, b }){
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }
  function lerpRgb(c1, c2, t){
    return { r: c1.r + (c2.r - c1.r) * t, g: c1.g + (c2.g - c1.g) * t, b: c1.b + (c2.b - c1.b) * t };
  }
  const PURPLE_STOP = hexToRgb('#dbb8ff');
  const PINK_STOP = hexToRgb('#ffb8cb');
  const WHITE = hexToRgb('#ffffff');

  // Petals: anywhere across the purple↔pink range, then lightened toward white.
  function randomPetalColor(){
    const base = lerpRgb(PURPLE_STOP, PINK_STOP, Math.random());
    return rgbToHex(lerpRgb(base, WHITE, Math.random()));
  }
  // Hearts: always pink — just lightened toward white by a random amount.
  function randomHeartColor(){
    return rgbToHex(lerpRgb(PINK_STOP, WHITE, Math.random()));
  }

  // ---- Tap-burst: petals/hearts fly out from wherever the page is
  // clicked or tapped, drift slowly, and fade out gradually. ----
  function spawnTapBurst(x, y){
    const count = 5 + Math.floor(Math.random() * 3); // 5–7 particles per tap

    // Fan outward together in one general direction (mostly upward)
    // rather than spraying in a full circle, so they read as one
    // little cluster drifting away from the tap point.
    const baseAngle = -Math.PI / 2 + (Math.random() * 0.5 - 0.25);
    const spread = 1.5; // spread out a bit more than before

    for (let i = 0; i < count; i++){
      const isHeart = Math.random() < 0.3; // mostly petals, occasional heart
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('tap-particle');
      svg.setAttribute('viewBox', '0 0 64 64');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#' + (isHeart ? 's-heart' : 's-petal'));
      svg.appendChild(use);

      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const dist = 70 + Math.random() * 70; // total travel distance — spread out further

      const size = 18 + Math.random() * 10; // bigger, easy to see
      const rotStart = Math.random() * 360;
      const rotEnd = rotStart + (Math.random() * 120 - 60);
      const duration = 2 + Math.random() * 2; // shorter — 2–4s total, fades near the end
      const delay = Math.random() * 0.15;

      svg.style.left = x + 'px';
      svg.style.top = y + 'px';
      svg.style.width = size + 'px';
      svg.style.height = size + 'px';
      // NOTE: paths use fill="currentColor", so colour is set via the CSS
      // `color` property here, not `fill` (setting `fill` directly is
      // ignored once a child has fill="currentColor").
      svg.style.color = isHeart ? randomHeartColor() : randomPetalColor();
      svg.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      svg.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      svg.style.setProperty('--rot-start', rotStart + 'deg');
      svg.style.setProperty('--rot-end', rotEnd + 'deg');
      svg.style.animationDuration = duration + 's';
      svg.style.animationDelay = delay + 's';

      particleLayer.appendChild(svg);
      svg.addEventListener('animationend', () => svg.remove());
    }
  }

  // Fires on any click/tap anywhere on the page.
  document.addEventListener('click', (e) => {
    spawnTapBurst(e.clientX, e.clientY);
  });

  nextScreenEl.addEventListener('click', (e) => {
    // Don't advance the story when the tap lands on one of the buttons —
    // they handle their own clicks. (Particle burst above still fires.)
    if (e.target.closest('#forward-btn') || e.target.closest('#back-btn')) return;
    revealNextStoryLine();
  });

  // Reveal the first line automatically once the page has faded in, so
  // she isn't looking at a totally blank screen.
  function startStory(){
    if (storyIndex === 0) revealNextStoryLine();
  }

  function resetStory(){
    storyIndex = 0;
    storyLinesEl.innerHTML = '';
    tapHint.classList.remove('is-hidden');
    tapHint.style.transition = '';
    tapHint.style.transform = '';
    forwardBtn.classList.remove('is-visible');
    if (storyTrackEl._scrollAnimFrame){
      cancelAnimationFrame(storyTrackEl._scrollAnimFrame);
      storyTrackEl._scrollAnimFrame = null;
    }
    storyTrackEl.dataset.trackOffset = '0';
    storyTrackEl.style.transform = '';
  }

  // ---- Tap-to-reveal story text (page 3 / placeholder screen) ----
  // Same tap-to-reveal mechanic as page 2's storyLines, just a separate
  // array/state so the two screens don't interfere with each other.
  const storyLines3 = [
    "you make me feel as if im floating",
    "when we have nothing, you still love me",
    "when it feels like we have everything, you still love me",
    "i feel safe in your arms",
    "i feel like you are the answer to all my prayers, all of them",
    'ive never seen a more perfect girl than you my love <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>'
  ];
  const storyLinesEl3 = document.getElementById('story-lines-3');
  const tapHint3 = document.getElementById('tap-hint-3');
  let storyIndex3 = 0;

  function revealNextStoryLine3(){
    if (storyIndex3 >= storyLines3.length) return;

    const beforeRect = tapHint3.getBoundingClientRect();

    const p = document.createElement('p');
    p.className = 'story-line';
    p.innerHTML = storyLines3[storyIndex3];
    storyLinesEl3.appendChild(p);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => p.classList.add('is-shown'));
    });
    storyIndex3++;

    const afterRect = tapHint3.getBoundingClientRect();
    const deltaY = beforeRect.top - afterRect.top;
    if (deltaY !== 0){
      tapHint3.style.transition = 'none';
      tapHint3.style.transform = `translateY(${deltaY}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tapHint3.style.transition = 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)';
          tapHint3.style.transform = 'translateY(0)';
        });
      });
    }

    if (storyIndex3 >= storyLines3.length){
      tapHint3.classList.add('is-hidden');
      setTimeout(() => {
        forwardBtn3.classList.add('is-visible');
      }, 1000);
    }
  }

  function startStory3(){
    if (storyIndex3 === 0) revealNextStoryLine3();
  }

  function resetStory3(){
    storyIndex3 = 0;
    storyLinesEl3.innerHTML = '';
    tapHint3.classList.remove('is-hidden');
    tapHint3.style.transition = '';
    tapHint3.style.transform = '';
    forwardBtn3.classList.remove('is-visible');
  }

  // ---- Tap-to-reveal story text (pages 3–7) ----
  // Generic version of page 2's storyLines mechanic, so every later page
  // is guaranteed to behave identically — same fade/rise timing, same
  // FLIP-animated hint, same "button appears once done" gating. Page 2
  // itself is untouched above; this just reproduces its exact logic.
  function createStoryScreen(lines, linesEl, tapHint, forwardBtn, container, trackEl){
    let index = 0;

    function reveal(){
      if (index >= lines.length) return;

      const beforeRect = tapHint.getBoundingClientRect();

      const p = document.createElement('p');
      p.className = 'story-line';
      p.innerHTML = lines[index];
      linesEl.appendChild(p);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => p.classList.add('is-shown'));
      });
      index++;

      const afterRect = tapHint.getBoundingClientRect();
      const deltaY = beforeRect.top - afterRect.top;
      if (deltaY !== 0){
        tapHint.style.transition = 'none';
        tapHint.style.transform = `translateY(${deltaY}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            tapHint.style.transition = 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)';
            tapHint.style.transform = 'translateY(0)';
          });
        });
      }
      easeAnchorIntoView(container, trackEl, afterRect);

      if (index >= lines.length){
        tapHint.classList.add('is-hidden');
        setTimeout(() => {
          forwardBtn.classList.add('is-visible');
          easeAnchorIntoView(container, trackEl, forwardBtn.getBoundingClientRect());
        }, 1000);
      }
    }

    function start(){
      if (index === 0) reveal();
    }

    function reset(){
      index = 0;
      linesEl.innerHTML = '';
      tapHint.classList.remove('is-hidden');
      tapHint.style.transition = '';
      tapHint.style.transform = '';
      forwardBtn.classList.remove('is-visible');
      if (trackEl._scrollAnimFrame){
        cancelAnimationFrame(trackEl._scrollAnimFrame);
        trackEl._scrollAnimFrame = null;
      }
      trackEl.dataset.trackOffset = '0';
      trackEl.style.transform = '';
    }

    return { reveal, start, reset };
  }

  const story3 = createStoryScreen(
    [
      "you make me feel as if im floating",
      "when we have nothing, you still love me",
      "when it feels like we have everything, you still love me",
      "i feel safe in your arms",
      "i feel like you are the answer to all my prayers, all of them",
      `ive never seen a more perfect girl than you my love <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>`
    ],
    document.getElementById('story-lines-3'),
    document.getElementById('tap-hint-3'),
    document.getElementById('forward-btn-3'),
    document.getElementById('placeholder-screen'),
    document.getElementById('story-track-3')
  );

  const story4 = createStoryScreen(
    [
      "we've fought and argued before",
      "we've disagreed on some things",
      "and i admit i've made a lot of mistakes",
      "but we found our way back to each other no matter what",
      "and to me, that means the world to me",
      "because even if something happens, i know we still love each other",
      `it means more than you could imagine when i feel secure with you <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>`
    ],
    document.getElementById('story-lines-4'),
    document.getElementById('tap-hint-4'),
    document.getElementById('forward-btn-4'),
    document.getElementById('screen-4'),
    document.getElementById('story-track-4')
  );

  const story5 = createStoryScreen(
    [
      "you're so pretty, i remember when you sent me that first photo of you",
      "you're absolutely stunning and i could write about you for years to come",
      "i could make so many beautiful things like this for you",
      "i could buy so many beautiful things for you",
      "anything that makes you feel so pretty it's yours from now on",
      `when you're with me my princess, you'll feel like a princess, i swear on it <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>`
    ],
    document.getElementById('story-lines-5'),
    document.getElementById('tap-hint-5'),
    document.getElementById('forward-btn-5'),
    document.getElementById('screen-5'),
    document.getElementById('story-track-5')
  );

  const story6 = createStoryScreen(
    [
      "my favorite part of you? everything",
      "but if i had to choose, it would be your eyes",
      "your eyes are so.. i don't even have a way to describe it they're mesmerising",
      "i catch myself looking and longing to gaze into you and become lost all day and all night long",
      "i catch myself admiring your photos all throughout the night",
      "throughout the day i kiss my wallet, i look at your photos and i think",
      `"what a beautiful girl i've been blessed with" <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>`
    ],
    document.getElementById('story-lines-6'),
    document.getElementById('tap-hint-6'),
    document.getElementById('forward-btn-6'),
    document.getElementById('screen-6'),
    document.getElementById('story-track-6')
  );

  const story7 = createStoryScreen(
    [
      "this year, we talked, we grew together, we helped each other, loved each other",
      "and i hope this coming year, our second year together, will be filled with more joy than this",
      "i hope we get to be with each other, just us two, enjoying each other's presence",
      "because your presence means more than you could ever imagine to me",
      "you're my safe space, my heaven, my everything, my angel, my princess, my one and only, my dena",
      "you mean everything to me, the most beautiful and gorgeous and elegant girl in the world",
      `it can only be you my beautiful princess <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>`
    ],
    document.getElementById('story-lines-7'),
    document.getElementById('tap-hint-7'),
    document.getElementById('forward-btn-7'),
    document.getElementById('screen-7'),
    document.getElementById('story-track-7')
  );

  const story8 = createStoryScreen(
    [
      "dena, please continue to choose me, and only me",
      "please continue to spend your time with me",
      "no matter what it is",
      "please keep shining full of energy every day",
      "please keep being with me no matter what",
      "please continue to love me",
      `i love you <svg class="story-heart" viewBox="0 0 64 64"><use href="#s-heart"/></svg>`
    ],
    document.getElementById('story-lines-8'),
    document.getElementById('tap-hint-8'),
    document.getElementById('forward-btn-8'),
    document.getElementById('screen-8'),
    document.getElementById('story-track-8')
  );

  // ---- Forward button (page 1 -> page 2 story screen, i.e. placeholder) ----
  const forwardBtn = document.getElementById('forward-btn');
  const screenReveal = document.getElementById('screen-reveal');

  // The ordered chain of tap-to-reveal screens between page 2 and the
  // letterbox reveal. Each entry knows its own DOM element and story
  // controller; wiring a forward/back button just needs the entry before
  // and after it in this array.
  const storyScreens = [
    { el: document.getElementById('placeholder-screen'), story: story3, back: document.getElementById('back-btn-3'), forward: document.getElementById('forward-btn-3'), pageIndex: 2 },
    { el: document.getElementById('screen-6'), story: story6, back: document.getElementById('back-btn-6'), forward: document.getElementById('forward-btn-6'), pageIndex: 3 },
    { el: document.getElementById('screen-7'), story: story7, back: document.getElementById('back-btn-7'), forward: document.getElementById('forward-btn-7'), pageIndex: 4 },
    { el: document.getElementById('screen-4'), story: story4, back: document.getElementById('back-btn-4'), forward: document.getElementById('forward-btn-4'), pageIndex: 5 },
    { el: document.getElementById('screen-5'), story: story5, back: document.getElementById('back-btn-5'), forward: document.getElementById('forward-btn-5'), pageIndex: 6 },
    { el: document.getElementById('screen-8'), story: story8, back: document.getElementById('back-btn-8'), forward: document.getElementById('forward-btn-8'), pageIndex: 7 }
  ];

  forwardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.add('showing-reveal');
    storyScreens[0].el.classList.add('is-active');
    currentPageIndex = storyScreens[0].pageIndex;
    updateDots();
    storyScreens[0].story.start();
  });

  storyScreens.forEach((screen, i) => {
    // Tapping anywhere on this screen (except its buttons) reveals the
    // next line, exactly like page 2.
    screen.el.addEventListener('click', (e) => {
      if (e.target.closest('#' + screen.forward.id) || e.target.closest('#' + screen.back.id)) return;
      screen.story.reveal();
    });

    // Forward: move to the next screen in the chain, or on to the
    // letterbox reveal if this is the last one.
    screen.forward.addEventListener('click', (e) => {
      e.stopPropagation();
      screen.el.classList.remove('is-active');
      const next = storyScreens[i + 1];
      if (next){
        next.el.classList.add('is-active');
        currentPageIndex = next.pageIndex;
        updateDots();
        next.story.start();
      } else {
        screenReveal.classList.add('is-active');
        currentPageIndex = 8;
        updateDots();
      }
    });

    // Back: return to the previous screen in the chain, or all the way
    // out to page 1 (next-screen) if this is the first one.
    screen.back.addEventListener('click', (e) => {
      e.stopPropagation();
      screen.el.classList.remove('is-active');
      const prev = storyScreens[i - 1];
      if (prev){
        prev.el.classList.add('is-active');
        currentPageIndex = prev.pageIndex;
        updateDots();
        screen.story.reset();
      } else {
        document.body.classList.remove('showing-reveal');
        currentPageIndex = 1;
        updateDots();
        screen.story.reset();
      }
    });
  });

  // ---- Reveal button (last story screen -> Discord) ----
  // Slides the letterbox bars away and fades in the Discord invite that
  // was sitting underneath them the whole time.
  const revealBtn = document.getElementById('reveal-btn');
  revealBtn.addEventListener('click', () => {
    screenReveal.classList.add('revealed');
    currentPageIndex = 9;
    updateDots();
  });

  // ---- Second back button (letterbox/discord -> last story screen) ----
  // Hides the reveal screen and brings the last story screen back, then
  // once it's fully faded out, resets the reveal screen to its locked
  // state so she can open it again from the top.
  const backBtn2 = document.getElementById('back-btn-2');
  const lastStoryScreen = storyScreens[storyScreens.length - 1];
  backBtn2.addEventListener('click', () => {
    screenReveal.classList.remove('is-active');
    lastStoryScreen.el.classList.add('is-active');
    currentPageIndex = lastStoryScreen.pageIndex;
    updateDots();
    setTimeout(() => {
      screenReveal.classList.remove('revealed');
    }, CLOSE_ANIM_MS);
  });

  // ---- Home button ----
  // Jumps straight back to page 1 (the envelope) from anywhere in the
  // site, instead of clicking "back" repeatedly. Resets every story
  // screen's revealed-lines state too, so re-opening the envelope later
  // starts each page fresh, exactly like using the normal back chain would.
  function goHome(){
    storyScreens.forEach((screen) => {
      screen.el.classList.remove('is-active');
      screen.story.reset();
    });
    screenReveal.classList.remove('is-active', 'revealed');
    document.body.classList.remove('showing-reveal');
    document.body.classList.remove('transitioning');
    document.body.classList.add('closing');
    envelope.classList.remove('is-open');
    hasTransitioned = false;
    resetStory();
    currentPageIndex = 0;
    updateDots();
    setTimeout(() => {
      document.body.classList.remove('closing');
    }, CLOSE_ANIM_MS);
  }

  document.querySelectorAll('.home-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      goHome();
    });
  });

  // ---- Background music ----
  // Starts silent and fades in slowly after page load (and/or her first
  // gesture, since browsers block autoplay-with-sound until there's been
  // a real tap/click) — slow and gentle on purpose, so nothing startles
  // her the moment the page opens. Never gets loud — capped well below
  // full volume. Switching songs fades the old one out, swaps the track,
  // then fades the new one back in the same gentle way.
  const music = document.getElementById('bg-music');
  const soundToggle = document.getElementById('sound-toggle');
  const volumeControl = document.getElementById('volume-control');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeSliderTrack = document.getElementById('volume-slider-track');
  const volumeFill = document.getElementById('volume-slider-fill');
  const volumeThumb = document.getElementById('volume-slider-thumb');
  const iconSpin = soundToggle.querySelector('.icon-spin');
  const songHint = document.getElementById('song-hint');
  const skipHint = document.getElementById('skip-hint');
  const songLabel = document.getElementById('song-label');
  const songTitleText = document.getElementById('song-title-text');
  const titleInner = songTitleText.querySelector('.title-inner');
  const songMenu = document.getElementById('song-menu');
  const playPauseToggle = document.getElementById('play-pause-toggle');
  const songProgressRow = document.getElementById('song-progress-row');
  const songProgressTrack = document.getElementById('song-progress-track');
  const musicCluster = document.getElementById('music-cluster');
  // The skip-hint only goes away once she's actually used the player
  // (play/pause, the progress row, or the song label) — see the
  // hideSkipHint() calls wired into each of those handlers below —
  // rather than on any tap inside the cluster (which used to include
  // taps on the hint bubble itself, since it sits over empty space).
  function hideSkipHint(){
    skipHint.classList.add('hidden');
  }
  const songProgressFill = document.getElementById('song-progress-fill');
  const songTimeElapsed = document.getElementById('song-time-elapsed');
  const songTimeTotal = document.getElementById('song-time-total');
  const playerExpanded = document.getElementById('player-expanded');
  const playerExpandedBackdrop = document.getElementById('player-expanded-backdrop');
  const playerCollapseBtn = document.getElementById('player-collapse-btn');
  const playerExpandedSong = document.getElementById('player-expanded-song');
  const playerExpandedArtist = document.getElementById('player-expanded-artist');
  const playerExpandedTrack = document.getElementById('player-expanded-track');
  const playerExpandedFill = document.getElementById('player-expanded-fill');
  const playerExpandedThumb = document.getElementById('player-expanded-thumb');
  const playerExpandedElapsed = document.getElementById('player-expanded-elapsed');
  const playerExpandedTotal = document.getElementById('player-expanded-total');
  const playerExpandedPlay = document.getElementById('player-expanded-play');
  const playerPrevBtn = document.getElementById('player-prev-btn');
  const playerNextBtn = document.getElementById('player-next-btn');
  const shuffleToggleBtn = document.getElementById('shuffle-toggle-btn');
  const loopToggleBtn = document.getElementById('loop-toggle-btn');
  let isShuffle = false;
  let isLooping = false;
  const TARGET_VOLUME = 0.28; // gentle, comfortable starting level — she can drag it anywhere from here
  let currentVolume = TARGET_VOLUME;
  const FADE_IN_MS = 3200;    // slow initial fade-in, so it never startles her
  const SWITCH_FADE_OUT_MS = 700;
  const SWITCH_FADE_IN_MS = 1600;
  const TEXT_CROSSFADE_MS = 320;
  let hasStartedMusic = false;
  let attemptedMusic = false;
  let currentSongIndex = 0;
  let fadeToken = 0; // increments on every fade call so overlapping fades don't fight each other

  // SONGS array (title, artist, data) is injected just below this script,
  // as window.SONGS, so the huge embedded audio data stays out of the way
  // of the rest of the logic.
  const SONGS = window.SONGS || [];

  // Smoothly ramps music.volume from its current value to targetVolume
  // over durationMs, using elapsed real time (not a fixed step count) so
  // it stays smooth regardless of frame rate. Returns nothing; calls
  // onComplete (if given) once the ramp finishes or is superseded.
  function fadeVolume(targetVolume, durationMs, onComplete){
    const myToken = ++fadeToken;
    const startVolume = music.volume;
    const startTime = performance.now();
    if (durationMs <= 0){
      music.volume = targetVolume;
      if (onComplete) onComplete();
      return;
    }
    function step(now){
      if (myToken !== fadeToken) return; // a newer fade took over
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // ease-in-out so the start and end of the fade feel soft too
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      music.volume = startVolume + (targetVolume - startVolume) * eased;
      if (t < 1){
        requestAnimationFrame(step);
      } else {
        music.volume = targetVolume;
        if (onComplete) onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  // Crossfades the song-title label text: fades the old text out, swaps
  // it, then fades the new text in — instead of the label just snapping
  // to the new song name.
  function setSongLabelText(text){
    titleInner.classList.add('fading');
    setTimeout(() => {
      titleInner.textContent = text;
      titleInner.classList.remove('fading');
      measureMarquee();
    }, TEXT_CROSSFADE_MS);
  }

  // Only scroll titles that are actually too long to fit in the pill —
  // short ones (e.g. "Puddles") just sit still. Distance/duration scale
  // with how much text needs to travel, so long titles don't feel rushed.
  function measureMarquee(){
    songTitleText.classList.remove('scrolling');
    titleInner.style.removeProperty('--marquee-dist');
    titleInner.style.removeProperty('--marquee-dur');
    // Measure on the next frame so layout has settled after the text swap.
    requestAnimationFrame(() => {
      const overflow = titleInner.scrollWidth - songTitleText.clientWidth;
      if (overflow > 4){
        const dist = overflow + 6;
        titleInner.style.setProperty('--marquee-dist', '-' + dist + 'px');
        // Slow, gentle drift — roughly 7px/sec of actual travel, with a
        // generous floor so even short overflows glide instead of dart.
        titleInner.style.setProperty('--marquee-dur', Math.max(14, dist / 7) + 's');
        songTitleText.classList.add('scrolling');
      }
    });
  }

  // opts.userInitiated: true when she picked this from the menu or it's
  // rolling to the next track — triggers the fade-out/fade-in crossfade.
  // False for the very first load, where there's nothing yet to fade from.
  function loadSong(index, autoplay, opts){
    if (!SONGS.length) return;
    opts = opts || {};
    currentSongIndex = ((index % SONGS.length) + SONGS.length) % SONGS.length;
    const song = SONGS[currentSongIndex];
    const wasPlaying = hasStartedMusic && !music.paused && !music.ended;

    setSongLabelText(song.title + ' — ' + song.artist);
    playerExpandedSong.textContent = song.title;
    playerExpandedArtist.textContent = song.artist;
    renderSongMenu();

    function swapAndPlay(){
      music.src = song.data;
      songProgressFill.style.width = '0%';
      songTimeElapsed.textContent = '0:00';
      songTimeTotal.textContent = '0:00';
      if (autoplay || wasPlaying){
        hasStartedMusic = true;
        music.volume = 0;
        const p = music.play();
        const goIn = () => fadeVolume(currentVolume, SWITCH_FADE_IN_MS);
        if (p && typeof p.then === 'function'){
          p.then(goIn).catch(() => {
            // Blocked by autoplay rules — let the next tap on play/pause retry it.
            attemptedMusic = false;
          });
        } else {
          goIn();
        }
      }
    }

    // Play immediately, in the same tick as the click/tap, so strict
    // autoplay policies (iOS Safari) still count this as tied to her
    // gesture. We still get a soft fade-in on the new track — we just
    // don't wait for the old one to fade out first anymore.
    swapAndPlay();
  }

  // Formats seconds as m:ss (e.g. 75 -> "1:15"), matching how she'd see
  // it on any normal music player.
  function formatTime(sec){
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  music.addEventListener('loadedmetadata', () => {
    songTimeTotal.textContent = formatTime(music.duration);
    playerExpandedTotal.textContent = formatTime(music.duration);
  });
  // While actively dragging the big playhead, ignore the audio's own
  // timeupdate events for visual position — the drag handler already
  // moves the thumb/fill to follow the finger, and letting timeupdate
  // fight it causes jitter.
  let draggingPlayerSeek = false;
  music.addEventListener('timeupdate', () => {
    songTimeElapsed.textContent = formatTime(music.currentTime);
    if (music.duration){
      const pct = (music.currentTime / music.duration) * 100;
      songProgressFill.style.width = pct + '%';
      if (!draggingPlayerSeek){
        playerExpandedFill.style.width = pct + '%';
        playerExpandedThumb.style.left = pct + '%';
        playerExpandedThumb.setAttribute('aria-valuenow', String(Math.round(pct)));
      }
    }
    if (!draggingPlayerSeek){
      playerExpandedElapsed.textContent = formatTime(music.currentTime);
    }
  });
  // Tapping the mini player itself opens the big enlarged player — this
  // is the fix for "hard to skip/rewind on phone", instead of trying to
  // hit the tiny bar directly.
  songProgressRow.addEventListener('click', (e) => {
    e.stopPropagation();
    hideSkipHint();
    openPlayerExpanded();
  });

  // Play/pause button — shows the play triangle while paused/ended, and
  // the pause bars while actually playing, always in sync with the real
  // audio state (not just what was last clicked), so an autoplay block
  // or the end-of-track transition still shows the correct icon.
  function updatePlayPauseUI(){
    const isPaused = music.paused || music.ended;
    playPauseToggle.classList.toggle('paused', isPaused);
    playPauseToggle.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
    playerExpandedPlay.classList.toggle('paused', isPaused);
    playerExpandedPlay.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
  }
  music.addEventListener('play', updatePlayPauseUI);
  music.addEventListener('pause', updatePlayPauseUI);
  music.addEventListener('ended', updatePlayPauseUI);
  updatePlayPauseUI();

  function togglePlayback(){
    songHint.classList.add('hidden');
    if (music.paused || music.ended){
      hasStartedMusic = true;
      attemptedMusic = true;
      if (!music.src && SONGS.length) loadSong(0, false);
      const p = music.play();
      const goIn = () => fadeVolume(currentVolume, SWITCH_FADE_IN_MS);
      if (p && typeof p.then === 'function'){
        p.then(goIn).catch(() => {});
      } else {
        goIn();
      }
    } else {
      // Fade out gently first so pausing doesn't cut the music off abruptly.
      fadeVolume(0, SWITCH_FADE_OUT_MS, () => music.pause());
    }
  }

  playPauseToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    hideSkipHint();
    togglePlayback();
  });
  playerExpandedPlay.addEventListener('click', (e) => {
    e.stopPropagation();
    hideSkipHint();
    togglePlayback();
  });

  // ---- Previous / next song (enlarged player) ----
  // Spotify-style "back" behavior: a press right after a pause rewinds
  // the current song to the start. Pressing it again quickly (or
  // repeatedly, in a row) skips to the previous track each time — she
  // doesn't need to double-press for every song, just keep tapping.
  let prevPressArmed = false;
  let prevArmTimer = null;
  const PREV_ARM_MS = 2500;
  function armPrevious(){
    prevPressArmed = true;
    clearTimeout(prevArmTimer);
    prevArmTimer = setTimeout(() => { prevPressArmed = false; }, PREV_ARM_MS);
  }
  function handlePrevious(){
    if (prevPressArmed){
      loadSong(currentSongIndex - 1, true, { userInitiated: true });
      armPrevious(); // stays armed so the next tap goes straight back again
    } else {
      music.currentTime = 0;
      armPrevious();
    }
  }
  function handleNext(){
    prevPressArmed = false;
    clearTimeout(prevArmTimer);
    loadSong(pickNextIndex(), true, { userInitiated: true });
  }
  playerPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideSkipHint();
    handlePrevious();
  });
  playerNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideSkipHint();
    handleNext();
  });

  // ---- Shuffle / loop toggles ----
  function updateShuffleUI(){
    shuffleToggleBtn.classList.toggle('active', isShuffle);
    shuffleToggleBtn.setAttribute('aria-pressed', String(isShuffle));
  }
  function updateLoopUI(){
    loopToggleBtn.classList.toggle('active', isLooping);
    loopToggleBtn.setAttribute('aria-pressed', String(isLooping));
  }
  shuffleToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideSkipHint();
    isShuffle = !isShuffle;
    updateShuffleUI();
  });
  loopToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideSkipHint();
    isLooping = !isLooping;
    updateLoopUI();
  });
  updateShuffleUI();
  updateLoopUI();

  // Picks the next song to play, respecting shuffle: a random track that
  // isn't the one currently playing (as long as there's more than one to
  // pick from), otherwise the plain next-in-order track.
  function pickNextIndex(){
    if (isShuffle && SONGS.length > 1){
      let next;
      do {
        next = Math.floor(Math.random() * SONGS.length);
      } while (next === currentSongIndex);
      return next;
    }
    return currentSongIndex + 1;
  }

  // ---- Enlarged player open/close ----
  function openPlayerExpanded(){
    playerExpanded.classList.add('open');
    playerExpanded.setAttribute('aria-hidden', 'false');
    songHint.classList.add('hidden');
  }
  function closePlayerExpanded(){
    playerExpanded.classList.remove('open');
    playerExpanded.setAttribute('aria-hidden', 'true');
  }
  playerCollapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePlayerExpanded();
  });
  playerExpandedBackdrop.addEventListener('click', () => closePlayerExpanded());

  // ---- Enlarged seek bar: big drag target for easy skip/rewind on phone ----
  function ratioFromTrackPointer(e){
    const rect = playerExpandedTrack.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length) ? e.touches[0].clientX : e.clientX;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }
  function setSeekVisual(ratio){
    const pct = ratio * 100;
    playerExpandedFill.style.width = pct + '%';
    playerExpandedThumb.style.left = pct + '%';
    playerExpandedThumb.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (music.duration){
      playerExpandedElapsed.textContent = formatTime(ratio * music.duration);
    }
  }
  playerExpandedThumb.addEventListener('pointerdown', (e) => {
    if (!music.duration) return;
    draggingPlayerSeek = true;
    playerExpandedTrack.classList.add('dragging');
    setSeekVisual(ratioFromTrackPointer(e));
    e.preventDefault();
    e.stopPropagation();
  });
  window.addEventListener('pointermove', (e) => {
    if (!draggingPlayerSeek) return;
    setSeekVisual(ratioFromTrackPointer(e));
  });
  window.addEventListener('pointerup', (e) => {
    if (!draggingPlayerSeek) return;
    draggingPlayerSeek = false;
    playerExpandedTrack.classList.remove('dragging');
    if (music.duration){
      music.currentTime = ratioFromTrackPointer(e) * music.duration;
    }
  });
  // Keyboard support on the playhead, mirroring the volume thumb.
  playerExpandedThumb.setAttribute('tabindex', '0');
  playerExpandedThumb.addEventListener('keydown', (e) => {
    if (!music.duration) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp'){
      music.currentTime = Math.min(music.duration, music.currentTime + 5);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown'){
      music.currentTime = Math.max(0, music.currentTime - 5);
      e.preventDefault();
    }
  });

  function renderSongMenu(){
    songMenu.innerHTML = '';
    SONGS.forEach((song, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.role = 'menuitem';
      item.className = i === currentSongIndex ? 'active' : '';
      item.innerHTML = '<span class="s-title">' + song.title + '</span><span class="s-artist">' + song.artist + '</span>';
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSong(i, true, { userInitiated: true });
        closeSongMenu();
      });
      songMenu.appendChild(item);
    });
  }

  function openSongMenu(){
    songMenu.classList.add('open');
    songLabel.setAttribute('aria-expanded', 'true');
  }
  function closeSongMenu(){
    songMenu.classList.remove('open');
    songLabel.setAttribute('aria-expanded', 'false');
  }
  songLabel.addEventListener('click', (e) => {
    e.stopPropagation();
    if (songMenu.classList.contains('open')){
      closeSongMenu();
    } else {
      openSongMenu();
    }
    // Tapping the music player itself also counts as "found it" — the
    // hint can go away for good.
    songHint.classList.add('hidden');
    hideSkipHint();
  });
  document.addEventListener('click', (e) => {
    if (!songMenu.contains(e.target) && e.target !== songLabel){
      closeSongMenu();
    }
  });

  function fadeInMusic(){
    // Guard on whether music has actually started, not just been
    // attempted — attemptedMusic used to get set synchronously and could
    // swallow the very next gesture before the blocked play() promise
    // had even rejected, leaving no listener left to retry with.
    if (hasStartedMusic) return;
    if (!music.src){ loadSong(0, false); }

    // Start genuinely muted — this is the one autoplay mode almost every
    // browser allows with zero user interaction (unlike volume=0, which
    // browsers do NOT treat as "muted" for autoplay purposes). The moment
    // playback actually begins, we flip muted off and fade the real
    // volume in, so it goes straight from silent-but-playing to audible
    // without needing a click.
    music.muted = true;
    music.volume = 0;
    const playPromise = music.play();

    function unmuteAndFadeIn(){
      hasStartedMusic = true;
      music.muted = false;
      fadeVolume(currentVolume, FADE_IN_MS);
    }

    if (playPromise && typeof playPromise.then === 'function'){
      playPromise.then(unmuteAndFadeIn).catch(() => {
        // Blocked even muted — very rare, but a later gesture will retry.
      });
    } else {
      unmuteAndFadeIn();
    }
  }

  // Called directly from the entry button's click handler — a guaranteed
  // real user gesture. On desktop, browsers sometimes let the page-load
  // muted play() succeed but then silently block/undo the programmatic
  // unmute that follows it (since that unmute isn't itself tied to a
  // gesture), leaving hasStartedMusic set to true with no actual sound
  // playing. fadeInMusic()'s early-return guard would then skip this
  // click entirely. forceAudiblePlay() ignores that guard and restarts
  // playback unmuted, directly inside the click, so sound is guaranteed.
  function forceAudiblePlay(){
    if (!music.src){ loadSong(0, false); }
    music.muted = false;
    music.volume = 0;
    const playPromise = music.play();
    function onPlaying(){
      hasStartedMusic = true;
      fadeVolume(currentVolume, FADE_IN_MS);
    }
    if (playPromise && typeof playPromise.then === 'function'){
      playPromise.then(onPlaying).catch(() => {
        // Still blocked somehow — fall back to the muted-first approach.
        hasStartedMusic = false;
        fadeInMusic();
      });
    } else {
      onPlaying();
    }
  }

  // Load the first song's title into the label immediately (before any
  // gesture), so she sees what's queued up even before playback starts.
  if (SONGS.length){
    loadSong(0, false);
  } else {
    titleInner.textContent = 'No songs loaded';
  }

  // When one song ends: if loop is on, replay the same track from the
  // start; otherwise roll into the next one automatically (shuffled if
  // shuffle is on), with the same gentle crossfade either way.
  music.addEventListener('ended', () => {
    if (isLooping){
      music.currentTime = 0;
      const p = music.play();
      if (p && typeof p.then === 'function') p.catch(() => {});
      return;
    }
    loadSong(pickNextIndex(), true, { userInitiated: true });
  });

  // Try to start the music the instant the page loads — this is what
  // makes it feel like it's "just playing" rather than waiting on her to
  // do something first. Most browsers will actually allow this. Where they
  // don't (autoplay-with-sound blocked), the gesture listeners below catch
  // her very first tap/click/keypress anywhere and start it then instead.
  fadeInMusic();

  // Several different gesture types, since browsers vary in which ones
  // count as a valid "user activation" for unlocking audio (Safari/iOS in
  // particular is stricter than Chrome about pointerdown vs click/touchend).
  // Not { once: true } — fadeInMusic can no-op on a given gesture if a
  // still-pending play() attempt hasn't resolved yet, so we keep retrying
  // on every gesture until playback actually succeeds, then detach.
  function unlockMusicOnGesture(){
    fadeInMusic();
    if (hasStartedMusic){
      ['click', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
        document.removeEventListener(evt, unlockMusicOnGesture);
      });
    }
  }
  ['click', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
    document.addEventListener(evt, unlockMusicOnGesture, { passive: true });
  });

  // ---- Volume slider ----
  // Clicking the round button no longer mutes — it opens/closes a little
  // capsule slider that grows straight down out of the button. The
  // speaker icon spins hard at the start of each open/close and eases
  // to a stop, winding one way to open and unwinding the other way to
  // close, using the CSS spin-open/spin-close keyframes above.
  let volumeOpen = false;

  function spinIcon(direction){
    iconSpin.classList.remove('spin-open', 'spin-close');
    void iconSpin.offsetWidth; // force reflow so re-adding the class restarts the animation
    iconSpin.classList.add(direction === 'open' ? 'spin-open' : 'spin-close');
  }
  iconSpin.addEventListener('animationend', () => {
    iconSpin.classList.remove('spin-open', 'spin-close');
  });

  function applyVolume(ratio){
    ratio = Math.min(1, Math.max(0, ratio));
    currentVolume = ratio;
    music.volume = ratio;
    volumeFill.style.height = (ratio * 100) + '%';
    volumeThumb.style.bottom = (ratio * 100) + '%';
    volumeThumb.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    soundToggle.classList.toggle('muted', ratio <= 0.001);
    if (!hasStartedMusic){
      hasStartedMusic = true;
    }
  }

  function ratioFromPointer(e){
    const rect = volumeSliderTrack.getBoundingClientRect();
    const clientY = (e.touches && e.touches.length) ? e.touches[0].clientY : e.clientY;
    // Top of the track = full volume, bottom = silent.
    return 1 - (clientY - rect.top) / rect.height;
  }

  function openVolumeSlider(){
    if (volumeOpen) return;
    volumeOpen = true;
    volumeSlider.classList.add('open');
    soundToggle.setAttribute('aria-pressed', 'true');
    soundToggle.setAttribute('aria-expanded', 'true');
    spinIcon('open');
  }
  function closeVolumeSlider(){
    if (!volumeOpen) return;
    volumeOpen = false;
    volumeSlider.classList.remove('open');
    soundToggle.setAttribute('aria-pressed', 'false');
    soundToggle.setAttribute('aria-expanded', 'false');
    spinIcon('close');
  }

  soundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (volumeOpen){
      closeVolumeSlider();
    } else {
      openVolumeSlider();
    }
    songHint.classList.add('hidden');
    if (!hasStartedMusic){
      hasStartedMusic = true;
      music.volume = currentVolume;
    }
  });

  let draggingVolume = false;
  volumeSliderTrack.addEventListener('pointerdown', (e) => {
    draggingVolume = true;
    applyVolume(ratioFromPointer(e));
    e.preventDefault();
  });
  window.addEventListener('pointermove', (e) => {
    if (!draggingVolume) return;
    applyVolume(ratioFromPointer(e));
  });
  window.addEventListener('pointerup', () => { draggingVolume = false; });

  // Keyboard support: focus the thumb, use arrow keys to nudge volume.
  volumeThumb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight'){
      applyVolume(currentVolume + 0.05);
      e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft'){
      applyVolume(currentVolume - 0.05);
      e.preventDefault();
    }
  });

  // Tapping anywhere outside the volume control closes the slider, same
  // as the song menu below.
  document.addEventListener('click', (e) => {
    if (volumeOpen && !volumeControl.contains(e.target)){
      closeVolumeSlider();
    }
  });
