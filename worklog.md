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

---
Task ID: 3
Agent: main
Task: User reported that uploaded category/hero images still render tiny inside a small box with a visible "square" (dashed border placeholder) behind them — the uploaded image is barely visible. Fix the preview rendering so uploaded images display large and clean.

Work Log:
- Root cause (confirmed via Agent Browser DOM inspection on category 34 "ترمیمی و زیبایی" which has an uploaded SVG image):
  - The preview box used `border-2 border-dashed border-gray-200 bg-gray-50` at ALL times (even when an image was present), so the dashed placeholder "square" remained visible behind/around the image.
  - The `<img>` used `object-contain p-2` — the `p-2` (8px) padding shrunk the usable area to ~144×144 inside a 160×160 box, and `object-contain` further letterboxed the image, making logos with whitespace or non-square aspect ratios appear very small in the center.
  - DOM measurement before fix: box 160×160, image natural 84×150, rendered via object-contain with padding → visually tiny with dashed border visible.
- Fix in `src/components/admin/AdminCategories.tsx`:
  - Added `import { cn } from '@/lib/utils'`.
  - Rewrote the preview box to use conditional classes via `cn()`:
    - When image present: `w-48 h-48 border-solid border-gray-200 bg-white` (192×192, clean solid border, white background — no dashed placeholder visible).
    - When empty: `w-48 h-48 border-dashed border-gray-300 bg-gray-50` (192×192, dashed border + gray bg + folder icon placeholder).
  - Changed `<img>` from `object-contain p-2` to `object-contain` (removed padding so the image fills the entire 192×192 area; object-contain preserves aspect ratio so logos aren't cropped).
  - Enlarged placeholder `FolderOpen` icon from `w-12 h-12` to `w-14 h-14` to match the bigger box.
  - Added `z-10` to the remove button so it stays above the image.
- Fix in `src/components/admin/AdminSettings.tsx` (hero slide previews):
  - Added `import { cn } from '@/lib/utils'`.
  - Applied the same conditional border logic: `border-solid border-gray-200 bg-white` when image present, `border-dashed border-gray-300 bg-gray-50` when empty.
  - Enlarged the box from `w-full sm:w-72 h-40` (288×160) to `w-full sm:w-80 h-44` (320×176) for a larger banner preview.
  - Kept `object-cover` for hero (banners should fill; no padding needed). Added `z-10` to the remove button.

Verification (Agent Browser, admin login admin/admin):
- Category edit dialog (category 34, has SVG image): DOM confirmed the preview box is now 192×192 with class `border-solid border-gray-200 bg-white` (no more dashed border), image class is `w-full h-full object-contain` (no padding). The uploaded logo now fills the box area cleanly.
- Settings → Hero: DOM confirmed all 4 slide preview boxes are 320×176 with `border-solid` (no dashed border), all with images rendering (`hasImg: true`).
- No console errors, no runtime errors in dev.log; all API calls returned 200.
- Lint: clean (only the pre-existing unrelated error in mersadent-clone/examples/websocket/frontend.tsx).

Stage Summary:
- Uploaded category logos/images now display at 192×192 on a clean white background with a subtle solid border — no more tiny image inside a dashed placeholder square. Logos render via object-contain (no cropping, no padding) so they fill the preview area properly.
- Hero slide previews enlarged to 320×176 with the same clean styling (solid border + white bg when image present, dashed placeholder only when empty).
- The "square behind the image" and "image too small" issues are resolved for both the category image upload and the hero slide image upload.

---
Task ID: 4
Agent: main
Task: Apply 4 sequential patches to the existing product add/edit form — (1) simplify inventory, (2) country → searchable select + quick-add, (3) product type + type-specific fields, (4) custom specs section. All changes scoped to the admin product form + DB; untouched: category cascader, brand, price/discount, AI super-prompt, strengths/weaknesses, description & SEO.

Work Log:
Schema (prisma/schema.prisma) + `bunx prisma db push --accept-data-loss`:
- Removed `lowStock Int @default(0)` from Product (intentional data loss of 33 non-null values — the numeric threshold field is being deleted entirely per Patch 1).
- Added `productType String?` (device|material|tool|consumable), `typeFields String?` (JSON string), `customSpecs String?` (JSON string) to Product. SQLite has no JSONB, so JSON is stored as a string (same pattern as existing strengths/weaknesses/specs).
- Added new `Country` model (id, name @unique, order) as a standalone lookup table — NO FK to Product (by design, so legacy free-text country values stay untouched per Patch 2 requirement).
- Added `@@index([productType])`.

Patch 1 — Inventory simplification:
- Removed the "موجودی کم (threshold)" number field from the product form entirely.
- Reduced the availability select from 3 options to 2: موجود (in_stock) / ناموجود (out_of_stock) — removed the "تماس بگیرید" option. Kept the existing `availability String` varchar column (already not a number); value names in_stock/out_of_stock are preserved because ~12 storefront/cart/SEO/compare/dashboard call sites read these exact strings (renaming would break them).
- Removed lowStock from: ProductForm interface, emptyProduct, openEdit, handleSave, AdminProduct interface.
- Removed the "فقط N عدد مانده" low-stock badge from the storefront product card in page.tsx, and removed lowStock from the Product interface there.
- Removed lowStock handling from the product API POST/PUT routes.

Patch 2 — Country → searchable select + quick-add:
- Created `src/app/api/admin/countries/route.ts` (GET list, POST create, DELETE) — copies the brand API pattern. GET auto-seeds 14 default countries (ایران، چین، آلمان، ...) on first access when the table is empty, so the dropdown is never empty. POST is idempotent (returns existing if name matches). NOTE: SQLite doesn't support `createMany({ skipDuplicates })` — removed that option (count===0 guard is sufficient).
- AdminProducts: added `countries` state + fetch in loadLookups (parallel with categories/brands).
- Replaced the free-text "کشور سازنده" Input with a SearchableSelect (value/label = country name) + a "کشور جدید" outline button next to it. Clicking the button reveals an inline Input + "افزودن"/"انصراف" buttons. On add: POST /api/admin/countries, append to local list (sorted), and auto-select the new country name in form.country. Enter key triggers add.
- Storage stays the existing `product.country String?` (name string) — new products write the selected country NAME; legacy products' free-text country values remain untouched (no migration).

Patch 3 — Product type + type-specific fields:
- Added a required "نوع محصول" Select (4 options: دستگاه/مواد/ابزار/مصرفی) immediately after the category block.
- Added a conditional "مشخصات اختصاصی" section (appears only when productType is set) right before the Super-Prompt section, with fields that change per type:
  - دستگاه: مدل دقیق (text), مشخصات فنی کلیدی (text), قابلیت اتوکلاو شدن (toggle).
  - مواد: حجم/وزن بسته‌بندی (text), نوع کیورینگ (select: نوری/خودسخت‌شونده/دوال‌کیور/ندارد), تاریخ انقفا (date, optional).
  - ابزار: جنس (select: استیل ضدزنگ/تیتانیوم/پلاستیک/سایر), محتویات بسته (text).
  - مصرفی: سایز (text), جنس (text), تعداد در بسته (number).
- All type-specific fields are optional. Stored in `typeFields` JSON string (cleaned: empty/false values stripped before save). On edit, parsed back into the form.
- handleSave validates productType is required (toast error if empty).

Patch 4 — Custom specs section:
- Added "ویژگی‌های سفارشی" section after the description field, before the SEO section.
- "+ افزودن ویژگی جدید" button adds an empty row. Each row: "نام ویژگی" Input + "مقدار" Input + a red × delete button.
- Rows stored in `customSpecs` JSON string as [{label, value}] (empty rows filtered before save). On edit, parsed back into the form.

API (src/app/api/admin/products/route.ts):
- POST: accepts + persists productType, typeFields, customSpecs (all nullable); removed lowStock.
- PUT: accepts + updates productType, typeFields, customSpecs (with `!== undefined` guards so partial updates work — e.g. the toggleFeatured/toggleVisible quick actions that send only {id, name, featured} won't clobber the new fields); removed lowStock.

Verification (Agent Browser + API, admin login admin/admin):
- API: POST /api/admin/countries returned 14 seeded countries + created "استرالیا" and "کانادا" (test). GET works.
- API: POST /api/admin/products with productType=device, typeFields={exactModel,keySpecs,autoclavable}, customSpecs=[{رنگ,آبی},{ولتاژ,220V}] created product 78 with all fields persisted. PUT switching to material type + new typeFields worked. DELETE worked.
- UI: create-product dialog shows "نوع محصول *" select (4 options) right after category; "موجودی" select has only 2 options (موجود/ناموجود); the old "موجودی کم" threshold field is GONE.
- UI: country field is a searchable combobox + "کشور جدید" button. Clicking the button reveals an inline input; typing "استرالیا" + افزودن created the country and auto-selected it (combobox showed "استرالیا").
- UI: selecting "دستگاه" revealed مدل دقیق / مشخصات فنی کلیدی / قابلیت اتوکلاو شدن; switching to "مواد" revealed حجم/وزن / نوع کیورینگ / تاریخ انقفا and hid the device fields (conditional rendering confirmed via DOM text checks).
- UI: "افزودن ویژگی جدید" added a row with "نام ویژگی" + "مقدار" inputs + a × delete button (aria-label "حذف ویژگی").
- UI: end-to-end save — filled name + category (اندودانتیکس) + brand (Dentsply) + productType (مواد) + country (استرالیا), clicked "ایجاد محصول" → toast "محصول ایجاد شد". API confirmed the saved product (id 79) had country=استرالیا, productType=material.
- Storefront: removed the "فقط N عدد مانده" badge; public /api/products?discounted=true returns 200 (no lowStock column errors after dev server restart to pick up regenerated Prisma client).
- Restarted dev server (start-dev.sh) so the running process loaded the regenerated Prisma client (the old cached client was still querying the dropped lowStock column → P2022 errors before restart).
- Lint: clean (only the pre-existing unrelated error in mersadent-clone/examples/websocket/frontend.tsx).
- Cleaned up all test data (deleted test products 78 & 79, deleted test countries استرالیا & کانادا).

Stage Summary:
- Patch 1 ✅: Inventory simplified to a single موجود/ناموجود select; the numeric lowStock threshold field and its column are removed from the form, DB, and storefront badge.
- Patch 2 ✅: "کشور سازنده" is now a searchable dropdown (with 14 seeded countries) backed by a new Country table, with an inline "+ کشور جدید" quick-add that creates the country and auto-selects it. Legacy free-text country values on existing products are untouched.
- Patch 3 ✅: A required "نوع محصول" field (دستگاه/مواد/ابزار/مصرفی) sits right after the category picker, and a conditional "مشخصات اختصاصی" section renders type-specific fields (all optional) stored as JSON in typeFields.
- Patch 4 ✅: A "ویژگی‌های سفارشی" section (after description, before SEO) lets admins add/remove label-value rows, stored as JSON in customSpecs.
- All untouched sections (category cascader, brand, price/discount, AI super-prompt, strengths/weaknesses, description, SEO) remain intact.

---
Task ID: footer-settings-and-blog-banner
Agent: main
Task: Two patches — (1) hide blog article previews on the homepage and replace them with a single clickable "read educational articles here" banner that routes to the blog page; (2) fix the footer so it reflects admin-saved contact info (phone / email / address / instagram / telegram / whatsapp) instead of hardcoded values.

Work Log:
- Rewrote `BlogPreviewSection` in `src/app/page.tsx` (was a 3-card article preview that fetched `/api/blog?limit=3`) into a single full-width clickable banner button with a BookOpen icon, the heading "مقالات آموزشی را از اینجا بخوانید", a short subtitle, and a "ورود به بخش مقالات" arrow. Clicking it calls `onNavigate({ type: 'blog' })` and scrolls to top.
- Created a new public GET endpoint at `src/app/api/settings/route.ts` that returns only whitelisted storefront keys (`site_name`, `site_description`, `phone`, `email`, `address`, `instagram`, `telegram`, `whatsapp`) from the `SiteSetting` table. Marked `export const dynamic = 'force-dynamic'` and `revalidate = 0` plus `Cache-Control: no-store` so admin changes appear immediately on the storefront.
- Rewrote the `Footer` component in `src/app/page.tsx` to fetch `/api/settings` on mount and render the contact info dynamically:
  - Phone: `<a href="tel:...">` with a Persian-digit-aware normalizer for the `tel:` href.
  - Email: `<a href="mailto:...">`.
  - Address: links to an nshn.ir search using the saved address text.
  - Added a new social icons row (Instagram / Telegram / WhatsApp) in the company-info column — each only renders if the corresponding setting is non-empty.
  - Site description in the company-info column now also comes from settings.
- Added `Instagram` to the existing `lucide-react` import list in `page.tsx` (was missing, lint caught it).
- Verified end-to-end with Agent Browser:
  - Homepage blog banner is visible and clickable; clicking it navigates to the blog list page (breadcrumb `خانه / مقالات آموزشی`, heading `مقالات آموزشی`, article cards listed).
  - Footer originally showed the user's saved settings: phone `04432225277`, email `salam@gmail.com`, address `ارومیه عمار ساختمان پزشکان مرتاض`, plus Instagram/Telegram/WhatsApp social icon links.
  - Changed phone in admin → saved → reloaded storefront → footer phone updated from `04432225277` → `04439998877` immediately (no cache delay). Reverted the test change afterward; footer now shows `04432225277` again.
- `bun run lint` passes (the only remaining error is a pre-existing one in `mersadent-clone/examples/websocket/frontend.tsx`, unrelated to this work).

Stage Summary:
- Homepage no longer shows article previews — replaced by a single clickable gradient banner ("مقالات آموزشی را از اینجا بخوانید") that routes to the blog page.
- Footer now reads contact info + socials from a new uncached public endpoint (`GET /api/settings`); admin changes to phone/email/address/instagram/telegram/whatsapp are reflected immediately on the storefront after save + page reload.
- New file: `src/app/api/settings/route.ts`. Modified file: `src/app/page.tsx` (`BlogPreviewSection` rewrite, `Footer` rewrite, added `Instagram` import).

---
Task ID: footer-credit-and-hidden-admin
Agent: main
Task: Two patches — (1) change the footer credit text from "طراحی و توسعه با ❤️" to "طراحی و توسعه armangbg"; (2) make the admin panel NOT reachable via a visible footer button (the user felt it was too exposed) and propose an alternative discreet access mechanism.

Work Log:
- Updated the footer copyright row in `src/app/page.tsx`: replaced the heart credit line with `طراحی و توسعه armangbg`, and removed the visible `<button onClick={() => onNavigate({ type: 'adminLogin' })}>پنل مدیریت</button>` entirely.
- Added a hidden admin access `useEffect` in the main `MersadentApp` component (placed right after the `navigate` useCallback). It exposes two discreet, invisible-to-normal-visitors ways to reach the admin login:
  1. URL hash: opening `http://localhost:3000/#admin` (or any URL with `#admin`) immediately routes to the admin login. The hash is auto-cleared via `history.replaceState` afterward so refreshing the page doesn't keep dropping the visitor back into the admin screen.
  2. Keyboard shortcut: `Ctrl + Shift + A` anywhere on the site triggers the admin login. Other key combinations (including plain `a`) are ignored.
- Effect also listens for `hashchange` so the hash route works after initial load.
- Verified end-to-end with Agent Browser:
  - Footer no longer shows a "پنل مدیریت" button; credit text now reads "طراحی و توسعه armangbg".
  - `/#admin` → admin login screen appears, hash is cleared.
  - `Ctrl+Shift+A` keydown event → admin login screen appears.
  - Plain `a` key → nothing happens (stays on homepage). Shortcut is specific.
- `bun run lint` clean for my code (only the pre-existing example-file error remains).

Stage Summary:
- Footer credit: "طراحی و توسعه armangbg".
- Admin access: no visible button anywhere. Reach it via `/#admin` (bookmarkable) or `Ctrl + Shift + A` (keyboard shortcut). Both methods are invisible to regular visitors and verified working.

---
Task ID: remove-tags-from-ui
Agent: main
Task: Remove the "tags" feature from the storefront UI completely. The user noticed tags were still visible — specifically in the product comparison view (مقایسه ۲ محصول) and on product cards. Tags were supposed to have been fully removed from what users see.

Work Log:
- Found two places where tags were still rendered in the UI:
  1. `src/components/compare/CompareView.tsx` — a dedicated "تگ‌ها" section (section header + label cell + per-product badge cells) at the bottom of the comparison table.
  2. `src/app/page.tsx` — a tag-badge overlay on the top-right corner of each product card image (filtered to `badge` / `consumable` tag types).
- Removed the entire "تگ‌ها" section block from `CompareView.tsx` (the `SectionHeader`, `LabelCell`, and the `items.map` value cells). Kept the `Tag` lucide-react import because it is still used as the icon for the "اطلاعات پایه" section header.
- Removed the "Product tags" badge overlay block from the `ProductCard` component in `page.tsx`.
- Left the underlying data plumbing intact (the `tags?` field on the `Product` interface, the `tags` field on `CompareProduct`, the `tags` include in the `/api/featured` and `/api/products` endpoints, and the tag-mapping in `CompareProvider.tsx`). This is deliberate: removing them risks breaking the type system / API contract, and they're now invisible to users. If a full DB/schema purge of tags is desired later, that's a separate decision.
- Verified with Agent Browser:
  - Homepage product cards: 0 tag-badge overlays found (queried `[class*="absolute top-1.5 right-1.5"]`).
  - Compare view (added products, opened compare page): checked section headers — "اطلاعات پایه" ✅, "جزئیات محصول" ✅, "نقاط قوت" ✅, "نقاط ضعف" ✅, "تگ‌ها" ❌ (gone), "تگ" ❌ (gone). All non-tag sections remain intact.
- `bun run lint` clean for my code (only the pre-existing example-file error remains).

Stage Summary:
- Tags are no longer visible anywhere in the storefront UI — not on product cards, not in the product comparison table.
- Two UI blocks removed: the CompareView "تگ‌ها" section and the ProductCard tag-badge overlay.
- Underlying data layer (DB, API, types) left intact to avoid breaking changes; can be purged in a follow-up if the user wants a full schema cleanup.

---
Task ID: fix-blog-banner-and-compare-headers
Agent: main
Task: Two UI fixes — (1) the homepage "مقالات آموزشی" banner had a dark gradient that the user disliked and found hard to read ("اصلا واضح دیده نمیشه"); (2) in the product comparison view, the section header titles were white-on-dark and the user wanted them black so they'd be visible.

Work Log:
- **Banner redesign** (`BlogPreviewSection` in `src/app/page.tsx`):
  - Replaced the dark gradient (`bg-gradient-to-l from-mersadent-dark via-mersadent-dark to-[#1e2d4d]` + `text-white`) with a clean light card: `bg-white` + `border-2 border-mersadent-accent/40` (solid teal border, stronger on hover).
  - Added a 1.5px teal accent bar on the right edge (`absolute inset-y-0 right-0 w-1.5 bg-mersadent-accent`) as a visual anchor.
  - Swapped the icon container from translucent teal-on-dark to a solid teal fill (`bg-mersadent-accent text-white`) so it pops.
  - Title text changed from default white to `text-mersadent-dark` (dark navy); subtitle from `text-gray-300` to `text-gray-500` for stronger contrast on the white card.
- **Compare view headers** (`src/components/compare/CompareView.tsx`):
  - `SectionHeader` (the full-width dividers: اطلاعات پایه / جزئیات محصول / مشخصات فنی / نقاط قوت / نقاط ضعف): changed from `bg-mersadent-dark/95 text-white` (white-on-dark) to `bg-mersadent-accent/10 border-y border-mersadent-accent/20 text-mersadent-dark` (dark text on a light teal-tinted band with top/bottom borders). The icon color also changed from `text-teal-300` to `text-mersadent-accent` for consistency.
  - `LabelCell` (the rightmost sticky column row labels like قیمت / وضعیت / کشور سازنده): changed `text-gray-500` → `text-mersadent-dark` for darker, more readable text against the `bg-gray-50` cells.
- Verified both changes with Agent Browser + VLM:
  - New banner: VLM reports "clean, solid white background", "dark navy text very bold and high-contrast", "very clean and clear — does not look muddy at all".
  - New compare headers: VLM confirms section headers are now "light gray background, dark navy text, clearly readable with high contrast" and row labels are "dark gray/charcoal, clearly readable".
- `bun run lint` clean for my code (only the pre-existing example-file error remains).

Stage Summary:
- Homepage articles banner: replaced the muddy dark gradient with a clean white card + teal accent border + solid teal icon + dark navy title text. Much more readable.
- Compare view: section headers (اطلاعات پایه, جزئیات محصول, نقاط قوت, نقاط ضعف, مشخصات فنی) now use dark text on a light teal-tinted band instead of white-on-dark. Row labels in the sticky right column also darkened for better contrast.

---
Task ID: enamad-feature
Agent: main
Task: Add e-Namad (ای‌نماد) trust badge support — admin settings field + auto-render in footer

Work Log:
- Explored current settings architecture: AdminSettings.tsx (form), /api/admin/settings (GET/PUT), /api/settings (public GET), Footer component in page.tsx
- Added `enamad_code: ''` to DEFAULT_SETTINGS in /api/admin/settings/route.ts
- Added `enamad_code` to PUBLIC_KEYS whitelist + DEFAULTS in /api/settings/route.ts (so footer can read it)
- Added new "نمادهای اعتماد الکترونیکی" card in AdminSettings.tsx with ShieldCheck icon, input field (dir=ltr, inputMode=numeric, placeholder "مثلاً ۱۲۳۴۵۶"), and helper text linking to inamad.ir
- Added enamad badge rendering in Footer component — shows an official enamad logo image (from trustseal.enamad.ir/logo.aspx?id=CODE) wrapped in a link to trustseal.enamad.ir/?id=CODE, only when enamad_code is set (sanitized to digits only). Placed in a new band above the copyright bar with white bg behind the badge.
- Ran lint: only pre-existing error in mersadent-clone/examples/websocket/frontend.tsx (not related to this task)
- Browser-verified end-to-end:
  * Admin settings page shows the new card with input field + inamad.ir helper link ✓
  * Saved test code "123456" → storefront footer shows enamad badge (link + img with correct URLs) ✓
  * Cleared code via admin API → storefront footer hides badge ✓
  * Dev log clean, no errors

Stage Summary:
- e-Namad feature fully implemented and browser-verified
- Files changed: src/app/api/admin/settings/route.ts, src/app/api/settings/route.ts, src/components/admin/AdminSettings.tsx, src/app/page.tsx (Footer)
- When user gets their real e-Namad code from inamad.ir, they just paste it in admin → settings → "نمادهای اعتماد الکترونیکی" card and save; the official badge auto-renders in the footer
- DB currently has enamad_code = '' (clean state, ready for real code)

---
Task ID: postgres-migration
Agent: main
Task: Migrate database from SQLite to PostgreSQL (Liara cloud)

Work Log:
- User created PostgreSQL 16.1 database on Liara (host: kilimanjaro.liara.cloud:32695)
- Enabled public network access on Liara so sandbox can reach the DB
- Tested TCP connectivity to kilimanjaro.liara.cloud:32695 → port open
- Updated prisma/schema.prisma: provider "sqlite" → "postgresql"
- Updated .env: DATABASE_URL now points to postgresql://root:...@kilimanjaro.liara.cloud:32695/postgres
- Ran bun run db:generate → Prisma Client regenerated for PostgreSQL
- Ran bun run db:push (44s) → all tables created in Liara PostgreSQL
- First seed run failed with "Transaction not found" error (Liara drops long transactions)
- Patched prisma/seed.ts: reduced BATCH_SIZE from 100 to 10, added explicit timeout (maxWait: 15000, timeout: 60000) to $transaction options
- Had to TRUNCATE all tables CASCADE to clean up partial data from failed seed run
- Ran seed in background → completed: 59 categories, 54 brands, 396 products
- Ran seed:blog → 4 blog categories, 12 posts
- Dev server kept dying: root cause was shell env var DATABASE_URL=file:/home/z/my-project/db/custom.db (old SQLite URL) overriding the .env file
- Fix: modified package.json scripts to use `env -u DATABASE_URL` prefix (dev, db:push, db:generate, db:migrate, db:reset, seed, seed:categories, seed:blog) — this unsets DATABASE_URL from shell so Next.js/Prisma read from .env
- Restarted dev server via start-dev.sh (uses nohup setsid bun run dev -- -H 0.0.0.0)
- Agent Browser verification:
  * Homepage loads (HTTP 200), title "MersaDent | مرصادنت"
  * 10 top-level categories with subcategory counts
  * 54 brands listed
  * Hero slider (4 slides) working
  * Footer renders (categories, quick links, contact, blog banner)
  * Admin panel: login works, dashboard loads, products page shows 396 products with "موجود" status
  * All API endpoints return 200 (settings, categories, featured, brands, admin/products, admin/categories, admin/brands, admin/countries)
  * Prisma queries now use PostgreSQL syntax (SELECT "public"."TableName"...)
  * No errors in dev.log

Stage Summary:
- Database fully migrated from SQLite to PostgreSQL 16.1 on Liara
- All seed data loaded: 59 categories, 54 brands, 396 products, 4 blog categories, 12 blog posts
- Dev server running on port 3000, connected to Liara PostgreSQL
- Critical fix: package.json scripts now use `env -u DATABASE_URL` to override stale shell env var
- Files changed: prisma/schema.prisma, .env, prisma/seed.ts (BATCH_SIZE + timeout), package.json (env -u DATABASE_URL on all prisma/dev scripts)
- Old SQLite DB file at /home/z/my-project/db/custom.db still exists but unused (can be deleted later if desired)
- Ready for production deployment to Liara (just need to set DATABASE_URL env var in Liara app settings)

---
Task ID: storage-refactor
Agent: main
Task: Refactor file upload/storage system — UUID naming, .gitignore, orphan cleanup on delete

Work Log:
- Explored all 4 upload APIs (hero, categories, brands, product images) + all delete endpoints
- Discovered bug: AdminProducts.tsx frontend called POST /api/admin/upload which never existed — image upload for products was completely broken before this refactor
- Created src/lib/storage.ts — centralized utility with:
  * saveUpload(folder, mime, buffer) → UUID-based filename, returns /uploads/<folder>/<uuid>.<ext>
  * saveUploadWithExt(folder, ext, buffer) → for explicit extension (e.g. SVG passthrough)
  * saveSharpOutput(folder, ext, writeFn) → for sharp pipeline output (avoid double-write)
  * deleteUpload(urlPath) → path-traversal-protected, never throws, no-op on null/external URLs
  * deleteUploads(urlPaths[]) → batch delete
  * isOurUpload(urlPath) → checks if URL starts with /uploads/
  * All paths computed from process.cwd()/public/uploads so it works the same in dev + Liara
  * mkdir({ recursive: true }) called on every save so missing dirs auto-create
- Refactored 4 upload endpoints to use storage.ts:
  * /api/admin/hero/upload — now UUID filenames
  * /api/admin/categories/upload — now UUID filenames
  * /api/admin/brands/upload — now UUID filenames
  * /api/admin/products/[id]/images — NEW POST endpoint (was missing entirely), UUID filenames, sharp-optimized to 1200x1200 webp
- Added file cleanup on every delete path:
  * DELETE /api/admin/products/[id] → cascade-deletes ALL product image files via deleteUploads()
  * DELETE /api/admin/products/[id]/images?imageId=N → deletes that image file
  * DELETE /api/admin/brands?id=N → deletes brand logo file
  * DELETE /api/admin/categories?id=N → deletes category image file
  * PUT /api/admin/brands with logo change → deletes previous logo file
  * PUT /api/admin/categories with image change → deletes previous image file
  * PUT /api/admin/settings with hero_slide_N_image change → deletes previous hero file (covers "click X to clear" UI flow)
  * POST /api/admin/hero/upload with slide=N → deletes previous hero file for that slide
- Fixed frontend bug in AdminProducts.tsx: handleUpload() now calls POST /api/admin/products/{id}/images with Authorization header (was calling non-existent /api/admin/upload without auth header)
- Added /public/uploads/ to .gitignore (so uploaded images never get committed to git)
- Lint: clean (only pre-existing error in mersadent-clone/examples/websocket which is unrelated)
- Browser verification (via curl since file inputs aren't directly accessible via agent-browser):
  * Hero upload (slide 1): ✓ UUID URL, file on disk, HTTP 200
  * Category image upload (id=1): ✓ UUID URL, file on disk
  * Brand logo upload (id=1): ✓ UUID URL, file on disk
  * Product image upload (product id=692): ✓ UUID URL, file on disk, DB record created
  * Hero re-upload (replace): ✓ old file deleted, new UUID file created
  * Hero clear via admin settings PUT (hero_slide_1_image=''): ✓ file deleted
  * Category delete with image: ✓ file deleted from disk
  * Brand delete with logo: ✓ logo file deleted from disk
  * Product delete with 3 images: ✓ ALL 3 files cascade-deleted from disk + DB records gone
  * SVG handling: sharp bypass works (saved as-is, not processed)
  * Webp conversion: all PNG/JPG uploads become .webp via sharp

Stage Summary:
- All 4 upload types now use UUID-based filenames: /uploads/<folder>/<uuid>.<ext>
- Orphan files are impossible: every replace/clear/delete also deletes the previous file
- Path traversal protected: deleteUpload() only touches files inside public/uploads/
- Files stored under public/uploads/ — ready to be mounted as Liara Persistent Disk in production
- .gitignore updated so uploaded media never enters version control
- Critical bug fixed: product image upload was completely broken before (frontend called non-existent endpoint)
- Files changed:
  * NEW: src/lib/storage.ts (utility)
  * src/app/api/admin/hero/upload/route.ts (refactored)
  * src/app/api/admin/categories/upload/route.ts (refactored)
  * src/app/api/admin/brands/upload/route.ts (refactored)
  * src/app/api/admin/products/[id]/images/route.ts (added POST endpoint + refactored DELETE)
  * src/app/api/admin/products/[id]/route.ts (refactored DELETE for cascade cleanup)
  * src/app/api/admin/brands/route.ts (added cleanup on PUT + DELETE)
  * src/app/api/admin/categories/route.ts (added cleanup on PUT + DELETE)
  * src/app/api/admin/settings/route.ts (added cleanup on hero_slide_*_image change)
  * src/components/admin/AdminProducts.tsx (fixed frontend to call correct endpoint)
  * .gitignore (added /public/uploads/)
