# AGENTS.md

## Cursor Cloud specific instructions

This is a **pure static website** (HTML, CSS, vanilla JS) with no build system, no package manager, no tests, and no linting tools. All JS libraries (GSAP, AOS, Font Awesome, Google Fonts) are loaded from external CDNs.

### Running the dev server

Serve the repository root with any static file server:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in a browser. A ~1 second loading animation plays before the page content appears.

### Key caveats

- There is **no `package.json`**, no dependency installation step, and no build step.
- The HTML references `code.mp3` for background music, but the file does not exist in the repo; this is harmless.
- CDN assets (fonts, icons, animation libraries) require internet access. Without it the page still renders but with degraded visuals.
- The contact form is client-side only (`alert()` on submit); it does not send data to a backend.
