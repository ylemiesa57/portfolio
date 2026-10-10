---
name: Yaphet Lemiesa
description: One quiet screen that never scrolls; a researcher's work read in place, with a field to ask it questions.
colors:
  accent: "#2b3fa8"
  ground: "#f7f7f5"
  ink: "#15171c"
  soft: "#62656f"
  rule: "#e2e2de"
  rule-strong: "#b9bac0"
typography:
  display:
    fontFamily: "STIX Two Text, Cambria, Georgia, serif"
    fontSize: "clamp(2.75rem, 7vw, 5.25rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "STIX Two Text, Cambria, Georgia, serif"
    fontSize: "clamp(1.625rem, 3vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.012em"
  title:
    fontFamily: "STIX Two Text, Cambria, Georgia, serif"
    fontSize: "clamp(1.125rem, 1.7vw, 1.375rem)"
    fontWeight: 600
    lineHeight: 1.3
  lead:
    fontFamily: "STIX Two Text, Cambria, Georgia, serif"
    fontSize: "clamp(1.1875rem, 1.9vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "STIX Two Text, Cambria, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  ui:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.35
  meta:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.55
rounded:
  none: "0px"
spacing:
  gutter: "clamp(20px, 5vw, 64px)"
  row: "6px"
  step: "14px"
  gap: "16px"
  block: "22px"
  column: "clamp(32px, 7vw, 104px)"
  stage-top: "clamp(24px, 8vh, 88px)"
components:
  nav-link:
    textColor: "{colors.soft}"
    typography: "{typography.ui}"
    padding: "4px 0"
  nav-link-hover:
    textColor: "{colors.ink}"
  nav-link-current:
    textColor: "{colors.ink}"
  list-row:
    textColor: "{colors.soft}"
    typography: "{typography.ui}"
    padding: "6px 0"
    width: "100%"
  list-row-hover:
    textColor: "{colors.ink}"
  list-row-current:
    textColor: "{colors.ink}"
  text-link:
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
  quiet-action:
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    padding: "4px 0"
  citation-row:
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    padding: "9px 0"
    width: "100%"
  citation-row-hover:
    textColor: "{colors.accent}"
  ask-field:
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "44px"
    padding: "0"
  ask-button:
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.none}"
    height: "36px"
    padding: "0 16px"
  ask-button-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  ask-button-disabled:
    textColor: "{colors.soft}"
  skip-link:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.meta}"
    padding: "10px 14px"
---

# Design System: Yaphet Lemiesa

## Overview

**Creative North Star: "The Quiet Page"**

The whole site is one screen that does not scroll: a bar, the view, and a field to ask a question. There is one ground, one ink, a soft grey for whatever is secondary, and hairlines where two regions meet. Everything a visitor reads is set in a serif built for scientific publishing; everything they operate is set in a plain sans. The page is a sheet of text with nothing on it that is not text, a rule, or the one portrait.

Restraint is a rule of this system, not a mood. It was asked for directly, after an ornate build was rejected: much simpler, less content, less motion, quieter colour and type, no scrolling. A new surface earns its place by removing something, and anything added has to be made of the materials already here (a word, an underline, a hairline, a change from soft to ink). The single flourish the system allows itself is how text arrives: a part of a word at a time, quickly, then still.

Rejected by the user and not to return: the decorated portfolio (plates, panels, ornament, a display face for show, a bright signal colour) and the long scrolling portfolio.

**Key Characteristics:**
- One screen, three rows: bar, view, Ask strip. Views change in place; the address hash carries the view and the open entry.
- One ground, one ink, one soft grey, two hairline weights of grey, one blue that only marks attention.
- Two faces: STIX Two Text for what is read, Archivo for what is operated.
- No panels, no shadows, no radius, no icons. Links are underlined words; controls are words.
- Text arrives a part of a word at a time; lists and small print only fade.
- Light only (`color-scheme: light`); there is no dark theme.

### Named Rules
**The Restraint Rule.** Nothing is added that the reading does not need. Before adding a colour, a weight, a size, a container or a movement, try the existing soft-to-ink change, an underline, or a hairline. If those cannot carry it, the thing probably does not belong on this page.

## Colors

A near-white paper, a near-black ink, and greys taken from between them; colour proper appears only where the visitor's attention is.

### Primary
- **Attention Blue** (`accent`): the keyboard focus outline (2px, 3px offset), the text caret, the Ask strip's top rule while the field or its button holds focus, and the hover colour of a citation row. It never fills an area, never colours resting text, and never appears as decoration.

### Neutral
- **Paper** (`ground`): the single background of the whole page, and the browser theme colour. The text colour of anything inverted.
- **Ink** (`ink`): all reading text, the current item in the bar and in lists, link text, the Ask button's border and label. The background of anything inverted. 16.7:1 on Paper.
- **Soft Grey** (`soft`): everything secondary: resting bar links and list rows, the labels of the fact rows, meta lines, asides, group headings, the placeholder, the note under the Ask field. 5.4:1 on Paper, so it holds AA at every size it is used.
- **Hairline** (`rule`): the 1px line under the bar, over the Ask strip, and between citation rows.
- **Strong Hairline** (`rule-strong`): the resting underline of text links and quiet actions, the border of the disabled Ask button, the thumb of the fallback scrollbar. Never text.

### Named Rules
**The One Blue Rule.** Blue marks where attention is right now: focus, the caret, the citation under the pointer. If a blue thing would still be blue with nobody touching the page, it is wrong.

**The Soft-to-Ink Rule.** Choices rest in Soft Grey and become Ink when hovered or current. The current one also takes a 1px underline. That change is the entire selection vocabulary; there is no highlight bar, fill, or marker.

**The Inversion Rule.** The only emphatic state is swapping Ink and Paper: the text selection, the skip link, and the Ask button under the pointer. No third colour is used for emphasis.

## Typography

**Display Font:** STIX Two Text (with Cambria, Georgia, serif), roman and italic
**Body Font:** STIX Two Text (same family; there is no separate display face)
**Label Font:** Archivo (with Helvetica Neue, Arial, sans-serif)

**Character:** The face scientific publishing set itself in, used for everything that is read, beside a plain grotesque for everything that is operated. The serif carries the voice; the sans stays out of the way.

### Hierarchy
- **Display** (400, `clamp(2.75rem, 7vw, 5.25rem)`, line-height 1, -0.022em): the name on the first view, once. Drops to 2.5rem on a short narrow screen and 2rem on a phone on its side.
- **Headline** (400, `clamp(1.625rem, 3vw, 2.25rem)`, line-height 1.12, -0.012em): the name of the open entry.
- **Title** (600, `clamp(1.125rem, 1.7vw, 1.375rem)`, line-height 1.3): a publication's title.
- **Lead** (400, `clamp(1.1875rem, 1.9vw, 1.5rem)`, line-height 1.4): the statement on the first view, capped at 30em; the Ask answer is set at the same scale.
- **Body** (400, 1.0625rem, line-height 1.55): entry paragraphs and the intro above a list. Measure is capped by the entry column at 38rem (about 75 characters); it steps to 1rem / 1.5 on short screens.
- **UI** (Archivo 400, 0.9375rem): bar links, list rows, fact rows, text links, citation rows.
- **Meta** (Archivo 400, 0.875rem, line-height 1.5): the line under an entry name, authors and venue, the pager, quiet actions, and (at 600) the Ask button's label.
- **Label** (Archivo 600, 0.8125rem, Soft Grey): the heading of a group within a list. The same size at weight 400 sets the aside at the right of a row.

The name in the bar is STIX Two Text at 600, 1.125rem: the serif, not the sans, even though it sits in the bar. The Ask field is also the serif at 1.125rem, because a question is something read.

### Named Rules
**The Two Voices Rule.** If it is read, it is STIX Two Text. If it is operated or is small print about something read, it is Archivo. A third family is never introduced, and neither face is used for the other's job.

**The Plain Setting Rule.** Sentence case everywhere. No uppercase, no positive letter-spacing, no small caps. Weight is 400 by default; 600 appears only on the name in the bar, publication titles, group headings and the Ask button. Italic is for a venue or a title within text, never for emphasis by habit.

## Layout

The page is a three-row grid exactly one viewport tall (`100svh`): the bar, the view, the Ask strip. The document itself cannot scroll. Content sits in a single column up to 1240px wide with a fluid gutter (`spacing.gutter`).

The view begins at the same height on every page (`spacing.stage-top`) so that switching does not jump; only the first view is centred vertically. Two arrangements cover everything:

- **First view:** name, statement, fact rows and contact links at the left; the portrait at the right, standing on the baseline of the last row of text.
- **List and entry:** a list no wider than 23rem at the left, the open entry (capped at 38rem) at the right, separated by `spacing.column`. The first entry is shown beside the list before anything is chosen. Publications and the answer are single columns (44rem and 42rem).

Spacing is small and close-set. The recurring steps are 6px (a row's padding), 14px (a label to its list, a name to its text), 16px (between a row's two ends, between field and button) and 22px (between groups, between publications, above the citation list). There is no numeric spacing scale in the code beyond the gutter; these are the values that recur.

**Fitting instead of scrolling.** When an entry is taller than its room, the view measures itself and shows as many paragraphs as fit, with a count ("1 of 3") and a Continue action. On small screens an answer's sources show three at a time with a link to the rest. As a last resort only, the view region itself may scroll, with a thin visible scrollbar; the page still does not.

**Responsive behaviour.**
- At 760px wide and below: one column. The portrait moves above the name at 88px. The list and the entry are shown one at a time, the entry with a "Back to the list" action; in list-only state no row is marked current.
- At 700px tall and below: bar, view and strip padding all tighten a step, and body text steps down to 1rem.
- At 520px tall and below: the one-thing-at-a-time arrangement applies at any width, lists set in two columns across the width, and the three publications sit side by side.
- At 480px and 420px tall: the portrait, the note under the Ask field, the entry's meta line and the echoed question are dropped so the essentials fit.

### Named Rules
**The One Screen Rule.** The page never scrolls. New content gets a view in the bar, an entry in a list, or a page within an entry; it never gets length.

**The One Thing Rule.** When there is not room for the list and the entry together, show one, with a worded way back. Do not shrink both to fit.

## Elevation & Depth

There is none. The page is a single flat plane on one ground: no shadows, no tonal layers, no overlays, no blur behind anything, no sticky surfaces floating over others. Separation between regions is a 1px hairline; separation between items is space.

The one `box-shadow` in the code is not depth: an inset 1px line that, together with the top border turning blue, makes the Ask strip's rule 2px of Attention Blue while it holds focus.

### Named Rules
**The Flat Page Rule.** Nothing sits on top of anything. If a design needs a surface above the page (a modal, a popover, a card, a drawer), it becomes a view instead.

## Shapes

Square and unboxed. The radius is zero everywhere, stated explicitly on the field and the button so no platform default leaks in. The only drawn shapes are horizontal 1px hairlines, 1px underlines, the Ask button's 1px rectangle, and the square portrait (1:1, in its own colour, 120 to 176px). Lists have no bullets, rows have no dividers except in the citation list, and there are no icons or glyph stand-ins of any kind: an action is its word.

### Named Rules
**The Hairline Rule.** A line is 1px and horizontal, in Hairline between regions and Strong Hairline under words. Lines never enclose content; the Ask button is the only outlined box on the page.

## Components

Controls are words. They are quiet at rest and answer with a change of colour over 0.2s; nothing moves, grows or lifts on interaction.

### Buttons
- **Ask button:** the one outlined control. 36px tall, 16px side padding, 1px Ink border, no fill, square corners, Archivo 600 at 0.875rem.
- **Hover:** inverts to Ink fill with Paper text (background and colour, 0.2s ease-out).
- **Disabled** (while an answer is being produced): Strong Hairline border, Soft Grey label, default cursor.
- **Quiet action** (Continue, Start again, Stop, Close, Try again, more sources): a borderless, unfilled word in Archivo 0.875rem Ink with a Strong Hairline underline that turns to the text colour on hover. "Back to the list" is the same device in Soft Grey.

### Inputs / Fields
- **Ask field:** no box at all. 44px tall, no border, no background, no padding, STIX Two Text at 1.125rem; placeholder in Soft Grey; caret in Attention Blue.
- **Focus:** the field draws no outline of its own. The strip it sits in shows focus instead: its top hairline becomes 2px of Attention Blue.
- **Status note:** when Ask cannot answer fully, one line of Archivo 0.75rem Soft Grey under the field says why.

### Navigation
- **Bar:** the name at the left (STIX 600, 1.125rem, no underline, returns to the first view), seven view links at the right, baseline-aligned, over a hairline. Links wrap to further lines on narrow screens rather than collapsing into a menu.
- **Links:** Archivo 0.9375rem, Soft Grey; Ink on hover; the current view is Ink with a 1px underline set well below the word (0.45em).
- **Text links:** Ink (or the colour of the line they sit in) with a 1px Strong Hairline underline at 0.28em that darkens to the text colour on hover. External links open in a new tab.
- **Skip link:** inverted (Ink ground, Paper text), fixed at the top left, visible only on keyboard focus; it moves focus into the view.

### List Row
A full-width, borderless, unfilled button: the name at the left, an optional aside (a year, a domain) at the right in 0.8125rem Soft Grey, baseline-aligned, 6px vertical padding. Soft Grey at rest, Ink on hover; the current row is Ink with its name underlined at 1px. Groups within a list are headed by a Label and separated by 22px.

### Open Entry
The name as a Headline, one Meta line in Soft Grey, then Body paragraphs 14px apart, then a row of text links. When it does not fit it pages (see Layout): a count and a quiet action, never a scrollbar.

### Fact Rows
A definition list in Archivo 0.9375rem: a 4.5rem column of Soft Grey labels (Now, Before, Degree) and Ink values, 6px apart, multiple values stacked.

### Publication
A Title, then two Meta lines in Soft Grey (authors; venue in italic with the citation count after a middle dot). Entries are 22px apart with no rules between them.

### Answer
The question echoed in Archivo 0.9375rem Soft Grey; while working, one Meta line naming the stage in words ("Searching the graph of my work…") with a Stop action; then the answer at Lead scale. Its sources follow as **citation rows**: full-width, 9px vertical padding, a hairline above the list and under every row, the source at the left in Ink and the view it lives in at the right in Soft Grey. A citation row turns Attention Blue on hover and opens the view that proves it. A Close action returns to where the visitor was. Errors and ungrounded answers are said in a plain sentence with a quiet action beside it.

### The Reveal (signature)
Text arrives a part of a word at a time. Each word is split into parts of two or three letters; each part fades in from transparent, a 5px blur and a 0.14em drop over 0.55s on a long ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), one after another. The interval between parts shortens for long passages so a whole run finishes within its cap (about a second; 1.6s for an Ask answer). Lists, meta lines, links and the portrait only fade (opacity, 0.7s), lightly staggered; the bar and the Ask strip fade once on load.

The unhurried pace is for the first arrival. After the first move between views the same sequence plays at roughly a quarter of the delay and 0.4s per part, so navigating never costs a wait; the Ask answer alone keeps the full pace. With reduced motion every animation is off and the text is simply there. Assistive technology is given each string whole, once.

### Named Rules
**The Arrival Rule.** Motion is how text arrives and nothing else. Only read text gets the part-by-part reveal; everything else fades; nothing moves in response to hover, scroll or selection.

## Do's and Don'ts

### Do:
- **Do** keep the page to one viewport: bar, view, Ask strip. Add a view, an entry or a page within an entry instead of length.
- **Do** set everything read in STIX Two Text and everything operated in Archivo, in sentence case, at weight 400 unless it is one of the four places that take 600.
- **Do** show choice by the Soft-to-Ink change plus a 1px underline on the current item.
- **Do** separate regions with a 1px Hairline and items with space (6, 14, 16, 22px).
- **Do** write controls as words: "Back to the list", "Continue", "Close", "3 more sources".
- **Do** keep Attention Blue to focus, the caret, the focused Ask strip and citation hover.
- **Do** say failures and gaps in a plain sentence in the place they occur (the graph is offline; GitHub didn't answer this hour).
- **Do** give every animation a reduced-motion state that shows the finished page at once.

### Don't:
- **Don't** add panels, cards, tinted areas, shadows, gradients, rounded corners, or anything that sits above the page. The only fill is the inversion to Ink.
- **Don't** add icons, arrows, glyph bullets or emoji as interface; an action is its word.
- **Don't** add a second accent, a tinted background, or blue on anything at rest.
- **Don't** introduce a third typeface, uppercase labels, tracked-out small print, or a display face for show.
- **Don't** let the document scroll, and don't use a view-level scrollbar as a design choice; it exists only as a last resort.
- **Don't** animate on hover, scroll or selection, and don't make navigation wait for the reveal.
- **Don't** bring back ornament from the retired builds: plates, charts, borders that enclose content, a bright signal colour.
- **Don't** add images beyond the one portrait without a decision to change this system.
