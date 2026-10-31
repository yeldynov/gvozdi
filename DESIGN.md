> This is the **herbarium skin** (`settings.skin = 'herbarium'`), one of two; the default earthy skin is the app as before. Herbarium-only code lives in `src/skins/herbarium/`.

---
name: Gvozdi
description: A calm companion for nail-board practice, drawn as a herbarium sheet.
colors:
  mount-ground: "#e9ece5"
  mount-ground-2: "#dfe3da"
  mount-ground-3: "#d3d8cc"
  sheet: "#f4f5f0"
  paper: "#ffffff"
  label-ink: "#22261f"
  ink-2: "#5a6154"
  ink-3: "#6f7669"
  specimen-green: "#3f6a3a"
  on-specimen: "#ffffff"
  leaf-green: "#4f7f45"
  soil-ochre: "#b8892b"
  earned-ochre: "#9a7020"
  rust: "#a8442e"
  river-blue: "#3f6e8c"
  night-ground: "#111711"
  night-sheet: "#19211a"
  night-ink: "#e4ede0"
  pale-leaf: "#9ccb8f"
typography:
  display:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 500
    lineHeight: "40px"
    letterSpacing: "-0.5px"
  numeral:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 500
    lineHeight: "68px"
    letterSpacing: "-1.5px"
  title:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "30px"
    letterSpacing: "-0.3px"
  body:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "22px"
  caption:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.4px"
  button:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  wordmark:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "22px"
    fontWeight: 300
    letterSpacing: "0.4px"
rounded:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "32px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "32px"
  "8": "40px"
components:
  button-primary:
    backgroundColor: "{colors.specimen-green}"
    textColor: "{colors.on-specimen}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "48px"
  button-ghost:
    backgroundColor: "{colors.mount-ground-2}"
    textColor: "{colors.label-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "48px"
  sheet-card:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "20px"
  icon-step:
    backgroundColor: "{colors.mount-ground-2}"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.pill}"
    size: "36px"
  choice-segment:
    backgroundColor: "{colors.mount-ground-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "3px"
  choice-segment-selected:
    backgroundColor: "{colors.specimen-green}"
    textColor: "{colors.on-specimen}"
    rounded: "{rounded.pill}"
  input-field:
    textColor: "{colors.label-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  bottom-sheet:
    backgroundColor: "{colors.mount-ground}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Gvozdi

## Overview

**Creative North Star: "The Herbarium Sheet"**

Your practice is a living specimen mounted on a sheet. Every screen is a cool white mount laid on a sage ground, and the one thing that grows on it is a linden drawn from your sessions: a sprout at first, a tree with roots and blossom after months. The plant is the progress display; numbers stay few and large, and nothing else competes with it.

The world is quiet and botanical rather than wellness-soft. Hierarchy comes from weight and size in a single sans (Golos Text), not from colour or ornament. Sheets are plain rounded rectangles with no borders and no shadows; depth is the step from ground to sheet. Specimen green marks growth and the one primary action on a screen; ochre is reserved for the soil line and earned marks. Dark mode is the same sheet at night: green-black mount, pale leaf ink.

It deliberately leaves behind the earlier cream ground, serif headlines and terracotta card stack.

**Key Characteristics:**
- Cool mount ground, flat sheets, no borders or shadows on content.
- One sans family carries everything; a large numeral is the only display moment on Home.
- The linden tree, drawn at one shared scale for every stage, is the signature.
- Green means growth or "go"; ochre means soil or earned.
- Light and dark are designed as a pair, not inverted.

## Colors

A cool, low-chroma botanical palette: sage grounds, specimen green, and a single ochre.

### Primary
- **Specimen Green** (`specimen-green`): the primary button, selected segments, program dashes, filled week leaves, the done-today check. One green action per screen. At night it becomes **Pale Leaf** (`pale-leaf`) with dark text on it.
- **Leaf Green** (`leaf-green`): leaf fill in the tree illustration and success states.

### Tertiary
- **Soil Ochre** (`soil-ochre`): the soil line under every plant and illustration accents. Never text, never a button.
- **Earned Ochre** (`earned-ochre`): blossom on the tree and earned marks (achievement accents).

### Neutral
- **Mount Ground** (`mount-ground`): the screen background and bottom sheets. `mount-ground-2` fills ghost buttons, icon steps and segmented tracks; `mount-ground-3` is the deepest step.
- **Sheet** (`sheet`): every card. The ground-to-sheet step is the whole depth system.
- **Paper** (`paper`): pure white for the rare pinned element on a sheet.
- **Label Ink** (`label-ink`): headings, body, numerals. `ink-2` for captions, labels and secondary text; `ink-3` for muted illustration (unearned badges).
- **Rust** (`rust`) and **River Blue** (`river-blue`): error and info only.
- **Night** (`night-ground`, `night-sheet`, `night-ink`): the dark-mode counterparts of ground, sheet and ink.

### Named Rules
**The One Green Rule.** Each screen has at most one filled green button. Secondary actions are ghost buttons on `mount-ground-2`.

**The Ochre Is Earth Rule.** Ochre appears only as soil, blossom and earned marks. If it isn't ground or reward, it isn't ochre.

## Typography

**Body and Display Font:** Golos Text (400, 500, 600), with system sans fallback.
**Wordmark:** Fraunces Light, used only for the Latin "gvozdi" wordmark in the logo lockup.

**Character:** a plain, slightly humanist sans that covers Latin and Cyrillic equally, so EN, UK and RU read as one voice. Size and weight do all the work.

### Hierarchy
- **Numeral** (500, 64/68px, -1.5px): the streak count on the specimen sheet. The single biggest thing on Home.
- **Display** (500, 34/40px, -0.5px): screen titles; Home's today line runs it at 30/36px.
- **Title** (500, 24/30px, -0.3px): card and sheet headings.
- **Body** (400, 16/22px): running text, list rows; 500 weight for short emphasised rows (week total).
- **Caption** (400, 14/20px, `ink-2`): supporting lines under titles.
- **Label** (500, 13px, +0.4px, uppercase, `ink-2`): back links and small section labels only.
- **Button** (600, 16px).

### Named Rules
**The Weight Not Colour Rule.** Hierarchy is carried by size and weight. Don't colour a heading to make it louder.

**The Cyrillic Parity Rule.** Every face used must render Cyrillic. Fraunces does not, so it never leaves the wordmark.

## Layout

A single centred column, max 560px wide, with 20px side padding and 16px between sheets. Content scrolls inside a safe-area view; on web the floating tab bar reserves its height plus 36px at the bottom. Inside a sheet, 20px padding and 8px between elements by default; small tool buttons sit absolutely in the top-right corner (12px inset) and the heading pads right by 40px to clear them. Two-button rows split evenly with a 12px gap. Spacing comes from the 4px scale (4, 8, 12, 16, 20, 24, 32, 40).

The specimen sheet on Home has a fixed aspect (1.2:1). The streak numeral and caption sit top-left; the tree is drawn at 0.8 of the sheet's width, its trunk at 60% across, the soil line just above the bottom edge, so a full-grown tree fills the right side without meeting the numeral.

## Elevation & Depth

Flat. Content has no shadows and no borders; depth is the tonal step from `mount-ground` to `sheet` (or `night-ground` to `night-sheet`). The only lifted elements are system-level: bottom sheets over a 45% black scrim, and the floating web tab bar, which uses a backdrop blur (20px, saturate 1.6) and a soft shadow (`0 8px 24px rgba(0,0,0,0.12)`) because it floats over scrolling content. On iOS the native tab bar supplies its own material.

### Named Rules
**The Flat Sheet Rule.** A sheet never gets a shadow or an outline. If two things need separating, put them on separate sheets.

## Shapes

Soft rectangles. Sheets use an 18px radius, buttons a tighter 12px so they read as controls inside the sheet, bottom sheets 24px on the top corners, and every round control (icon steps, segmented tracks and segments, program dashes) is a full pill. Hairline borders appear only on text inputs. The week strip draws leaves as rounded rectangles with two opposite corners at 14px, the one organic silhouette outside the illustrations.

## Components

### Buttons
- **Shape:** gently rounded (12px), minimum 48px tall, 24px horizontal padding.
- **Primary:** Specimen Green fill, white label at 600. Full-width when it is the sheet's main action (Begin).
- **Ghost:** `mount-ground-2` fill with ink label; can take a theme colour as a faint 12% tint with coloured text (destructive confirmations).
- **Pressed / Disabled:** opacity 0.85 when pressed, 0.5 when disabled. No hover state on native; web inherits the press feedback.

### Icon steps
- 36px round buttons on `mount-ground-2` with an 18px Feather icon in ink, 8px hit slop. Used for corner tools (change, dismiss) and reorder controls.

### Segmented choice
- A pill track on `mount-ground-2` with 3px inset; the selected segment fills Specimen Green with white text, others are `ink-2` at 500. Radio semantics with `aria-checked`.

### Cards / Containers
- **Corner Style:** 18px.
- **Background:** `sheet`.
- **Shadow Strategy:** none (see Elevation).
- **Border:** none.
- **Internal Padding:** 20px, 8px gap.

### Inputs / Fields
- Body text, 18px radius, hairline border in `divider`, 16px by 12px padding. The verification code input switches to 24px tabular numerals with 8px tracking, centred.

### Bottom sheet
- Slides up over a 45% black scrim; `mount-ground` background, 24px top corners, 24px padding, 20px gap, capped at 560px wide. Tapping the scrim closes it. Used for every confirmation (there are no system alerts).

### Navigation
- Native tabs on iOS and Android (Liquid Glass on iOS 26). On web, a frosted floating bar with a lens that slides to the active tab. Every tab opens with the logo lockup left and a round burger button right.

### Specimen sheet (signature)
- The Home stats card: streak numeral and "days in a row" caption, and the linden tree drawn to the current growth stage on an ochre soil line. No labels, no milestone text: the plant is the progress. The whole sheet is one link to the next milestone, with the streak and milestone progress in its accessibility label.
- The tree uses one shared scale for every stage so growth is visible, everywhere it appears (Home, the plate, the achievement page, the unlock screen).

### Week strip
- Week total in body 500 on the left, seven leaves on the right, oldest first: filled Specimen Green on practised days, a 1.5px green outline on rest days.

### Meadow chart (Progress)
- Minutes per day drawn as stems rising from an ochre soil line, oldest first: stem height = minutes, a Specimen Green linden leaf at the tip, a second leaf mid-stem on tall week stems; rest days are a small seed dot on the soil. Stems lean alternately like grass. Week: 3.5px stems, 16px leaves, weekday letters under (today in 600 ink). 30 days: 2.5px stems, 9px leaves. No axes or gridlines; the total sits beside the heading.

### Life-cycle plate (Progress)
- Every tree stage in a row at one shared scale (96px figures), like a botanical plate of a plant's life, on one continuous soil line: ochre under the stages you've grown, a divider line beyond. Earned stages in colour, the rest muted at 55%; the next stage shows "N of M" under its name. It scrolls sideways and opens centred on your newest growth; each figure opens its achievement.

### Achievement page and unlock screen
- Achievement detail: the stage on its own sheet at the shared scale (240px), muted at 55% until grown; a Specimen Green progress bar and "N of M" under the description.
- After a save that reaches a stage: the tree grows from the previous stage (TreeGrow, 1.2s) with a short leaf burst; "Your tree grew" in display, the stage name in title, the description in body. No eyebrow above it.

### Session timer
- Timed and Free: a single Specimen Green stem (3.5px) grows round a faint nail-board field, a slim leaf at its tip pointing the way it grows; the digits sit on a soft breathing disc. No ticks, ripples or glow halos.
- Peak: the expected-intensity curve in muted ink on the ochre soil line, the travelled part in Specimen Green. The sharp phase (the PEAK chip, the "eases in" time, the 1:30 marker) is Rust; Steady is Leaf Green.

### Practice sheet
- One sheet holds the figure, the practice title and hint, the setup controls when open (mode segments, minute tiles on `mount-ground-2`, the custom stepper as a plain row), and the full-width Begin. The setup toggle sits under the sheet as a ghost pill (44px) in ink.

### Settings
- Three sheets by topic (practice: steady screen, reminder; app: language, appearance, usage stats; data and contact), then the account sheet last. Each setting is a row: name in body 500, optional caption, then its control; 24px between rows. No uppercase labels.

### Illustrations
- The character scenes (onboarding, Practice, prepare, reading pages, guide vignettes) are drawn in the herbarium palette: tops in Leaf Green, legs in deep moss (#34452f), the board in cool bark (#8d8670), petals and sparkles in blossom ochre (#c9a24a), skin and a warm blush unchanged. Every figure stands on a 3px Soil Ochre line instead of a floor shadow. No backdrop discs and no sun; the sheet is the background. Warning marks in the guide stay Rust.

## Do's and Don'ts

### Do:
- **Do** take every colour from `useColors()` and design light and night together.
- **Do** keep one filled green button per screen; everything else is ghost or an icon step.
- **Do** let the tree be the progress display: one shared scale across stages, drawn on the ochre soil line.
- **Do** keep text in Golos Text through `Txt` so EN, UK and RU match.
- **Do** keep controls at 48px tall (buttons) or give smaller round controls hit slop.

### Don't:
- **Don't** add shadows or borders to sheets.
- **Don't** use ochre for text, buttons or anything that isn't soil, blossom or an earned mark.
- **Don't** bring back the cream ground, serif headlines or terracotta of the previous look.
- **Don't** pin labels, captions or milestone text onto the specimen sheet; the plant carries the meaning.
- **Don't** use Fraunces outside the wordmark.
- **Don't** put a disc, sun or glow behind an illustrated figure; it stands on the soil line on the sheet.
