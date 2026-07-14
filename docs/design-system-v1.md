# Design System V1

This document is the authoritative visual design reference for The Writing Processor.

It is documentation-first. It preserves the current product behavior, records the visual language already present in the codebase, resolves naming ambiguity, and establishes the UI rules future work should follow.

## 1. Product Identity

### Product name

The student- and teacher-facing product name is **The Writing Processor**.

### Internal architecture name

The internal architecture name is **Writing Learning Engine**.

### Relationship

- **The Writing Processor** is the product experience.
- **Writing Learning Engine** is the architectural model underneath it.
- In UI, navigation, documentation for end users, and visible product surfaces, prefer **The Writing Processor**.
- In architecture, system design, engine layering, artifact modeling, and internal implementation planning, **Writing Learning Engine** is the correct internal term.

The product should not present these as competing names. The product is The Writing Processor; the engine is the Writing Learning Engine.

## 2. Design Philosophy

The current direction should be treated as:

- **Material Design 3 inspired**: soft surfaces, clear hierarchy, restrained elevation, and semantic color usage rather than decorative styling.
- **Calm**: the interface should reduce stress, not add performance pressure.
- **Spacious**: generous spacing improves reading, reflection, and student confidence.
- **Student thinking first**: the interface should make evidence, ideas, claims, and reasoning visible.
- **Cards instead of panels**: content should be organized into bounded surfaces with clear hierarchy.
- **Consistent artifact identity**: artifacts should look recognizable wherever they appear.
- **Low visual noise**: avoid unnecessary color, borders, decorations, and competing emphasis.
- **Workspace instead of forms**: students should feel like they are building meaning, not completing disconnected fields.

## 3. Color System

### Existing Tailwind palette

The current Tailwind configuration defines these base colors:

- `theme-red`: `#A60204`
- `theme-orange`: `#D96704`
- `theme-green`: `#377303`
- `theme-blue`: `#1B406D`
- `theme-dark`: `#282A30`
- `theme-light`: `#F5F5F5`
- `theme-dark-blue`: `#0D3B66`
- `theme-deep-green`: `#0A4F47`

The current semantic colors are:

- `surface`: `#FFFFFF`
- `surface-soft`: `#F9FAFB`
- `border-soft`: `#E5E7EB`
- `text-primary`: `#282A30`
- `text-muted`: `#6B7280`

### Semantic usage

Future work should prefer semantic usage over raw palette references when possible.

- **Background**: `theme-light`
- **Surface**: `surface`
- **Surface Soft**: `surface-soft`
- **Border**: `border-soft`
- **Text Primary**: `text-primary` or `theme-dark`
- **Text Muted**: `text-muted`

### Status and action colors

- **Primary action**: `theme-blue`
- **Progress / success / confirmation**: `theme-green`
- **Instructional warning / in-progress emphasis**: `theme-orange`
- **Destructive / critical**: `theme-red`

### Artifact colors

These are the V1 semantic artifact color assignments. They use the existing muted palette and should be applied consistently across modules and the teacher dashboard.

- **Sources**: `theme-blue`
- **Evidence**: `theme-green`
- **Evidence Clusters**: `theme-dark-blue`
- **Patterns**: `theme-orange`
- **Ideas**: `theme-deep-green`
- **Claims**: `theme-blue`
- **Thesis**: `theme-dark`
- **Proof Plan**: `theme-orange`

These colors should usually appear as:

- soft tinted backgrounds (`/5` or `/10`)
- border accents
- badges
- artifact count pills
- icon accents

They should not turn the interface into a bright color map. Color is an identity aid, not a decoration layer.

## 4. Typography

### Font

- Primary UI font: **Inter**

### Current hierarchy

The codebase already uses a fairly stable hierarchy:

- **Page title**: `text-3xl font-extrabold`
- **Major section title**: `text-2xl font-extrabold` or `text-2xl font-semibold`
- **Card / workspace heading**: `text-lg font-bold` or `text-xl font-semibold`
- **Body copy**: `text-sm` to `text-base`
- **Supporting copy / labels**: `text-xs` to `text-sm`
- **Metadata / helper labels**: `text-xs uppercase tracking-wide`

### Rules

- Use strong headings sparingly.
- Prefer `text-sm` body copy for instructional text blocks.
- Use `text-xs` only for metadata, helper notes, and labels, not for primary instructions.
- Keep line length readable and prioritize left alignment for instructional content.

## 5. Spacing

### Working spacing scale

The current UI already clusters around these Tailwind spacing values:

- `p-2`
- `p-3`
- `p-4`
- `p-6`
- `p-8`
- `gap-2`
- `gap-3`
- `gap-4`
- `gap-6`
- `space-y-2`
- `space-y-3`
- `space-y-4`
- `space-y-5`
- `space-y-6`
- `space-y-8`

### Rules

- **Card padding**: prefer `p-4` for dense cards and `p-6` for major surfaces.
- **Section spacing inside cards**: prefer `space-y-3` or `space-y-4`.
- **Page spacing**: prefer `p-6` on standard pages and `sm:p-10` when extra reading space helps.
- **Artifact stacks**: prefer `space-y-2` or `space-y-3`.

The interface should feel airy, but not empty.

## 6. Cards

The system should prefer cards as the default surface primitive.

### Current card language

- primary radius: `rounded-xl`
- compact radius: `rounded-lg`
- occasional larger radius for hero/entry surfaces: `rounded-2xl`
- preferred border: `border border-border-soft`
- preferred surface: `bg-surface`
- preferred shadow: `shadow-card`
- lighter shadow where needed: `shadow-soft`

### Existing primitive

The current shared card primitive is `components/ui/Panel.jsx`:

- `bg-surface`
- `border-border-soft`
- `shadow-card`
- `rounded-xl`
- `p-6`

### Rules

- Prefer `Panel` or a direct card wrapper that matches `Panel`.
- Avoid ad hoc mixtures of `bg-white rounded shadow`, `shadow-md`, `shadow-lg`, and arbitrary border styles when a standard card would work.
- Use border plus soft elevation, not elevation alone.

## 7. Workspace Layout

The Module 3 V2 interface establishes the first three-column workspace pattern.

### Column roles

- **Left**: Thinking Canvas
- **Center**: active workspace
- **Right**: Thinking Guide

### Meaning

The Thinking Canvas is only one part of the workspace. It is not the workspace itself.

- The **Thinking Canvas** shows artifact continuity.
- The **Workspace** is where the student performs the current thinking task.
- The **Thinking Guide** gives deterministic support, reminders, and cognitive framing.

### Rules

- Left column should show artifact continuity, counts, previews, and state-of-thinking context.
- Center column should remain the clearest and most visually prominent working area.
- Right column should remain instructional, calm, and deterministic.
- Do not overload the side columns with extra interactions unless they are necessary for understanding.

## 8. Artifact Identity

Every artifact should have a consistent identity wherever it appears.

Each artifact should expose:

- **color**
- **icon**
- **label**
- **count**
- **preview**

### V1 artifact icon mapping

Use a single icon vocabulary when icons are shown:

- **Sources**: book / source icon
- **Evidence**: quote / evidence icon
- **Evidence Clusters**: stack / cluster icon
- **Patterns**: pattern / spark / relationship icon
- **Ideas**: lightbulb / interpretation icon
- **Claims**: statement / megaphone icon
- **Thesis**: flag / central argument icon
- **Proof Plan**: list / structure icon

The same artifact should not change color, name, or basic identity from one module to another.

## 9. Accessibility

The design system must preserve readability and navigability.

### Requirements

- maintain strong contrast for primary text
- do not use color as the only status indicator
- preserve readable spacing between controls
- keep click and tap targets comfortably large
- allow keyboard navigation across buttons, links, inputs, radios, and checkboxes
- keep focus states visible
- avoid burying essential instructional meaning in small helper text

### Practical rules

- badges and status pills should be paired with text labels
- selected states should combine color with border, icon, count, or wording
- workspace panes should remain readable at common laptop sizes

## 10. Component Rules

### Preferred primitives

- **Panel**: primary surface primitive
- **Card**: visual concept; should usually be implemented with `Panel` styling
- **Button**: standardized variants should converge on a small set of patterns
- **Input**
- **Textarea**
- **Select**
- **Tag**
- **Badge**

### Current implementation status

- `Panel` exists and should be treated as the primary shared surface.
- `ProgressDots` exists and should remain the base progress indicator primitive.
- Button, tag, badge, and form primitives are still mostly ad hoc in feature code.

### Rules

- New feature work should prefer shared primitives over repeating raw utility bundles.
- Buttons should standardize around semantic variants from `lib/ui/hierarchyContract.js`:
  - **Primary** (`HIERARCHY_ACTION_PRIMARY_CLASS`): the current forward workflow action — one visually dominant primary/final action per state
  - **Final** (`HIERARCHY_ACTION_FINAL_CLASS`): irreversible or high-stakes submission / completion
  - **Secondary** (`HIERARCHY_ACTION_SECONDARY_CLASS`): escape, open, copy, retry alternative, or retrieval — optional operations
  - Workflow operations use `<button type="button">` (unless intentionally submitting a form)
  - Disabled buttons must explain their gate nearby
  - All action controls retain keyboard focus (`HIERARCHY_FOCUS_RING_CLASS`) and at least a 44px target
- Links:
  - **Reference** (`HIERARCHY_REFERENCE_LINK_CLASS`): optional external instructional material (APA templates, Purdue OWL, samples)
  - **Navigation**: genuine route or sign-in location changes without performing workflow work
  - Do not style ordinary instructional text as links
  - Do not convert reference resources into JavaScript buttons

### Progressive disclosure (WP-054)

Progressive disclosure reduces simultaneous instructional layers without hiding requirements.

**Always visible**
- current task
- essential orientation (purpose / how / finished cues)
- current work surface (textarea, checklist, recording, file input, answer choices)
- completion criteria that gate or define readiness
- active errors, gates, and verification status
- primary forward action
- safety-critical submission wording and selected filename

**Disclose on demand**
- examples
- extended explanations beyond the visible purpose line
- full reference shelves / optional APA guide sections
- inactive troubleshooting
- alternative recovery actions when the main path is healthy
- optional reflection prompts

A student must be able to start required work without opening multiple disclosures first.

## 11. Motion

Motion should remain subtle and instructional.

### Rules

- use subtle transitions only
- avoid decorative animation
- motion should reinforce understanding, not entertain
- hover/focus/expand transitions are acceptable
- persistent or attention-seeking animation is discouraged

## 12. Future Screens

Modules 2–9 and the Teacher Dashboard should converge on this same visual language.

That means:

- use shared cards and surfaces
- use the same semantic tokens
- preserve artifact identity across student and teacher surfaces
- adopt the same typography hierarchy
- keep workspace layouts calm and spacious
- reduce custom one-off button, panel, and card styling

The goal is not to make every screen identical. The goal is to make them feel like parts of one product.

## Appendix A: Current Implementation Audit

The following inconsistencies exist in the current codebase and should be treated as cleanup work, not design-system exceptions.

### Token and theme inconsistencies

- `app/globals.css` sets `body` to `bg-yellow-200 text-black`, which conflicts with `app/layout.js` setting `bg-theme-light text-theme-dark`.
- `theme-gold` is used in `components/ModuleThreeForm.js` and `components/ModuleFour.js`, but is not defined in `tailwind.config.js`.
- `text-theme-muted` is used in multiple places, but `theme-muted` is not defined in `tailwind.config.js`; the semantic token that exists is `text-muted`.

### Semantic token adoption inconsistencies

- Some newer surfaces use semantic tokens like `surface`, `surface-soft`, `border-soft`, and `text-muted`.
- Many older screens still use direct `bg-white`, `border-gray-200`, `text-gray-*`, and raw `shadow` classes instead of semantic design tokens.

### Card inconsistencies

- `Panel` exists as a shared card primitive, but many screens still use one-off wrappers such as:
  - `bg-white rounded shadow`
  - `bg-white rounded-xl shadow-sm border border-gray-200`
  - `bg-theme-light rounded shadow`
- Some pages use `rounded`, some `rounded-lg`, some `rounded-xl`, and some `rounded-2xl` without a consistent surface rule.

### Button inconsistencies

- Primary buttons vary between:
  - `rounded`
  - `rounded-lg`
  - `rounded-md`
  - `rounded-full`
- Hover behavior varies between:
  - `hover:opacity-90`
  - `hover:brightness-110`
  - `hover:bg-blue-700`
  - `hover:bg-blue-800`
  - no hover state at all
- Disabled states vary between gray backgrounds, opacity reduction, and custom text colors.

### Typography inconsistencies

- Most screens use the intended hierarchy, but some legacy pages mix gray utility colors and typography styles that do not match the newer semantic token approach.
- Metadata, helper text, and section headers are not yet standardized into shared primitives.

### Shadow inconsistencies

- The design system defines `shadow-card` and `shadow-soft`.
- The codebase still uses raw `shadow`, `shadow-md`, `shadow-lg`, and `shadow-xl` in many places.

### Layout inconsistencies

- `app/layout.js` constrains all pages inside `max-w-3xl`, which conflicts with broader workspace-style layouts such as the current Module 3 V2 three-column experience.
- Some pages are clearly card-based reading flows, while others already behave more like workspace screens.

### Primitive duplication

- Shared primitives currently exist only for:
  - `Panel`
  - `ProgressDots`
- Tags, badges, buttons, button groups, status pills, and form controls are duplicated across feature files instead of standardized.

### Branding inconsistencies

- The codebase uses:
  - `Comp-YouTeacher` in metadata
  - `The Writing Processor` in product-facing UI
  - `Writing Learning Engine` in architecture docs
- These names are not yet consistently layered by audience and purpose.

## Appendix B: Prioritized Cleanup Checklist

### Priority 0: obvious correctness fixes

- Remove the `globals.css` body override so layout-level body styling is authoritative.
- Define or resolve missing tokens:
  - `theme-gold`
  - `theme-muted` or migrate those usages to `text-muted`

### Priority 1: semantic token consolidation

- Replace raw `gray-*`, `blue-*`, `red-*`, and `white` classes with semantic tokens where behavior does not change.
- Prefer `surface`, `surface-soft`, `border-soft`, `text-primary`, and `text-muted`.

### Priority 2: card and shadow consolidation

- Migrate ad hoc card wrappers toward `Panel` or a compatible shared card pattern.
- Standardize on `shadow-card` and `shadow-soft`.
- Reduce direct use of `shadow`, `shadow-md`, `shadow-lg`, and `shadow-xl`.

### Priority 3: button and form consolidation

- Standardize button variants and hover behaviors.
- Standardize border radius for buttons and inputs.
- Standardize disabled-state styling.

### Priority 4: spacing and typography cleanup

- Normalize card padding and section spacing.
- Standardize helper text, headings, and metadata styles across modules.

### Priority 5: layout system cleanup

- Decide which routes remain narrow reading flows and which need wider workspace layouts.
- Make those layout rules explicit instead of relying on one shared max-width for all pages.

### Priority 6: primitive expansion

- Introduce shared primitives for:
  - Button
  - Input / Textarea / Select
  - Tag
  - Badge
  - Status pill

### Priority 7: branding cleanup

- Make product-facing UI consistently use **The Writing Processor**.
- Reserve **Writing Learning Engine** for architecture and internal system language.
