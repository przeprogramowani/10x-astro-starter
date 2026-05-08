# Homepage Cosmic Redesign Implementation Plan

## Overview

Replace the current tech-stack showcase homepage (`Welcome.astro`) with a simple, impactful landing page featuring a cosmic/space aesthetic. The new page will have a deep dark background with static glowing orbs and star-like dots, a bold hero section with CTAs, and 2-3 feature cards — all in English, using only CSS effects with no new dependencies.

## Current State Analysis

The homepage is a developer-facing tech-stack listing:

- `src/pages/index.astro` renders `<Layout>` + `<Welcome />`
- `Welcome.astro` imports `package.json` + `prettier/package.json` to extract version numbers, displays them via `LibBadge` components in three categorized sections
- Background uses `from-indigo-900 via-purple-900 to-blue-900` gradient
- All other pages (auth, dashboard) share the same gradient + glassmorphism pattern

The design system already supports what we need: Tailwind 4 with OKLCH tokens, glassmorphism patterns, gradient text, and `tw-animate-css` (though we'll keep effects static per user preference).

### Key Discoveries:

- `Welcome.astro:2-14` imports `LibBadge`, `Topbar`, and both package.json files for version extraction — all version-related code will be removed
- `button.tsx` provides `default`, `outline`, `ghost`, `link` variants with `sm`/`default`/`lg` sizes — but CTAs are links, not buttons, so plain `<a>` tags with Tailwind styling are more appropriate (follows "Astro components for static content" convention)
- `Topbar.astro` handles auth-aware navigation and stays as-is
- No custom fonts — system sans-serif stack (user confirmed: keep it)
- `lucide-react` is available for icons but requires React hydration — inline SVG is preferable for static Astro components

## Desired End State

A clean cosmic landing page at `/` with:

- Deep space background (near-black with subtle blue/purple depth)
- 2-3 static glowing orbs as cosmic decoration (blurred, positioned absolutely)
- CSS-based star-like dots in the background
- Bold hero heading in English with gradient text
- One-line subtitle
- Two CTA buttons (Sign In, Sign Up) linking to auth pages
- 2-3 glassmorphic feature cards below the hero (Auth-ready, Modern Stack, DX)
- Topbar navigation unchanged
- Fully responsive down to mobile
- Respects `prefers-reduced-motion` (though effects are static, this is good practice for future changes)

**Verification**: `npm run dev` → visit `http://localhost:3000` → page shows cosmic hero with CTAs and feature cards, no tech-stack version listing. All auth links work. Responsive on mobile viewport.

## What We're NOT Doing

- No custom web fonts (system fonts only)
- No CSS animations or keyframe effects (static cosmic elements)
- No Topbar redesign
- No changes to Layout.astro, auth pages, or dashboard
- No new npm dependencies
- No changes to the Tailwind theme tokens in global.css
- No React islands on the homepage (pure Astro component)

## Implementation Approach

Single-component rewrite: `Welcome.astro` gets replaced entirely. The page structure (`index.astro` → `Layout` + `Welcome`) stays the same. Cosmic decorations are pure CSS (positioned/blurred divs for orbs, `background-image` with `radial-gradient` for stars). Feature cards use existing glassmorphism patterns. CTA links use plain `<a>` tags styled with Tailwind (no React Button component needed for static links).

---

## Phase 1: Cosmic Hero Section

### Overview

Rewrite `Welcome.astro` with a deep space background, static cosmic decorations, and a bold hero section with CTA links. This phase delivers the visual foundation and primary interaction point.

### Changes Required:

#### 1. Rewrite Welcome.astro

**File**: `src/components/Welcome.astro`

**Intent**: Replace the entire component content. Remove all package.json imports, version extraction logic, and LibBadge usage. Build a new layout with: (a) a deep space background replacing the current lighter gradient, (b) 2-3 absolutely-positioned blurred divs as glowing cosmic orbs, (c) a CSS `background-image` with multiple `radial-gradient` stops to create static star-like dots, (d) a centered hero section with a large gradient-text heading, a subtitle, and two CTA links (Sign In → `/auth/signin`, Sign Up → `/auth/signup`), (e) the existing `Topbar` component preserved at the top.

**Contract**:

- Component imports: only `Topbar` from `@/components/Topbar.astro` (remove `LibBadge`, `pkg`, `prettierPkg`, and all `ver()` logic)
- Outer container: full-screen (`min-h-screen`), dark background — use a deeper color than current `indigo-900`, something closer to a space-black base (e.g., `bg-[#0a0e1a]` or a very dark gradient `from-[#0a0e1a] via-[#0f1529] to-[#0a0e1a]`)
- Cosmic orbs: 2-3 `<div>` elements with `absolute`, `rounded-full`, large dimensions (200-400px), `blur-3xl` or `blur-[100px]`, semi-transparent purple/blue fills (`bg-purple-500/20`, `bg-blue-500/15`), `pointer-events-none`, positioned at different spots on the page
- Star dots: CSS `background-image` on the outer container using multiple `radial-gradient(circle, white 1px, transparent 1px)` at different `background-size` values for varied density — or a dedicated star-field wrapper div
- Hero: centered `max-w-4xl`, heading `text-5xl sm:text-6xl lg:text-7xl font-bold`, gradient text using existing pattern (`bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text`), subtitle `text-lg sm:text-xl text-blue-100/70`
- CTAs: two `<a>` tags styled as buttons — primary (solid purple, e.g., `bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg`) and secondary (outline, e.g., `border border-white/20 hover:bg-white/10 text-white px-6 py-3 rounded-lg`), linking to `/auth/signin` and `/auth/signup`
- Overflow: `overflow-hidden` on the outer container to clip orbs that extend beyond viewport

### Success Criteria:

#### Automated Verification:

- Build succeeds: `npm run build`
- Lint passes: `npm run lint`
- Dev server starts without errors: `npm run dev`

#### Manual Verification:

- Homepage at `localhost:3000` shows deep space background with visible cosmic orbs and star dots
- Hero heading is large, bold, uses gradient text, and reads well in English
- Two CTA buttons are visible and link correctly to `/auth/signin` and `/auth/signup`
- Topbar displays correctly with auth state (test both signed-in and signed-out)
- No horizontal scroll or overflow issues on desktop
- Page looks good on mobile viewport (375px width)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Feature Cards + Cleanup

### Overview

Add 2-3 feature cards below the hero section highlighting the starter's key capabilities. Clean up any unused code from the old design.

### Changes Required:

#### 1. Add feature cards to Welcome.astro

**File**: `src/components/Welcome.astro`

**Intent**: Add a section below the hero with 2-3 glassmorphic cards, each highlighting a key capability of the starter: (1) Authentication Ready — built-in Supabase auth, (2) Modern Stack — Astro 5, React 19, Tailwind 4, TypeScript, (3) Developer Experience — ESLint, Prettier, pre-commit hooks. Each card should have an inline SVG icon, a title, and a short description.

**Contract**:

- Cards container: `max-w-4xl mx-auto`, responsive grid (`grid grid-cols-1 sm:grid-cols-3 gap-6`)
- Each card: follows existing glassmorphism pattern (`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6`)
- Icons: inline `<svg>` elements (not lucide-react — avoid React hydration for static content), ~24x24px, `text-purple-300` stroke color
- Card title: `text-lg font-semibold text-white mb-2`
- Card description: `text-sm text-blue-100/60 leading-relaxed`
- Section spacing: adequate margin/padding between hero and cards (e.g., `mt-16` or `mt-20`)

#### 2. Verify LibBadge is not used elsewhere

**File**: `src/components/ui/LibBadge.astro`

**Intent**: Check if LibBadge is imported anywhere outside of the old Welcome.astro. If it's only used by Welcome, it's now dead code. Leave it in place (not worth a cleanup PR) but confirm it's unused.

**Contract**: Search for `LibBadge` imports across `src/`. No file changes needed — just verification.

### Success Criteria:

#### Automated Verification:

- Build succeeds: `npm run build`
- Lint passes: `npm run lint`
- No TypeScript errors (if applicable): `npx tsc --noEmit`

#### Manual Verification:

- Three feature cards are visible below the hero section
- Cards use glassmorphism styling consistent with the rest of the app
- Each card has a distinct icon, title, and description
- Cards display in a 3-column grid on desktop, stacking to single column on mobile
- No visual regression on the hero section from Phase 1
- Auth flow still works: click Sign In → `/auth/signin` page loads correctly

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Unit Tests:

- No unit tests needed — this is a pure presentational component with no logic

### Integration Tests:

- Not applicable — no API or data flow changes

### Manual Testing Steps:

1. Visit `localhost:3000` — verify cosmic background, hero, CTAs, and feature cards render correctly
2. Click "Sign In" CTA → should navigate to `/auth/signin`
3. Click "Sign Up" CTA → should navigate to `/auth/signup`
4. Test with a signed-in user → Topbar should show email + dashboard link
5. Resize browser to mobile (375px) → layout should stack gracefully, orbs should not cause overflow
6. Resize to tablet (768px) → feature cards should be in a row
7. Check browser console for errors — should be clean

## Performance Considerations

- All cosmic effects are CSS-only — zero JavaScript, zero bundle weight increase
- Blurred divs use `filter: blur()` which is GPU-accelerated
- Star-field uses `background-image` (single paint, no reflow)
- No web fonts to download — system font stack
- Removed package.json imports mean fewer server-side file reads per request

## References

- Research: `context/changes/redesign/research.md`
- 10xDevs.pl design analysis: see research doc "10xDevs.pl Design Analysis" section
- Current Welcome component: `src/components/Welcome.astro:1-108`
- Existing glassmorphism pattern: `src/pages/auth/signin.astro`, `src/pages/dashboard.astro`
- Button variants reference: `src/components/ui/button.tsx`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Cosmic hero section

#### Automated

- [x] 1.1 Build succeeds: `npm run build` — fb19dcb
- [x] 1.2 Lint passes: `npm run lint` — fb19dcb
- [x] 1.3 Dev server starts without errors: `npm run dev` — fb19dcb

#### Manual

- [x] 1.4 Homepage shows deep space background with cosmic orbs and star dots
- [x] 1.5 Hero heading is large, bold, gradient text, reads well in English
- [x] 1.6 Two CTA buttons visible and link correctly to auth pages
- [x] 1.7 Topbar displays correctly in both auth states
- [x] 1.8 No overflow issues on desktop, looks good on mobile (375px)

### Phase 2: Feature cards + cleanup

#### Automated

- [x] 2.1 Build succeeds: `npm run build`
- [x] 2.2 Lint passes: `npm run lint`
- [x] 2.3 No TypeScript errors: `npx tsc --noEmit`

#### Manual

- [x] 2.4 Three feature cards visible below hero with icons, titles, descriptions
- [x] 2.5 Cards display 3-column on desktop, single column on mobile
- [x] 2.6 No visual regression on hero section from Phase 1
- [x] 2.7 Auth flow still works end-to-end
