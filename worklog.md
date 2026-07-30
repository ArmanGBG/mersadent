# Worklog

---
Task ID: 1
Agent: main
Task: Implement admin category UX improvements (parent context banner, drag-drop reorder, unified visibility toggle, horizontal mega-menu sub-category layout) and visibility cascade for products.

Work Log:
- Added `visible Boolean @default(true)` to `Category` and `Product` models in `prisma/schema.prisma` and ran `bun run db:push`.
- Updated public `GET /api/categories` to filter `visible: false` categories at all 3 levels and to count only visible products.
- Updated public `GET /api/products` to require `visible: true` on the product and on its direct category (so hiding a category hides its products on the storefront).
- Rewrote `POST/PUT /api/admin/categories` to:
  - Support a `visible` field.
  - Auto-assign `order` (next position at the level) on create, removing the manual numeric order requirement.
  - Cascade visibility to all descendants when toggling a category's `visible` flag.
  - Added `PATCH /api/admin/categories` for batch drag-and-drop reorder (`{ items: [{id, order, parentId}] }`).
- Updated `POST/PUT /api/admin/products` to accept a `visible` field.
- Rewrote `src/components/admin/AdminCategories.tsx`:
  - Added a colored context banner inside the create/edit dialog showing the parent chain (e.g. "در حال افزودن زیردسته به: اندودانتیکس") or "دسته‌بندی اصلی" when adding a root.
  - Removed the numeric "ترتیب نمایش" input field.
  - Implemented drag-and-drop reordering with `@dnd-kit/core` + `@dnd-kit/sortable` (per-level `DndContext`), plus up/down arrow buttons for accessibility.
  - Added a "نمایش" switch column; toggling it calls PUT with `visible` and the backend cascades to descendants. Hidden rows show a "پنهان" badge and a line-through name.
  - Added expand-all / collapse-all buttons.
- Updated `src/components/admin/AdminProducts.tsx`:
  - Added `visible` to the `AdminProduct` and `ProductForm` interfaces and `emptyProduct`.
  - Added a `toggleVisible` action and a "نمایش" switch column in the products table.
  - Added a "نمایش در سایت" switch in the create/edit form.
  - Hidden products render with a muted style and "پنهان" label.
- Redesigned the header mega-menu (`src/app/page.tsx`):
  - Widened the dropdown to `min 720px / max 860px`.
  - Each level-2 sub-category is now its own row; level-3 grandchildren are laid out horizontally (`flex-wrap`) next to the sub-category title instead of being indented vertically. This removes the forced vertical scroll so all sub-categories are visible at a glance.

Stage Summary:
- Schema now has `visible` on Category & Product; DB pushed successfully.
- Storefront hides invisible categories/products; admin still sees everything.
- Admin category manager supports drag-and-drop reorder (no more numeric order field), shows parent context when adding, and has a single unified visibility toggle that cascades.
- Admin product manager has a visibility toggle (column + form).
- Header mega-menu uses horizontal rows per sub-category.

---
Task ID: 1 (verification)
Agent: main
Task: End-to-end verification of all implemented features via browser and API.

Work Log:
- Restarted dev server with `setsid node next dev -H 0.0.0.0 -p 3000` after Prisma client regeneration (needed for the new `visible` column).
- Browser-verified the storefront mega-menu: hovered "دسته‌بندی‌ها" then "اندودانتیکس"; confirmed the new layout shows each sub-category as a row with grandchildren laid out horizontally (wrapping) next to it. VLM analysis of the screenshot confirmed: "items are arranged as horizontal rows... effectively avoiding excessive vertical scrolling".
- Browser-verified the admin categories page: logged in as admin/admin, navigated to "دسته‌بندی‌ها", confirmed all 10 main categories + 3-level hierarchy render with the new columns (نام، اسلاگ، محصولات، زیردسته، نمایش، عملیات) and the expand-all / collapse-all buttons.
- Verified the create dialog: clicking "دسته‌بندی جدید" shows a green banner "در حال افزودن دسته‌بندی اصلی"; clicking "+" on a category shows an amber banner "در حال افزودن زیردسته به: اندودانتیکس". The numeric "ترتیب نمایش" field is gone; a single "نمایش در سایت" switch with cascade description is present.
- API-verified category visibility cascade: hid "رادیولوژی" via PUT {visible:false}; storefront categories dropped 10→9 (رادیولوژی gone); admin flat list still shows it with visible=false; restoring brought it back to 10.
- API-verified product visibility: hid product "ست رابردم کامل" via PUT {visible:false}; storefront products dropped 33→32 and the product was absent; restoring brought it back to 33.
- API-verified drag-drop reorder (PATCH /api/admin/categories): swapped the first two root categories' order values; confirmed the order changed correctly and was restorable.

Stage Summary:
- All 4 user requests verified working:
  1. Parent-context banner in the create dialog (amber for sub, green for root).
  2. Drag-and-drop reorder via @dnd-kit + PATCH endpoint; numeric order field removed.
  3. Unified visibility toggle that cascades to descendants for categories and works per-product; hidden items disappear from the storefront but remain in the DB and are still visible to the admin.
  4. Header mega-menu redesigned so each sub-category is a row with grandchildren laid out horizontally, eliminating forced vertical scrolling.

---
Task ID: 2
Agent: main
Task: Add a feature to AdminCategories toolbar: a dropdown that, when a main category is selected, expands ONLY that main category's full sub-tree (instead of "Expand All" which opens every category). Keep existing edit mode and existing "Expand All" / "Collapse All" buttons intact.

Work Log:
- Read previous worklog (Task ID 1) — confirmed the admin category manager already had expand-all / collapse-all buttons, drag-drop reorder, unified visibility toggle, and parent-context banner.
- Added `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'` and `ListTree` icon to AdminCategories.tsx.
- Added a new `expandSubtree(rootId)` function that recursively collects all descendant IDs of a chosen root category and sets `expanded` to exactly that set (so everything else collapses first, then only that subtree opens).
- Added a shadcn `Select` dropdown to the toolbar (between "بستن همه" and the reordering spinner) with placeholder "باز کردن فقط یک دسته...". It lists all 10 root categories; selecting one calls `expandSubtree(Number(value))`. The select's value is kept empty so it always shows the placeholder after each pick (acts as an action trigger, not a persistent state).
- Verified dev server compiled with no errors after the edit.
- Browser-verified via Agent Browser + VLM:
  - Logged in as admin/admin, navigated to "دسته‌بندی‌ها".
  - Opened the new dropdown — confirmed all 10 main categories listed.
  - Selected "اندودانتیکس" (Endodontics) — VLM analysis of screenshot confirmed ONLY Endodontics's subtree is expanded (2 levels: sub-cats like اندوموتور/فایل‌ها/مواد, and sub-sub-cats like آپکس فایندر/فایل‌های روتری/سیلر MTA). All other 9 main categories remain collapsed.
  - Clicked "باز کردن همه" — VLM confirmed ALL main categories expanded (existing behavior preserved).

Stage Summary:
- New capability added without touching the existing edit mode the user liked.
- Toolbar now has three expansion controls: "باز کردن همه" (all), "بستن همه" (none), and the new dropdown "باز کردن فقط یک دسته..." (single main category's subtree).
- Selecting a main category from the dropdown collapses everything else first, then expands only the chosen root's full 3-level sub-tree.
- Verified working end-to-end in the browser; no console/runtime errors.

---
Task ID: 3
Agent: main
Task: Fix the Brands admin section — the brand edit/create dialog lacked a working image upload feature. Add the ability to attach a logo image to a brand (including when creating a NEW brand, not only when editing).

Work Log:
- Diagnosed root cause: the `/api/admin/brands/upload` endpoint did NOT exist at all (only `route.ts` was present in the brands API folder). The AdminBrands.tsx component already had upload logic but only gated it behind `{editing && ...}` (i.e. only when editing an existing brand), and called a non-existent endpoint. Additionally the POST create route ignored the `logo` field.
- Created `src/app/api/admin/brands/upload/route.ts`:
  - POST handler that verifies the admin token via the `Authorization: Bearer` header.
  - Reads FormData (`file` + optional `brandId`), validates mime type (PNG/JPG/WebP/SVG/GIF) and size (≤2MB).
  - Saves to `public/uploads/brands/brand-<id-or-temp>-<timestamp>.<ext>`. Non-SVG images are optimized with sharp (resize to max 400×400 inside, convert to webp @85 quality). SVGs are saved as-is.
  - When `brandId` is provided (edit mode), persists the logo URL to the DB and deletes the previous logo file if it was one of ours.
  - Returns `{ url }`.
- Updated `POST /api/admin/brands` to accept and persist the `logo` field on create (previously only `name/slug/visible` were destructured, so logo was silently dropped).
- Rewrote `src/components/admin/AdminBrands.tsx`:
  - Added `logo` to form state (`emptyForm` now `{ name, slug, logo }`).
  - Removed the `{editing && ...}` gate so the logo upload section appears in BOTH create and edit modes.
  - `handleLogoUpload` now uploads without requiring a brandId (for create mode the server returns a URL kept locally in `form.logo`; for edit mode the brandId is sent so the server persists immediately). Removed the "ابتدا برند را ذخیره کنید" restriction.
  - `removeLogo` now clears `form.logo` locally for create mode AND PUTs `logo:null` server-side for edit mode.
  - `handleSave` now always sends `logo: form.logo || null` in both POST and PUT bodies.
  - The preview now reads from `form.logo` (single source of truth). Button label switches between "آپلود لوگو" / "تغییر لوگو". Shows a helper note in create mode: "لوگو بارگذاری شد و هنگام ذخیره برند ثبت می‌شود."
  - `uploading` state simplified from `string | null` to a plain boolean.
- Cleared stale Turbopack cache (`.next`) and restarted the dev server after edits.
- Removed an unused `eslint-disable` directive to keep lint clean (the only remaining lint error is pre-existing in the `mersadent-clone` example folder, unrelated).

Verification (browser + API):
- API-direct: POST `/api/admin/brands/upload` with a test PNG returned `{url:"/uploads/brands/brand-temp-<ts>.webp"}` and created the file (10 files in the uploads dir, up from 9).
- API-direct: POST `/api/admin/brands` with a logo URL now persists `logo` correctly (was null before the route fix).
- Browser: logged in as admin/admin → Brands → "برند جدید". VLM confirmed the create dialog now shows a logo upload area ("آپلود لوگو" button + placeholder icon) at the top — previously this was hidden in create mode.
- Browser: uploaded a generated test logo via the hidden file input → toast "لوگو آپلود شد", button became "تغییر لوگو", "حذف لوگو" appeared, and the preview showed the actual blue tooth logo (VLM-confirmed).
- Browser: filled name "BroaderDent" + clicked "ایجاد" → toast "ایجاد شد", brand appeared in the table. Scrolled to the row: VLM confirmed the logo column shows the actual colored blue tooth logo (not a gray placeholder).
- Browser: opened edit dialog on the created brand → VLM confirmed title "ویرایش برند", the existing logo preview is shown, and both "تغییر لوگو" / "حذف لوگو" buttons are present.
- Cleaned up the two test brands and temp logo files afterwards.

Stage Summary:
- Brand logo upload now works end-to-end in BOTH create and edit modes (previously it was missing entirely in create mode and the upload endpoint didn't even exist).
- New endpoint: `POST /api/admin/brands/upload` (FormData: file + optional brandId) → saves optimized webp/svg to `public/uploads/brands/`, optionally persists to DB.
- `POST /api/admin/brands` now accepts `logo`; `PUT` already accepted it.
- AdminBrands component uses `form.logo` as single source of truth for the preview; upload works without needing the brand to exist first.
- Note: the seed-created brands (3M ESPE, AOA, etc.) have `logo: null` in the DB even though seed logo files exist in `public/uploads/brands/` — this is a pre-existing seed-linking issue, not introduced by this change. Admins can now attach logos to any brand via the UI.

---
Task ID: 4
Agent: main
Task: Fix category product counts — parent/mid-level categories were showing 0 in the admin panel even though their sub-categories contained products. Each parent category should show the SUM of all products in its entire descendant sub-tree.

Work Log:
- Diagnosed: the public `/api/categories` route already aggregated counts recursively (parent productCount = own + sum of children), so the storefront was correct. But the ADMIN route `/api/admin/categories` only included Prisma's `_count: { select: { products: true } }` which is the DIRECT product count only — so parents with no products directly attached showed 0.
- Confirmed via API: admin tree returned `_count.products=0` for ALL 10 parent categories and all level-2 sub-categories; only level-3 leaf categories had non-zero counts. Public API correctly showed ترمیمی=4, هندپیس‌ها=4, اندودانتیکس=6, etc.
- The `AdminCategories.tsx` component rendered `c._count?.products || 0` in the products column, so it displayed 0 for every parent.

Fix — `src/app/api/admin/categories/route.ts` GET handler:
- Tree mode: after fetching the 3-level nested tree, annotate each node with `totalProducts` = own direct products + sum of descendants' totalProducts (computed bottom-up: grandchildren get their direct count; children get own + grandchildren's; parents get own + children's).
- Flat mode (`?flat=true`): fetch ALL categories flat, build a `parentId -> [childIds]` map, then use a memoized recursive `computeTotal(id)` that sums the category's own products + all descendants' products. Annotate each flat category with `totalProducts`.

Fix — `src/components/admin/AdminCategories.tsx`:
- Added `totalProducts?: number` to both `CategoryNode` and `FlatCat` interfaces.
- Changed the products column cell from `{c._count?.products || 0}` to `{c.totalProducts ?? c._count?.products ?? 0}` (fallback for safety).

Verification:
- API: admin tree now returns totalProducts=4/4/6/5/4/1/1/2/2/4 for the 10 parents (was 0). Level-2 sub-categories also aggregate correctly (e.g. اندودانتیکس → دستگاه=2, ابزار=1, مواد=2, رابردم=1, summing to 6 = parent total).
- Browser: logged in as admin/admin → دسته‌بندی‌ها. DOM extraction confirmed all parent rows now show non-zero aggregated counts in the محصولات column: ترمیمی و زیبایی=4, هندپیس‌ها=4, اندودانتیکس=6, تجهیزات دندانپزشکی بزرگ=5, جراحی=4, رادیولوژی=1, پریودنتیکس=1, پروتز=2, اطفال و ارتودنسی=2, مواد و تجهیزات عمومی=4.
- Expanded Endodontics via the single-subtree dropdown: verified the level-2 sub-categories (دستگاه=2, ابزار=1, مواد=2, رابردم=1) sum to exactly 6 = parent total. Level-3 leaves show their direct counts.
- No compilation/lint errors.

Stage Summary:
- Admin categories page now shows the AGGREGATED product count (this category + all descendants) for every category at every level, instead of only the direct product count.
- Both tree mode (used by AdminCategories page) and flat mode (used by AdminProducts category dropdown) return the aggregated `totalProducts` field.
- Public storefront was already correct (no change needed there).

---
Task ID: 5
Agent: main
Task: Remove the "Tags" (تگ‌ها) section AND the "Specs JSON" (مشخصات JSON) textarea from the admin product create/edit form. User found both confusing and unnecessary.

Work Log:
- Read previous worklog (Tasks 1-4) for context.
- Clarified with user which "tags" they meant (the تگ‌ها badges + "+ افزودن تگ" dropdown in the product form, NOT the SEO keywords field). User also requested removing the "مشخصات (JSON)" textarea.
- Identified an important caveat: the `specs` DB column IS still used by the storefront product detail page ("مشخصات فنی" section) and the compare feature. Decision: remove the admin UI + form state + API payload, but KEEP the DB column and storefront rendering so existing product specs are not destroyed. The super-prompt parser does not touch specs, so no impact there.
- Edited `src/components/admin/AdminProducts.tsx`:
  - Removed `tags` field from `AdminProduct` interface.
  - Removed `SimpleTag` interface entirely.
  - Removed `specs: string` and `tagIds: number[]` from `ProductForm` interface.
  - Removed `specs: ''` and `tagIds: []` from `emptyProduct`.
  - Removed `allTags` state and its setter.
  - Simplified `loadLookups` to only fetch categories + brands (dropped the `fetch('/api/tags')` and `tagsData` handling).
  - Removed `specs: p.specs || ''` and `tagIds: (p.tags || []).map(...)` from `openEdit`.
  - Removed `specs: form.specs || null` and `tagIds: form.tagIds` from the `handleSave` request body.
  - Deleted the entire "Tags Section" UI block (separator + تگ‌ها heading + selected-tag badges box + the "+ افزودن تگ" Select dropdown grouped by type).
  - Deleted the entire "مشخصات (JSON)" Textarea block.
- Edited `src/app/api/admin/products/route.ts`:
  - GET: removed `tags: { include: { tag: ... } }` from the product query include.
  - POST: removed `specs` and `tagIds` from the destructured body; removed `specs: specs || null` from the `data` object; removed the `tags: { create: ... }` block; removed `tags` from the response `include`.
  - PUT: removed `specs` and `tagIds` from destructuring; removed `specs: specs ?? null` from `updateData` (so existing specs are preserved on update, not wiped to null); removed the `if (tagIds !== undefined) { deleteMany + create }` block; removed `tags` from the response `include`.
- Edited `src/app/api/admin/products/[id]/route.ts` PUT: removed `specs` from destructuring and `specs: specs ?? null` from `updateData` (same preserve-on-update protection).
- Lint: clean (only the pre-existing error in `mersadent-clone/examples/websocket/frontend.tsx`, unrelated to this task).
- Browser verification via Agent Browser + VLM:
  - Logged in as admin/admin → Products → "افزودن محصول". VLM analysis of the dialog screenshot confirmed: (1) NO "تگ‌ها" section, (2) NO "مشخصات (JSON)" textarea. The dialog now flows: product info → low-stock → super-prompt → strengths/weaknesses → description → SEO settings.
  - Opened the edit dialog on an existing product ("ست رابردم کامل", which had tags in the DB). Confirmed: title "ویرایش محصول", no Tags section, no Specs JSON section, and NO runtime/console errors. Editing existing products that still carry `tags`/`specs` in the DB works without breaking.
  - Dev server logs show clean compilation and all admin product API calls returning 200.

Stage Summary:
- Both the "تگ‌ها" (Tags) section and the "مشخصات (JSON)" textarea have been completely removed from the admin product create/edit form, as requested.
- The DB tables `Tag` / `ProductTag` and the `specs` column on `Product` were intentionally KEPT (removing them would require a DB reset and would destroy the storefront's "مشخصات فنی" display for existing products). They are now simply unused by the admin UI.
- The `/api/tags` endpoint still exists but is no longer called by anything in the admin UI. If the user later wants to fully purge tags from the DB + remove the `/api/tags` route + drop the schema models, that's a follow-up task requiring `bun run db:push` (which resets SQLite data).
- Existing products' specs still render on the storefront product detail page and compare view, unchanged.

---
Task ID: 6
Agent: main
Task: Add a mobile-only fixed bottom tab bar (hamburger-style footer menu) — Option A from the two interpretations discussed with the user. 5 tabs: Home, Categories, Search, Cart, Account. Only visible on mobile (`md:hidden`), fixed at the bottom, with active-state highlighting and a cart badge.

Work Log:
- Read previous worklog (Tasks 1-5) for context.
- Examined the existing app structure: `PageView` union type, `MersadentApp` component (which holds `currentView`, `cartCount`, `user`, `navigate`, `handleSearch`, `setCartSidebarOpen`, `setAuthModalOpen`), the existing mobile hamburger `Sheet` in `Header`, and the existing `Footer`.
- Added `LayoutGrid` to the lucide-react imports.
- Created a new `MobileBottomNav` component (in `src/app/page.tsx`, just before the `Footer` function) with these features:
  - 5 tabs in a fixed bottom `<nav>` (`md:hidden`, `fixed bottom-0 left-0 right-0 z-40`, white bg, top border, subtle shadow, safe-area-inset-bottom padding for iOS notch devices):
    - **خانه** (Home icon) → `onNavigate({type:'home'})` + scroll to top
    - **دسته‌بندی‌ها** (LayoutGrid icon) → `onNavigate({type:'category', categoryId:0, slug:'all'})` (the existing "all categories" view)
    - **جستجو** (Search icon) → opens a bottom `Sheet` (side="bottom") with a focused search input + submit button
    - **سبد خرید** (ShoppingCart icon) → opens the existing `CartSidebar` (via `onOpenCart`); shows a red badge with the cart count in Persian numerals when `cartCount > 0`
    - **ورود / حساب من** (User icon) → if logged in: `onNavigate({type:'user'})`; if not: opens the `AuthModal` (via `onAuthRequired`)
  - Active-state highlighting: the active tab is colored `text-mersadent-accent` (teal) and has a small teal indicator bar at the top; inactive tabs are gray. Active tab determined by `currentView.type` (home→home, category→categories, search→search, cart/checkout→cart, user/order-detail→user, default→home).
  - Each tab is a flex-column button with the icon on top and a tiny label below (`text-[10px]`).
  - Search bottom sheet uses an uncontrolled `<Input defaultValue="">` with `useRef`, and `submitSearch` reads the value directly from `searchInputRef.current?.value` (robust; avoids stale-state and React-controlled-input test limitations).
  - Autofocus on the search input when the sheet opens (via a `useEffect` with a 100ms timeout, since Radix Sheet mounts content asynchronously).
- Integrated into `MersadentApp`'s render: added a `<div className="md:hidden h-16" aria-hidden="true" />` spacer right before `<MobileBottomNav>` so the fixed bar doesn't cover the footer's last row when scrolled to the bottom. Passed props: `currentView`, `user`, `cartCount`, `onNavigate={navigate}`, `onSearch={handleSearch}`, `onOpenCart`, `onAuthRequired`.
- **Critical bug found & fixed during browser testing**: the search submit initially called `onNavigate({type:'search', query})` directly, but `SearchResultsPage` reads its query from a separate `searchQuery` state (set by `handleSearch`, not by `navigate`). So the search ran with an empty/stale query. Fixed by adding an `onSearch` prop to `MobileBottomNav` and calling `onSearch(raw)` (which is `handleSearch`) instead of `onNavigate`. Verified: search for "کامپوزیت" now correctly shows "نتایج جستجو برای: کامپوزیت".
- Lint: clean (only the pre-existing error in `mersadent-clone/examples/websocket/frontend.tsx`, unrelated).
- Dev server: clean compile, no runtime errors.

Verification (browser + VLM, mobile viewport 390×844 iPhone 14 Pro):
- Bottom nav renders with exactly 5 tabs labeled (RTL): خانه، دسته‌بندی‌ها، جستجو، سبد خرید، ورود. VLM-confirmed.
- Home tab is active (teal) on the home page; clicking Categories makes Categories active; clicking Search submits and makes Search active.
- Clicking the Search tab opens a bottom sheet with an autofocused input + search button; submitting "کامپوزیت" navigates to "نتایج جستجو برای: کامپوزیت".
- Clicking the Cart tab opens the CartSidebar.
- Clicking the User tab (when logged out) opens the AuthModal.
- Scrolled to the very bottom of the home page: the "پنل مدیریت" button (footer's last element) is fully visible (bounding rect inside viewport), confirming the `h-16` spacer prevents the fixed bar from covering footer content.
- Switched viewport to 1280×800 (desktop): both the bottom nav and the spacer have `display: none` (correctly hidden on desktop via `md:hidden`).

Stage Summary:
- A mobile-only fixed bottom tab bar (Option A) is now live, giving users 1-tap access to Home / Categories / Search / Cart / Account from anywhere in the storefront.
- The bar is hidden on desktop; the spacer ensures footer content is never covered on mobile.
- Active tab is highlighted based on the current view; cart badge shows count when non-zero.
- Search uses a dedicated bottom sheet with autofocus; the critical `onSearch` vs `onNavigate` bug was caught and fixed during testing.
- Verified end-to-end in the browser (mobile + desktop viewports) with VLM screenshot analysis.

---
Task ID: 7
Agent: main
Task: Fix the "محصولات ویژه" (Featured Products) panel which was rendering unlimited/all featured products and breaking the page dimensions, then audit the responsiveness of the entire site.

Work Log:
- Diagnosed the featured panel bug via Agent Browser + DOM inspection on a 390px mobile viewport:
  - `document.documentElement.scrollWidth` was 1280px (viewport only 390px) → the whole page had horizontal overflow.
  - The featured `<section className="max-w-7xl mx-auto px-4 sm:px-6">` was being forced to 1280px wide even though its parent was 390px.
  - Root cause: the HomePage root was `<div className="flex flex-col gap-8 pb-8">`. The section was a FLEX ITEM of that flex-column. Flex items default to `min-width: auto` (= min-content size). The section's min-content was the sum of the non-shrinkable carousel cards (14 × 192px = 2688px), capped by `max-w-7xl` (1280px). Additionally, `mx-auto` on a flex item disables `align-items: stretch`, so the section didn't fill the parent width — it stayed at its content size (1280px) and overflowed.
- Fix 1 (home page root): changed `<div className="flex flex-col gap-8 pb-8">` → `<div className="space-y-8 pb-8">`. Block layout (with `space-y-8` for vertical spacing) makes the sections normal block elements where `width: auto` = fill parent, and `mx-auto` centers properly. `max-w-7xl` caps width. No flex-item min-width quirk.
- Fix 2 (defensive safety net): added `min-w-0 overflow-x-clip` to the global `<main className="flex-1 py-6 sm:py-8">` wrapper. `min-w-0` lets the flex item shrink to viewport width; `overflow-x-clip` clips any residual horizontal overflow from ANY page view without creating a vertical scroll container (unlike `overflow-x-hidden` which would force `overflow-y: auto`). This prevents the whole page from ever scrolling horizontally regardless of what page views render.
- Verified the featured panel fix on mobile (390px): `docScrollW` dropped from 1280 → 390 (no overflow), section width 390px, scroll container scrolls internally (scrollWidth 2876px, clientWidth 390px). VLM confirmed cards display ~2 at a time with horizontal swipe.
- Verified on desktop (1280px): section 1280px (max-w-7xl centered), scroll container 1232px with 3292px scrollable content, carousel works with hover arrows. No page overflow.

Responsiveness audit (Agent Browser + VLM, mobile 390px / tablet 768px / desktop 1280px):
- Home page: no horizontal overflow at any viewport. Hero, categories grid, featured carousel, brands marquee, blog cards all render correctly.
- Category listing page (همه دسته‌بندی‌ها): no overflow; sub-category chips wrap properly.
- Sub-category page (کامپوزیت): no overflow; product grid collapses to 2 columns on mobile.
- Product detail page: no overflow; image + info stack vertically on mobile, side-by-side on desktop. "مشخصات فنی" and "توضیحات محصول" sections render fine.
- Search results page (نتایج جستجو برای "کامپوزیت"): no overflow; results grid responsive.
- Compare view (2 products): no overflow; the `min-w-[760px]` comparison grid is wrapped in `overflow-x-auto` so it scrolls horizontally within the viewport on mobile. VLM confirmed sticky label column + scrollable product columns pattern works.
- Brands page (همه برندها): no overflow; brand grid responsive.
- Blog page (مقالات آموزشی): no overflow.
- About page (درباره مرصادنت): no overflow.
- Admin dashboard: no overflow; sidebar collapses to hamburger menu on mobile; stat cards stack vertically; activity table renders as clean list.
- Admin products: no overflow; table converts to card/list layout on mobile; action buttons accessible.
- Admin categories: no overflow (page-level); the flex-row category items use `min-w-[60px]` columns which are cramped on mobile but fit within 390px (slug column is `hidden md:block`). Functional, not broken.
- Admin orders: no overflow; filter chips wrap; empty state centered.
- Mobile sticky footer + bottom nav: verified at scroll-to-bottom — footer content (including "پنل مدیریت" button) is fully visible and NOT hidden behind the fixed bottom nav bar; the `h-16` spacer works correctly.
- Lint: clean (only the pre-existing unrelated error in mersadent-clone/examples/websocket/frontend.tsx).

Stage Summary:
- The featured products panel bug is FIXED: the carousel now scrolls horizontally within the viewport on mobile instead of pushing the page to 1280px wide. Root cause was the home page root using `flex flex-col` whose flex-item children with `mx-auto` didn't stretch to parent width.
- A defensive `min-w-0 overflow-x-clip` was added to the global `<main>` to prevent any future horizontal page overflow from any page view.
- Full site responsiveness audited across 12+ pages at 3 viewports. No horizontal overflow found anywhere. All carousels scroll internally, all grids collapse on mobile, all tables either convert to cards or scroll within containers, admin sidebar collapses to hamburger, mobile bottom nav + sticky footer work correctly.
- No other responsive bugs required fixing — the site was already well-structured; the featured panel was the one breakage point.

---
Task ID: 8
Agent: main
Task: Two features: (1) Allow admin to upload their own logo/image for each product category. (2) In the admin hero settings panel, replace the image-URL input with a direct image upload, and add an optional purchase/navigation link per hero slide.

Work Log:
- Read previous worklog (Tasks 1-7) for context.

**Feature 1: Category image upload**
- Added `image String?` column to `Category` model in `prisma/schema.prisma` (nullable, non-destructive). Ran `bun run db:push` — data preserved.
- Created `src/app/api/admin/categories/upload/route.ts`:
  - POST handler (FormData: `file` + optional `categoryId`), validates mime (PNG/JPG/WebP/SVG/GIF) and size (≤2MB).
  - Saves to `public/uploads/categories/cat-<id>-<ts>.webp` (SVG saved as-is; others optimized with sharp to max 600×600, webp @85 quality).
  - When `categoryId` is provided (edit mode), persists the image URL to the DB and deletes the previous image file if it was one of ours.
  - Returns `{ url }`.
- Updated `src/app/api/admin/categories/route.ts`:
  - POST: now accepts and persists `image` field on create.
  - PUT: now accepts `image` (string URL or null to clear) and persists it.
  - GET (both tree and flat modes): already returns all scalar columns via Prisma's default include, so `image` is automatically included.
  - Public `/api/categories` also returns `image` automatically (uses `db.category.findMany` + spreads `...parent`/`...child`).
- Updated `src/components/admin/AdminCategories.tsx`:
  - Added `image?: string | null` to both `CategoryNode` and `FlatCat` interfaces; added `image: ''` to `emptyForm`.
  - Added `uploading` state + `fileInputRef`.
  - Added `handleImageUpload(file)` — POSTs FormData to `/api/admin/categories/upload` (with `categoryId` when editing so it persists immediately; without it in create mode so the URL is kept locally in `form.image` and saved on "ایجاد"). Returns the URL into `form.image`.
  - Added `removeImage()` — for edit mode, PUTs `image: null` to clear the DB; clears `form.image` locally.
  - Added image upload UI section at the top of the create/edit dialog: an 80×80 dashed-border preview box showing the uploaded image (with a red X remove button) or a placeholder folder icon, plus an "آپلود تصویر" / "تغییر تصویر" button that triggers a hidden file input. Helper text explains allowed formats and that in create mode the image saves on category save.
  - `handleSave` now sends `image: form.image || null` in both POST and PUT bodies.
  - `openEdit` now loads `c.image` into form state.
  - Added a 24×24 thumbnail next to the category name in the table row (falls back to the folder icon when no image).
- Updated `src/app/page.tsx` storefront:
  - Added `image?: string | null` to `Category` and `CategoryChild` interfaces.
  - Home page category grid: if `cat.image` exists, renders `<img>` (object-contain, w-7 h-7 sm:w-8 sm:h-8) inside the tile instead of the generic `getCategoryIcon(cat.slug)`.
  - "همه دسته‌بندی‌ها" listing page: same logic — shows uploaded image if present, else the generic icon.

**Feature 2: Hero slide image upload + optional link**
- Created `src/app/api/admin/hero/upload/route.ts`:
  - POST handler (FormData: `file` + optional `slide` number), validates mime and size (≤4MB for hero banners).
  - Saves to `public/uploads/hero/hero-slide-<n>-<ts>.webp` (SVG as-is; others optimized with sharp to max 1920×1080, webp @82 quality).
  - Returns `{ url }`. Does NOT persist to DB directly — the admin UI stores the returned URL in local settings state, then the "ذخیره تنظیمات" button saves all settings (including the image URLs) via `PUT /api/admin/settings`.
- Created `src/app/api/hero/route.ts` (PUBLIC endpoint):
  - GET returns `{ slides: [...] }` built from `SiteSetting` rows `hero_slide_N_title/_subtitle/_image/_link`, falling back to defaults.
  - Filters out slides with empty title or image (so admins can reduce slide count by clearing fields).
- Added `hero_slide_N_link` keys to `DEFAULT_SETTINGS` in `src/app/api/admin/settings/route.ts` (empty string default for all 4 slides).
- Refactored `src/components/admin/AdminSettings.tsx` hero section:
  - Added `ImagePlus, X` icons, `useRef`, `uploadingSlide` state, `fileInputRefs` map, and `handleHeroUpload(slideNum, file)` function.
  - Replaced the old "لینک تصویر" text input with an image upload widget per slide: a 128×64 preview box (showing the uploaded image with an X remove button, or a placeholder icon), plus an "آپلود تصویر" / "تغییر تصویر" button that triggers a hidden file input. Helper text says "تصویر با ابعاد افقی (مثلاً ۱۹۲۰×۱۰۸۰). حداکثر ۴ مگابایت."
  - Added a "لینک خرید (اختیاری)" text input per slide with placeholder "مثلاً /category/all یا https://example.com/product" and helper text explaining that the CTA button uses this link, and empty = default "all categories" behavior.
- Refactored `src/app/page.tsx` HeroSlider:
  - Replaced the hardcoded `heroSlides` constant with a `HeroSlide` interface + `DEFAULT_HERO_SLIDES` (used as initial state before the API responds).
  - Added `useEffect` to fetch `/api/hero` on mount and replace `heroSlides` state with the admin-configured slides.
  - Added `resolveHeroLink(link, onNavigate)` helper that parses the link: empty → default "all categories" navigation; `http(s)://...` → opens in new tab; `/category/all`, `/category/<id>`, `/category/<slug>` → in-app category navigation; `/brand`, `/about`, `/blog`, `/search?q=...` → respective in-app navigations; other paths → open in new tab.
  - The CTA button "مشاهده تجهیزات" now calls `resolveHeroLink(slide.link, onNavigate)` instead of always going to "all categories".
  - Arrow buttons and dot indicators are hidden when there's only 1 slide (prevents pointless controls if admin reduces to a single slide).
  - Auto-play only starts after slides are loaded and when there are >1 slides.

Verification (Agent Browser + API + DOM inspection):
- API: POST `/api/admin/categories/upload` with a test PNG + `categoryId=34` returned `{url:"/uploads/categories/cat-34-<ts>.webp"}` and persisted to DB. Public `/api/categories` then returned `image: "/uploads/categories/cat-34-<ts>.webp"` for ترمیمی و زیبایی.
- API: POST `/api/admin/hero/upload` with a test PNG + `slide=1` returned `{url:"/uploads/hero/hero-slide-1-<ts>.webp"}`.
- API: PUT `/api/admin/settings` with `hero_slide_2_link:"/category/all"` + `hero_slide_2_title:"تست تجهیزات دیجیتال"` persisted. Public `/api/hero` then returned slide 2 with the test title and link.
- Storefront DOM: home page hero shows 4 slides (4 dot indicators + 4 hero images). Clicking dot 2 changed the title to "تست تجهیزات دیجیتال". Clicking the CTA button navigated to "همه دسته‌بندی‌ها" (confirming the link routing works).
- Storefront DOM: category grid renders `<img>` for categories that have an image, falling back to the generic icon otherwise. No layout breakage.
- Admin DOM: edit category dialog for ترمیمی و زیبایی shows the "تصویر / لوگو دسته‌بندی" label, a preview of the uploaded image (`cat-34-...webp`), and a "تغییر تصویر" button. All other fields (نام، اسلاگ، دسته والد، نمایش در سایت) present.
- Admin DOM: settings page hero card has 4 slide sections, each with labels "تصویر اسلاید | عنوان | زیرعنوان | لینک خرید (اختیاری)", 4 upload buttons, 4 link inputs, 4 hidden file inputs.
- Lint: clean (only the pre-existing unrelated error in mersadent-clone/examples/websocket/frontend.tsx).
- Cleaned up all test data (restored hero slide 2 defaults, cleared category images for cat 34 and cat 1).

Stage Summary:
- Admins can now upload a custom image/logo for ANY product category (main, sub, or sub-sub) via the create/edit dialog. The image appears in the storefront home category grid and the "all categories" listing page, replacing the generic folder icon. Upload works in both create and edit modes.
- Admins can now upload hero slide images directly (no more pasting image URLs) and optionally set a purchase/navigation link per slide. The link can be an internal path (`/category/all`, `/category/3`, `/about`, `/blog`, `/search?q=...`) or an external URL (`https://...`). The storefront hero CTA button respects the link; empty link falls back to the default "all categories" behavior.
- Two new API endpoints: `POST /api/admin/categories/upload` and `POST /api/admin/hero/upload` (both admin-auth, sharp-optimized, with file cleanup).
- One new public endpoint: `GET /api/hero` (returns admin-configured slides with title/subtitle/image/link).
- The HeroSlider is now fully dynamic — it fetches slides from the API on mount and renders whatever the admin configured. Arrow/dot controls auto-hide when there's only one slide.

---
Task ID: 2
Agent: main
Task: Two admin UX improvements requested by user — (1) make uploaded image previews larger instead of tiny centered squares; (2) add search to brand/category selectors in the product form AND make category selection hierarchical/stepped (parent → child → grandchild).

Work Log:
- Task 1a — Category image preview (AdminCategories.tsx):
  - Enlarged the create/edit dialog preview box from `w-20 h-20` (80×80) to `w-40 h-40` (160×160) — 4× the area.
  - Switched `<img>` from `object-cover` to `object-contain p-2` so logos are no longer cropped (full logo visible).
  - Scaled placeholder `FolderOpen` icon from `w-8 h-8` to `w-12 h-12` and remove button from `w-5 h-5`/`w-3 h-3` to `w-6 h-6`/`w-3.5 h-3.5` to match the bigger box.
- Task 1b — Hero slide image preview (AdminSettings.tsx):
  - Enlarged each slide's preview box from `w-32 h-16` (128×64) to `w-full sm:w-72 h-40` (288×160 on desktop, full-width on mobile) — ~5.6× the area, proper 16:9-ish banner aspect.
  - Changed layout wrapper from `flex items-center` to `flex flex-col sm:flex-row sm:items-center` so the wider preview stacks above the button on narrow screens (no overflow).
  - Scaled placeholder `ImagePlus` icon from `w-6 h-6` to `w-10 h-10` and remove button from `w-5 h-5`/`w-3 h-3` to `w-6 h-6`/`w-3.5 h-3.5`.
- Task 2a — Created `src/components/admin/SearchableSelect.tsx`:
  - Generic searchable combobox built on shadcn `Popover` + `Command` (cmdk).
  - Props: options [{value,label,hint?}], value, onChange, placeholder, searchPlaceholder, emptyText, disabled, rtl.
  - Trigger styled like the native shadcn Select (h-9, bordered, rounded-md, chevron icon) for visual consistency.
  - Command list filters options by label via cmdk's built-in fuzzy filter; clicking an option selects it (or clears if re-clicked); Popover auto-closes on select.
  - RTL-aware (dir="rtl" on trigger + content).
- Task 2b — Created `src/components/admin/CategoryCascader.tsx`:
  - Hierarchical stepped selector that renders one SearchableSelect per level.
  - Builds a `parentId → children[]` map and `id → node` map from the flat category list (already fetched by AdminProducts via `/api/admin/categories?flat=true`).
  - Derives the active path (root → selected node) from the current `value`; renders level 0 (roots) always, then appends a new level for each selected ancestor that has children.
  - Selecting a node emits its id via onChange; if it has children, the next-level dropdown appears automatically (user can drill deeper or stop at any level — the selected node at any level is a valid categoryId).
  - Clearing a level climbs back up to the parent selection.
  - Shows a breadcrumb (e.g. "اندودانتیکس › ابزار") above the selectors and a Persian helper line explaining the stepped behavior.
  - Each level is searchable (inherits from SearchableSelect), satisfying "حتما امکان سرچ رو بزار".
- Task 2c — Integrated both into `AdminProducts.tsx` create/edit dialog:
  - Replaced the flat `<Select>` for category with `<CategoryCascader>` (wrapped in a `md:col-span-2` block so the multi-level selectors have horizontal room).
  - Replaced the flat `<Select>` for brand with `<SearchableSelect>` (options = brands mapped to {value, label}).
  - Kept the existing `Select` import (still used for priceType + availability selects).

Verification (Agent Browser, admin login admin/admin):
- Task 1 — Category dialog: opened "دسته‌بندی جدید" dialog; DOM measurement confirmed the preview box is 160×160 (`w-40 h-40`) with `object-contain p-2` on the img.
- Task 1 — Settings hero: navigated to تنظیمات; DOM measurement found all 4 hero slide preview boxes at 288×160 (`w-72 h-40`), each with an `<img>` rendering (hasImg: true). No overflow on the page.
- Task 2 — Category cascader: opened "افزودن محصول جدید" dialog. Level-1 combobox opened to show 9 root categories with a search input. Typed "اند" → list filtered to matching roots. Selected "اندودانتیکس" → a new level-2 combobox ("انتخاب زیردسته") appeared with only the 4 children of اندودانتیکس (ابزار، دستگاه، رابردم و متعلقات، مواد). Selected "ابزار" → a third level combobox appeared. Breadcrumb DOM confirmed: "اندودانتیکس / ابزار".
- Task 2 — Brand search: opened the brand combobox (long list of 40+ brands). Typed "dent" in the search → filtered to 8 matching brands (Dentium, Dentsply, Dentsply Sirona, Dentus, Diadent, Ivoclar Vivadent, Ultradent, Edenta).
- Lint: clean (only the pre-existing unrelated error in mersadent-clone/examples/websocket/frontend.tsx).
- Dev log: all API calls 200; no runtime/console errors.

Stage Summary:
- Image upload previews are now substantially larger: category logos preview at 160×160 (object-contain, no cropping) and hero banners preview at 288×160 (responsive, full-width on mobile). The previous tiny centered squares are gone.
- The product form now has a searchable brand selector and a fully hierarchical, searchable category selector that reveals sub-levels progressively (parent → child → grandchild → …) with a live breadcrumb. Finding a brand or category is now fast via search, and the stepped category flow matches the user's requested UX.
- Two new reusable components added: `SearchableSelect` (generic searchable combobox) and `CategoryCascader` (hierarchical stepped selector). Both are RTL-aware and styled to match the existing shadcn Select look.
