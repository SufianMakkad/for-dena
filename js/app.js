
  // ---- Mouse parallax, desktop only ----
  // matchMedia('(pointer: fine)') is true on devices with a mouse/trackpad,
  // false on touch-only devices. This is how we make it PC-only.
  const stage = document.getElementById('stage');
  const bgLayer = document.getElementById('bg-layer');
  const flowerLayer = document.getElementById('flower-layer');
  const nextScreenParallax = document.getElementById('next-screen-parallax');
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
  const TOTAL_PAGES = 5; // envelope (0) + next-screen (1) + placeholder (2) + letterbox reveal (3) + discord (4)
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

    if (storyIndex >= storyLines.length){
      tapHint.classList.add('is-hidden');
      setTimeout(() => {
        forwardBtn.classList.add('is-visible');
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
  }

  // ---- Forward button (page 1 -> page 2) ----
  // Slides the new blank placeholder screen in on top of everything.
  const forwardBtn = document.getElementById('forward-btn');
  const placeholderScreen = document.getElementById('placeholder-screen');
  const screenReveal = document.getElementById('screen-reveal');
  forwardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.add('showing-reveal');
    placeholderScreen.classList.add('is-active');
    currentPageIndex = 2;
    updateDots();
  });

  // ---- Placeholder forward button (page 2 -> page 3) ----
  // Swaps the placeholder out for the letterbox/reveal screen.
  const forwardBtn3 = document.getElementById('forward-btn-3');
  forwardBtn3.addEventListener('click', (e) => {
    e.stopPropagation();
    placeholderScreen.classList.remove('is-active');
    screenReveal.classList.add('is-active');
    currentPageIndex = 3;
    updateDots();
  });

  // ---- Placeholder back button (page 2 -> page 1) ----
  const backBtn3 = document.getElementById('back-btn-3');
  backBtn3.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.remove('showing-reveal');
    placeholderScreen.classList.remove('is-active');
    currentPageIndex = 1;
    updateDots();
  });

  // ---- Reveal button (page 3 -> page 4) ----
  // Slides the letterbox bars away and fades in the Discord invite that
  // was sitting underneath them the whole time.
  const revealBtn = document.getElementById('reveal-btn');
  revealBtn.addEventListener('click', () => {
    screenReveal.classList.add('revealed');
    currentPageIndex = 4;
    updateDots();
  });

  // ---- Second back button (page 3/4 -> page 2) ----
  // Hides the reveal screen and brings the placeholder screen back, then
  // once it's fully faded out, resets the reveal screen to its locked
  // state so she can open it again from the top.
  const backBtn2 = document.getElementById('back-btn-2');
  backBtn2.addEventListener('click', () => {
    screenReveal.classList.remove('is-active');
    placeholderScreen.classList.add('is-active');
    currentPageIndex = 2;
    updateDots();
    setTimeout(() => {
      screenReveal.classList.remove('revealed');
    }, CLOSE_ANIM_MS);
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
  const songLabel = document.getElementById('song-label');
  const songTitleText = document.getElementById('song-title-text');
  const titleInner = songTitleText.querySelector('.title-inner');
  const songMenu = document.getElementById('song-menu');
  const playPauseToggle = document.getElementById('play-pause-toggle');
  const songProgressTrack = document.getElementById('song-progress-track');
  const songProgressFill = document.getElementById('song-progress-fill');
  const songTimeElapsed = document.getElementById('song-time-elapsed');
  const songTimeTotal = document.getElementById('song-time-total');
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
          p.then(goIn).catch(() => {});
        } else {
          goIn();
        }
      }
    }

    if (opts.userInitiated && wasPlaying){
      // Fade the current track out gently before switching tracks.
      fadeVolume(0, SWITCH_FADE_OUT_MS, swapAndPlay);
    } else {
      swapAndPlay();
    }
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
  });
  music.addEventListener('timeupdate', () => {
    songTimeElapsed.textContent = formatTime(music.currentTime);
    if (music.duration){
      songProgressFill.style.width = ((music.currentTime / music.duration) * 100) + '%';
    }
  });
  // Tap anywhere on the track to jump to that point in the song.
  songProgressTrack.addEventListener('click', (e) => {
    if (!music.duration) return;
    const rect = songProgressTrack.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    music.currentTime = ratio * music.duration;
  });

  // Play/pause button — shows the play triangle while paused/ended, and
  // the pause bars while actually playing, always in sync with the real
  // audio state (not just what was last clicked), so an autoplay block
  // or the end-of-track transition still shows the correct icon.
  function updatePlayPauseUI(){
    const isPaused = music.paused || music.ended;
    playPauseToggle.classList.toggle('paused', isPaused);
    playPauseToggle.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
  }
  music.addEventListener('play', updatePlayPauseUI);
  music.addEventListener('pause', updatePlayPauseUI);
  music.addEventListener('ended', updatePlayPauseUI);
  updatePlayPauseUI();

  playPauseToggle.addEventListener('click', (e) => {
    e.stopPropagation();
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
  });
  document.addEventListener('click', (e) => {
    if (!songMenu.contains(e.target) && e.target !== songLabel){
      closeSongMenu();
    }
  });

  function fadeInMusic(){
    if (attemptedMusic) return;
    attemptedMusic = true;
    if (!music.src){ loadSong(0, false); }
    music.volume = 0;
    const playPromise = music.play();
    if (playPromise && typeof playPromise.then === 'function'){
      playPromise.then(() => {
        hasStartedMusic = true;
        fadeVolume(currentVolume, FADE_IN_MS);
      }).catch(() => {
        // Blocked — allow the next distinct gesture to retry.
        attemptedMusic = false;
      });
    } else {
      hasStartedMusic = true;
      fadeVolume(currentVolume, FADE_IN_MS);
    }
  }

  // Load the first song's title into the label immediately (before any
  // gesture), so she sees what's queued up even before playback starts.
  if (SONGS.length){
    loadSong(0, false);
  } else {
    titleInner.textContent = 'No songs loaded';
  }

  // When one song ends, roll into the next one automatically instead of
  // looping the same track forever — with the same gentle crossfade.
  music.addEventListener('ended', () => {
    loadSong(currentSongIndex + 1, true, { userInitiated: true });
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
  ['click', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
    document.addEventListener(evt, fadeInMusic, { once: true, passive: true });
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
