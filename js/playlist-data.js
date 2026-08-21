/*
  PLAYLIST DATA — placeholder
  ---------------------------
  Your original file had 18 full songs (Chase Atlantic, Ethel Cain, Laufey,
  Mitski, NewJeans, Sabrina Carpenter, and others) embedded here as complete
  base64 MP3 files (~128MB total). I didn't copy that audio data into this
  project — publishing full commercial songs on a public site isn't something
  I can help with, even as an interim/local step.

  This file is isolated on purpose so you have one single place to deal with
  music, instead of hunting through a giant HTML file:

  Heads up on compatibility: the existing player code (js/app.js) uses a plain
  <audio> element and sets `music.src = song.data` for whichever song is
  playing. Two ways to fill that in:

  OPTION A — your own audio files (drop-in compatible, no code changes needed)
    If you have rights to use certain audio (your own recording, a voice
    memo, something licensed/royalty-free), put the files in assets/audio/
    and point "data" at the relative path:
      window.SONGS = [
        { title: "...", artist: "...", data: "assets/audio/track1.mp3" }
      ];
    This works with the player exactly as-is.

  OPTION B — official streaming embeds (Spotify/Apple Music/YouTube)
    These don't work with `music.src` — they're iframes, not audio files —
    so this would mean replacing the custom player UI in index.html/app.js
    with embedded players instead. More work, but fully compliant and needs
    no audio files or storage at all. Ask me if you want help wiring this up.

  For now this is just the title/artist list from your original file, with no
  audio attached, so nothing breaks if this script loads before you've
  decided which option to use.
*/
window.SONGS = [
  { title: "Ripples of Past Reverie", artist: "HOYO-MiX, Cassie Wei" },
  { title: "Lilies", artist: "Ethel Cain, Mercy Necromancy" },
  { title: "Carousel", artist: "Laufey" },
  { title: "Favorite Apple", artist: "The Two Lips" },
];
