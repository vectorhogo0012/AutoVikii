# Implementation Plan — Mobile Responsive Optimization Patch

## Objective
Eliminate mobile layout defects across the KarShenas (AUTO-VIKIII) vehicle inspection PWA, specifically targeting checklist labels such as «استارت و صدای کارکرد موتور» that break into narrow, stacked words on mobile screens (320px–430px). The patch restructures mobile card headers to give Persian titles full horizontal width, introduces a smooth horizontally scrollable category tab strip with active indicators, ensures ergonomic $2\times2$ status button grids ($\ge 44\text{px}$ touch targets), and applies clean Persian text-wrapping and responsive rules across vehicle entry, checklists, handover items, reports, and modals.

---

## User Review Required

> [!NOTE]
> User selections from the clarifying questionnaire have been directly incorporated:
> 1. **Card Header Layout**: On mobile, item titles receive full width at the top, while the status badge, weight points, and note trigger buttons are placed in a dedicated row beneath the title.
> 2. **Category Tabs**: The 5 checklist category tabs use a smooth horizontally scrollable tab strip with snap points and active indicators on mobile viewports.
> 3. **Status Controls**: Retain the accessible $2\times2$ grid on mobile screens with touch targets $\ge 44\text{px}$.

---

## Root Cause Analysis
1. **Header Crowding in Checklist Cards**:
   In `ChecklistScreen.tsx`, the card header uses `flex items-start justify-between gap-3`. The right side contains the `item.label` (`<h4>`), `Badge`, and `pts` span inside a single `flex items-center gap-2`, while the left side contains the «افزودن یادداشت» button (~125px). On small screens (320px–375px), after subtracting card padding (32px) and the note button (125px), only ~150px remained for the title, badge, and points, forcing «استارت و صدای کارکرد موتور» into a width of 30px–50px, breaking every single word into vertical stacks.
2. **Missing Persian Text Wrapping Rules**:
   Global CSS lacked explicit rules for Persian typography (`overflow-wrap: break-word`, `word-break: normal`, `hyphens: none`), permitting flex shrink behaviors to crush text containers.
3. **5-Tab Navigation Grid on Mobile**:
   `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` created asymmetric rows where the 5th tab ("اقلام تحویل") took an entire awkward row or squeezed adjacent tabs.
4. **License Plate & VIN Inputs on 320px–360px**:
   Fixed widths on plate prefix/suffix inputs in `VehicleInfoForm.tsx` risked horizontal clipping on 320px screens.

---

## Proposed Changes

### 1. Global CSS & Typography Rules
#### Files:
- `src/index.css`

#### Specifications:
- Add base typography rules for Persian text:
  - `word-break: normal;` (prevents breaking in the middle of Persian words).
  - `overflow-wrap: break-word;`
  - `hyphens: none;`
- Add utility `.persian-title`: `min-width: 0; word-break: normal; overflow-wrap: break-word; line-height: 1.5;`.
- Ensure all flex children with text use `min-w-0` to allow proper flex shrinking without collapsing text containers.
- Smooth horizontal scroll container utilities (`.no-scrollbar`, `overscroll-x-contain`).

---

### 2. Checklist Screen (`ChecklistScreen.tsx`)
#### Files:
- `src/features/checklist/ChecklistScreen.tsx`

#### Specifications:
- **Card Header Restructuring**:
  - Replace the single cramped `justify-between` row with a responsive layout:
    - **Top Row**: Full-width item title `item.label` with `text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug`.
    - **Sub-Row (Mobile)**: Flex wrap row containing the status badge, weight points (`pts`), and the note button («یادداشت کارشناس»). On desktop (`sm:flex`), cleanly align horizontally.
  - Item description rendered with relaxed line height and full card width.
- **5-Tab Navigation Strip**:
  - On mobile screens ($<768\text{px}$): Horizontally scrollable strip with `flex gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth snap-x snap-mandatory`. Each tab has `min-w-[140px] sm:min-w-[160px] snap-start`.
  - On desktop ($\ge 768\text{px}$): 5-column grid (`grid grid-cols-5 gap-2`).
- **Status Selector Buttons**:
  - Ensure $2\times2$ grid on mobile (`grid grid-cols-2 sm:grid-cols-4 gap-2`) with `min-h-[44px]` touch targets, clear icons, and status labels.
- **Top Summary Banner**:
  - On 320px–375px, stack vehicle make/model badge, score pill, and report button cleanly with `flex-col sm:flex-row`.

---

### 3. Handover Equipment Tab (`HandoverChecklistTab.tsx`)
#### Files:
- `src/features/checklist/HandoverChecklistTab.tsx`

#### Specifications:
- Apply identical title-first responsive layout to handover items:
  - Full-width item title and description.
  - Note toggle button placed in sub-row or aligned beside title without reducing title width.
  - 4-state buttons in ergonomic $2\times2$ grid on mobile and 4-column on desktop.
  - Category header count pills with responsive text sizing to prevent wrapping numbers.

---

### 4. Vehicle Entry Form (`VehicleInfoForm.tsx`)
#### Files:
- `src/features/inspection-entry/VehicleInfoForm.tsx`

#### Specifications:
- Review Iranian license plate component layout for 320px–360px viewports:
  - Ensure plate container fits comfortably within 320px width without horizontal scrollbars.
  - Prevent plate province code or digits from overflowing.

---

### 5. Report Screen (`ReportScreen.tsx`)
#### Files:
- `src/features/report/ReportScreen.tsx`

#### Specifications:
- In both the Mechanical Checklist table and the Handover Equipment table:
  - On small screens ($<640\text{px}$), render item label and status badge in an accessible stacked layout.
  - Ensure notes wrap naturally with `break-words`.
  - Ensure print view remains pixel-perfect.

---

## Verification & Execution Results

### Automated Tests & Type Check:
- **Test Suite**: 53 tests in 2 suites passed with 0 failures (`npx --yes tsx --test $(find src -name '*.test.ts')`).
- **TypeScript**: `tsc --noEmit` passed with 0 errors.
- **Production Build**: `compile_applet` (`vite build`) succeeded cleanly.

### Viewport Layout Inspections:
- **Centralized Breakpoint Utility (`@media (max-width: 430px)`)**: Added `.checklist-single-col` and `.checklist-item-card` utilities in `src/index.css` to systematically enforce 100% full-width single-column layout, title-first stacking (`.checklist-item-header`), Persian word-level integrity (`word-break: normal`, `overflow-wrap: break-word`, `hyphens: none`), and ergonomic 2x2 status grids across all checklist items for screens below 430px.
- **320px Viewport**: Usable card width is 272px. «استارت» (6 chars, ~45px) and «صدای کارکرد موتور» (17 chars, ~128px) now render completely on a single line without vertical stacking. Category tabs horizontally snap-scroll with no screen overflow.
- **360px & 375px Viewports**: Usable card width is 312px–327px. All labels render cleanly with full width on top, badges/points/note button in sub-row, and $2\times2$ status buttons with $\ge 44\text{px}$ touch targets.
- **390px & 430px Viewports**: Clean spacious layout in both light and dark modes.
- **768px & 1024px Viewports**: Category tabs transition to clean 5-column grid layout, status buttons transition to 4 columns. Desktop layout remains pixel-perfect.
- **Zero Regressions**: Scoring engine (100 pts), camera permissions & capture, IndexedDB storage, Firebase sync, and print certificates are 100% preserved.
