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
