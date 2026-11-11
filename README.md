# John Ray Cacananta — Developer Portfolio

**Laboratory Activity 1: My First GitHub Project**

A personal developer portfolio built with plain **HTML5, CSS3, and vanilla JavaScript**.
Creative direction: *Time is the interface. The work is the story.* The page moves from the
past (About, Skills, Education) through the present (Projects, Experience) to the future
(Career Goals, Contact), with time-circuit instrumentation, energy traces, and a small 88 mph easter egg.

## Structure

```text
labAct1-portfolio/
├── index.html            # all content, semantic HTML5
├── css/styles.css        # design tokens, layout, motion, responsive rules
├── js/intro.js           # the DeLorean arrival intro (GSAP timeline)
├── js/main.js            # reveals, progress instrument, clock, form, scroll scenes
├── assets/
│   ├── brand/            # SINAG logo + monogram, dark and light variants
│   ├── images/           # real screenshots of the live project sites
│   └── graphics/         # favicon
└── README.md
```

## Run locally

No build step. Either:

- open `index.html` directly in a browser, or
- serve the folder: `python -m http.server 8000` and visit <http://localhost:8000>.

Fonts (Google Fonts) and GSAP/ScrollTrigger (cdnjs) load from CDNs. Without a connection the
page still works: fonts fall back to system fonts and only the scroll-scrubbed effects are skipped.

## Publish with GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select the branch and `/ (root)`, then **Save**.
4. The site appears at `https://sinagdevv.github.io/labAct1-portfolio/` after a minute or so.

All paths are relative, so the site works from a project sub-path.

## Laboratory requirements

| # | Requirement | Where |
|---|---|---|
| 1 | Header with name, portfolio title, tagline | `<header class="hero">`: “Developer Portfolio”, `<h1>` name, “Building what comes next.” |
| 2 | Navigation to About, Skills, Education, Projects, Contact | `<nav aria-label="Primary">` in the fixed bar |
| 3 | About Me, at least 3 sentences | `#about` |
| 4 | Technical Skills, at least 5 in an unordered list | `#skills`: 10 categories, each a `<ul>` |
| 5 | Education in a real table (school, program, year level) | `#education` `<table>` |
| 6 | At least 2 projects with descriptions | `#projects` (6) and `#archive` (4) |
| 7 | Career Goals, at least 3 | `#goals` `<ol>` |
| 8 | Contact with email link and labeled form | `#contact`: `mailto:` link + form with `<label>`s |
| 9 | Footer with name, year, closing message | `<footer>` |
| — | Image with alt text | Project screenshots, each with descriptive `alt` |
| — | Ordered + unordered lists, table, form, semantic elements | `<ol>` goals/timeline, `<ul>` skills, `<table>`, `<form>`, `<header> <nav> <main> <section> <article> <figure> <footer>` |
| — | Internal + external links | Section anchors; GitHub, LinkedIn, and live demo links |
| — | Responsive | Tested at 1920, 1440, 1024, 768, 390, 375 px |

## The DeLorean intro

A ~5 second opening plays once per browser session: the temporal system powers on, an original
DMC-12-inspired illustration is lit and accelerates from 00 to 88 mph, a temporal displacement
opens, and the SINAG mark resolves before handing off to the hero.

- **Skip** with the *Skip intro* button, the `Esc` key, or by scrolling.
- **Replay** from the footer (*Replay intro*).
- Visitors with `prefers-reduced-motion` never get the animated intro.
- A failsafe removes the overlay after 9 seconds no matter what, and the page works fully without it.
- No audio is used.

## SINAG brand

*Sinag* is Filipino for “ray of light”. The monogram is a geometric S split along a cyan time
axis, with the lower half displaced forward, as if it already jumped. The amber dot is the light
source. Files live in `assets/brand/` (`sinag-logo`, `sinag-mark`, each with a `-light` variant)
and are pure SVG paths, so they render without any font.

## Notes on behaviour

- **Contact form**: there is no backend. Submitting validates the fields, then opens the visitor’s
  email app with the message pre-filled through `mailto:`. It never claims a message was sent.
- **Reduced motion**: with `prefers-reduced-motion: reduce`, all entrance, reveal, and scroll
  animations are disabled and content is shown immediately.
- **No JavaScript**: all content is visible; only the animations and the live clock are lost.
- **Screenshots** in `assets/images/` were captured from each project’s live deployment.
  H.E.L.I.O.S. and OMEN have no public deployment, so they use labeled diagrams instead.
- Easter egg: scroll fast enough to hit 88 mph, or type `88`.
