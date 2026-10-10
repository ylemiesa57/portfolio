---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Surface brief: home (app/page.tsx)

## Scope and mode

Scope: the whole site, which is one screen. Mode: Read. The text leads; the interface is a bar, the view, and an Ask field.

## Audience, job, action, proof, constraints

Audience: researchers, engineers and recruiters arriving from a link. Job: read this person as a researcher who also builds, and reach one proof or a contact link. Action: read the first screen, switch views from the bar, or ask a question. Constraints, pinned by the user on 2026-10-04 after seeing the atlas build: much simpler; less content, less motion, quieter colour and type; no scrolling; an elegant load in which parts of words arrive one at a time; the RAG feature stays in some form. Every fact still traces to GitHub, Scholar or the resume. The direction was pinned by the user, so no roll was held for it.

## Direction contract

THESIS: One quiet screen that never scrolls. The bar switches views in place, the text arrives a part of a word at a time, and a single field at the foot asks the knowledge graph. It refuses both the long scrolling portfolio and the decorated one.

OWN-WORLD: One ground (#F7F7F5), one ink (#15171C), a soft grey for secondary text, hairline rules, and a single blue (#2B3FA8) kept for focus, the caret and citation hover. STIX Two Text for everything read, Archivo for the bar, lists and small print. No panels, no shadows, no radius, no icons; links are underlined words. The portrait is the only image, in its own colour (the user asked for colour on 2026-10-05).

STORY: A visitor watches the name and one sentence arrive, reads Now / Before / Degree, and either picks a view from the bar or types a question. A list on the left and the open entry on the right cover Research, Projects, Open source, Experience and Community; Publications is three papers. The answer view names the stage it is in, then the answer arrives the same way the page did, with the sources it came from as links into the views.

FIRST VIEWPORT: Desktop 1440x900. A bar with the name at left and seven view links at right over a hairline. In the middle of the screen, the name at up to 5.25rem, the statement, three fact rows, four contact links, and the portrait at the right. At the foot, over a hairline, the Ask field and its button.

FORM: Single-screen reading page with in-place views; pinned by the user, replacing the survey atlas (seed key efe04ddf). Build path: code-led.

SIGNATURE INTERACTION AND MOTION: The reveal. Text is split into parts of two or three letters that fade and sharpen in sequence, capped so long passages finish in about a second; lists and small print simply fade. Views and entries replay it on change. Reduced motion shows everything at once. Where the screen is short or narrow, a long entry is read a paragraph at a time rather than scrolled.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Memorable moment

The name assembling itself out of parts of words on an almost empty screen.

## Unresolved

Finish review run 2026-10-04: eight fixes applied, verdict ship (scoped to those fixes plus the Research and landscape views). public/resume.pdf does not exist yet. The research statement and thread groupings need the author's read. Skills, coursework, project images and the non-featured repositories are no longer shown on the page (the knowledge graph still holds them for Ask).
