# RollbackReady landing-page frontend strategy

## 1. Recommended packages and purpose

| Package | Purpose | Rule |
| --- | --- | --- |
| Next.js + TypeScript | App Router, metadata, server-first delivery, API proxy, strict UI contracts | Keep the landing shell server-capable; isolate interactive workflow in explicit client boundaries. |
| Tailwind CSS v4 | Fast, consistent layout and state utilities | Use for primitives and one-off layout; keep the product-specific visual language in `globals.css`. |
| shadcn/ui pattern + Radix UI | Accessible, source-owned primitives; Radix supplies focus, keyboard, tabs, and tooltip behavior | Copy only the primitives the product needs. Do not install a large component suite. |
| GSAP + ScrollTrigger | Cinematic section entrances and any future pinned narrative | Owns scroll-linked transforms and opacity only. Never owns hover or application state. |
| Lenis | One smooth-scroll transport with consistent wheel behavior | It never animates components. Disable it for reduced motion and destroy it on unmount. |
| Motion | Buttons, cards, state transitions, alerts, and micro-interactions | Owns hover, tap, enter/exit, and data-state transitions. It never scrubs against scroll. |
| Lucide React | Consistent semantic icons with small tree-shaken imports | Icons supplement labels; they never replace accessible text. |
| `@xyflow/react` | Interactive migration/evidence dependency graph | Dynamically imported below the fold. Disable editing and constrain zoom/pan. |
| `@monaco-editor/react` | Credible read-only SQL comparison | Dynamically imported and limited to a read-only preview with a custom dark theme. |
| Sonner | Non-blocking progress, success, and error feedback | Toasts supplement—not replace—visible status and error regions. |
| class-variance-authority, clsx, tailwind-merge | Small, typed shadcn-style variants and reliable class composition | Use only in reusable primitives. |

Deliberately omitted: Three.js, Framer-specific cursor libraries, Lottie, large charting libraries, and a general state store. They add weight without improving the migration story.

## 2. Landing-page information architecture

1. **Navbar** — product navigation, sandbox status, authentication.
2. **Hero** — promise, safety boundary, live verdict console, primary demo action.
3. **Interactive migration visualization** — evidence graph plus built-in and upload entry points.
4. **Problem** — why successful deployment is insufficient evidence.
5. **Risk detection** — four deterministic rule families and live findings.
6. **Failure injection** — ordered interruption and recovery timeline.
7. **AI recovery plan** — bounded Gemini role, SQL comparison, plan generation.
8. **Expand → Deploy → Backfill → Verify → Contract** — safer release protocol.
9. **Evidence report** — independent dimensions and sanitized export.
10. **Technical architecture** — Next.js, FastAPI, sandbox PostgreSQL, bounded Gemini branch.
11. **CTA/footer** — rerun the demo, revisit architecture, project identity.

### Section behavior contract

| Section | Components and states | Animation and micro-interactions | Responsive and accessibility |
| --- | --- | --- | --- |
| Navbar | Glass bar, semantic links, Radix tooltip, Clerk state, mobile menu | CSS status pulse; Motion button feedback; no scroll transform | Sticky but compact; keyboard links; `aria-expanded`; tooltip retains visible text trigger. |
| Hero | Headline, two CTAs, safety facts, verdict console | One load entrance; staged console rows; button hover/tap | Single column under 1050px; no autoplay media; reduced motion removes staging. |
| Migration graph | React Flow graph, selected-node inspector, demo and upload cards | Animated edges communicate flow; selection changes border/glow; upload zone changes border | Graph becomes stacked; clear `aria-label`; editing disabled; all actions remain regular controls. |
| Problem | Three failure-gap cards | GSAP reveal and subtle Motion card lift; scan line signals an unresolved check | One column on mobile; scan stops for reduced motion; high-contrast copy. |
| Risk detection | Four risk-family cards, verdict, findings | Color/state changes, restrained card scale, finding stack updates | Two columns then one; color is paired with text and icons. |
| Failure injection | Timeline, execution status, state machine | Timeline rails grow in sequence; live events replace preview atomically | Status text always visible; ordered list semantics; no meaning depends on motion. |
| AI plan | LangGraph boundary rail, Radix tabs, Monaco, generated phases | Tab state is immediate; planner and verification use Sonner plus visible activity bar | Rail stacks above editor; editor wraps SQL; tabs support keyboard navigation. |
| Deployment phases | Five ordered cards | Hover lift; connectors communicate direction; no scroll pinning | Horizontal overflow preserves sequence on medium screens; cards remain text-complete. |
| Evidence report | Verdict, independent dimensions, download | Status cards update together after verification; button gives press feedback | One column on mobile; PASS/FAIL/NOT TESTED pair icon, text, and color. |
| Architecture | Code-native node map and AI branch | Single reveal only; no continuous animation | Becomes a vertical flow; labels describe every connection. |
| CTA/footer | Demo action, architecture link, project links | Ambient CSS grid, button feedback | Full-width actions on small screens; semantic footer and external-link relationship. |

Loading uses stable-height skeleton regions for React Flow and Monaco, a persistent `role="status"` activity bar for analysis work, and Sonner for supplemental feedback. Errors remain dismissible in a visible `role="alert"` region. Empty product data is represented by a complete demo preview instead of a collapsed section.

## 3. Animation and micro-interaction system

Animation ownership is exclusive:

- **GSAP/ScrollTrigger:** section reveal `translateY` and opacity. A property animated by GSAP has no competing CSS transition or Motion animation.
- **Motion:** button hover/tap, card hover, error/activity enter-exit, and application state changes.
- **CSS:** ambient orbs, grid atmosphere, tiny status pulses, spinner, and terminal staging. CSS does not control scroll state.
- **Lenis:** scroll transport only. It calls ScrollTrigger updates but never styles an element.
- **React Flow:** edge motion only within the graph.

The interaction language is functional: cyan means active analysis/data flow, violet means orchestration/AI, magenta adds brand energy, green means verified/pass, red means unsafe/fail, and amber means conditional/running. Hover effects stay within 2–5 px movement or roughly 1.01 scale. There is no custom cursor because it harms touch parity and adds work without product meaning.

## 4. Performance and memory rules

- Prefer Server Components for future static marketing copy; the current workflow remains a client boundary because authentication and the end-to-end analysis state are coupled on one page.
- Dynamically import GSAP, ScrollTrigger, Lenis, React Flow, and Monaco. Heavy visual libraries do not enter the initial static module graph.
- Animate transforms and opacity only. Avoid measuring layout in animation frames and avoid width/height animation.
- Use one `requestAnimationFrame` loop for Lenis, one ScrollTrigger update hook, scoped `gsap.context`, and complete cleanup on unmount.
- Respect `prefers-reduced-motion` in JavaScript and CSS. The reduced path retains all information and actions.
- Use CSS gradients and code-native diagrams instead of image/video payloads.
- Keep glow radii restrained and avoid large stacked backdrop filters. Only the navbar and status surface use backdrop blur.
- Monaco is read-only, minimap-free, folding-free, and constrained to a stable height. React Flow disables editing and limits zoom.
- Import Lucide icons individually through named ESM exports so the build can tree-shake them.
- Keep API results local to the page; a state-store dependency is not justified for the hackathon.

## 5. Visual design system

- **Canvas:** `#030305`; **surface:** `#0A0B11`; **raised surface:** `#0E1018`.
- **Primary signal:** cyan `#36F1FF`; **orchestration:** violet `#8B5CF6`; **brand energy:** magenta `#FF4FD8`.
- **Status:** green `#4DFFB8`, red `#FF617C`, amber `#FFC96B`.
- **Type:** system sans for fast display rendering and system monospace for evidence, SQL, states, and metadata.
- **Shape:** 10–20 px panel radii, one-pixel translucent borders, pill CTAs, small square evidence indicators.
- **Depth:** borders first, restrained colored glows second, shadow only on floating/navigation surfaces.
- **Spacing:** 8 px base rhythm; 90–145 px section separation on desktop, about 88 px on mobile.

## 6. Component architecture

```text
RootLayout
└─ Home / ClerkHome
   └─ RollbackReadyExperience
      ├─ Navbar + Radix Tooltip
      ├─ HeroConsole
      ├─ MigrationFlow (dynamic @xyflow/react)
      ├─ DemoCard + UploadCard
      ├─ RiskCards + LiveFindings
      ├─ FailureTimeline
      ├─ RecoveryRail + SqlPreview (dynamic Monaco + Radix Tabs)
      ├─ DeploymentPhaseTrack
      ├─ EvidenceReport
      ├─ ArchitectureMap
      ├─ CTA + Footer
      └─ Sonner Toaster
```

Reusable primitives are intentionally limited to `Button`, layout helpers, and status helpers. The graph and editor are separate client modules so they can become viewport-lazy without rewriting the workflow.

## 7. Exact hackathon implementation priorities

1. Preserve real demo, upload, analysis, plan, verification, and report actions.
2. Make the hero and built-in unsafe demo judge-ready without requiring an upload.
3. Show the four deterministic risk families and an understandable interruption timeline.
4. Make “AI proposes; deterministic systems decide” visually unavoidable.
5. Show the five-step safer release protocol and evidence report in under five minutes.
6. Verify 390 px mobile layout, keyboard navigation, reduced motion, error states, and production build.
7. Defer complex cursor effects, 3D, video, authenticated history, and additional dashboard routes.
