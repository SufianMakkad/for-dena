# for us 🩷

## Project structure
```
index.html              ← the page itself
css/style.css           ← all styling
js/app.js               ← animation/interaction logic
js/playlist-data.js     ← music list (currently no audio — see comments inside)
assets/images/          ← the 4 decoration images
```

## Before you publish
Open `js/playlist-data.js` and read the comment at the top — decide whether
you're using your own audio files or swapping to embedded players, then
either fill it in or delete the music section from `index.html`/`app.js`
entirely if you're dropping music altogether.

## Publishing to GitHub Pages
1. Create a new **public** repo on GitHub (e.g. `for-us`).
2. Upload these files/folders keeping the exact same structure, with
   `index.html` at the repo root (not in a subfolder).
3. In the repo: **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch",
   branch `main`, folder `/ (root)`, then **Save**.
5. GitHub gives you a link like:
   `https://yourusername.github.io/for-us/`
   It can take a minute or two to go live the first time.
6. That's the link you send her — no login, no download, just opens straight
   into the page.

### Notes
- The repo can stay public without it being "findable" — nobody will stumble
  onto it unless they have the exact link, but treat the link itself as the
  thing you keep private.
- If you want a nicer URL later, GitHub Pages supports custom domains under
  Settings → Pages → Custom domain.
