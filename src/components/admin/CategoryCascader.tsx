'use client';

import * as React from 'react';
import { ChevronLeft, FolderOpen, Folder } from 'lucide-react';
import { SearchableSelect, type SearchableOption } from './SearchableSelect';
import { cn } from '@/lib/utils';

export interface CascaderCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

interface CategoryCascaderProps {
  categories: CascaderCategory[];
  value: string;
  onChange: (value: string) => void;
  /** RTL labels */
  levelLabels?: string[];
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

/**
 * Hierarchical (stepped) category selector.
 *
 * Renders one searchable dropdown per hierarchy level. Selecting a parent
 * reveals the next-level dropdown populated with its children, and so on
 * until a leaf (or the deepest chosen node) is reached.
 *
 * The final selected node id (at any level) is emitted via onChange.
 */
export function CategoryCascader({
  categories,
  value,
  onChange,
  levelLabels,
  searchPlaceholder = 'جستجوی دسته...',
  emptyText = 'دسته‌ای یافت نشد',
  disabled = false,
}: CategoryCascaderProps) {
  // Build child lookup: parentId -> children[]
  const childrenMap = React.useMemo(() => {
    const map = new Map<number | null, CascaderCategory[]>();
    for (const c of categories) {
      const key = c.parentId;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    // sort each level by name for stable display
    for (const arr of map.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    }
    return map;
  }, [categories]);

  // Node lookup: id -> node
  const nodeMap = React.useMemo(() => {
    const m = new Map<number, CascaderCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  // Derive the active path (chain of selected ids from root to the selected node)
  const path = React.useMemo<string[]>(() => {
    if (!value) return [];
    const id = Number(value);
    if (!nodeMap.has(id)) return [];
    const chain: number[] = [];
    let cur: CascaderCategory | undefined = nodeMap.get(id);
    let guard = 0;
    while (cur && guard < 20) {
      chain.unshift(cur.id);
      cur = cur.parentId != null ? nodeMap.get(cur.parentId) : undefined;
      guard++;
    }
    return chain.map(String);
  }, [value, nodeMap]);

  // Levels to render: always render level 0 (roots). Then for each selected
  // ancestor that has children, render the next level.
  const levels = React.useMemo(() => {
    const result: { parentId: number | null; selectedId: string; options: SearchableOption[] }[] = [];
    // Level 0: roots
    const roots = childrenMap.get(null) ?? [];
    result.push({
      parentId: null,
      selectedId: path[0] ?? '',
      options: roots.map(r => ({ value: String(r.id), label: r.name })),
    });
    // Subsequent levels based on path
    for (let i = 0; i < path.length; i++) {
      const parentId = Number(path[i]);
      const kids = childrenMap.get(parentId) ?? [];
      if (kids.length === 0) break;
      result.push({
        parentId,
        selectedId: path[i + 1] ?? '',
        options: kids.map(k => ({ value: String(k.id), label: k.name })),
      });
    }
    return result;
  }, [path, childrenMap]);

  const handleLevelChange = (levelIndex: number, newId: string) => {
    if (!newId) {
      // cleared this level -> climb up to the parent selection
      if (levelIndex === 0) {
        onChange('');
      } else {
        onChange(path[levelIndex - 1] ?? '');
      }
      return;
    }
    // Selecting a node at this level: emit it. If it has children, the next
    // level dropdown will appear automatically (user can drill down further,
    // or stop here if this is the desired category).
    onChange(newId);
  };

  const defaultLabels = ['دسته‌بندی اصلی', 'زیردسته (سطح ۱)', 'زیردسته (سطح ۲)', 'زیردسته (سطح ۳)', 'زیردسته (سطح ۴)'];

  return (
    <div className="space-y-3">
      {/* Breadcrumb of the current selection path */}
      {path.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded-md px-2.5 py-1.5" dir="rtl">
          <FolderOpen className="size-3.5 ml-1 shrink-0" />
          {path.map((id, idx) => {
            const node = nodeMap.get(Number(id));
            const isLast = idx === path.length - 1;
            return (
              <React.Fragment key={id}>
                <span className={cn('truncate', isLast && 'font-medium text-foreground')}>
                  {node?.name ?? id}
                </span>
                {!isLast && <ChevronLeft className="size-3 opacity-50" />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className="space-y-2.5">
        {levels.map((lvl, idx) => {
          const label = (levelLabels?.[idx] ?? defaultLabels[idx] ?? `سطح ${idx}`);
          const hasChildrenSelected = idx < path.length;
          return (
            <div key={`${lvl.parentId}-${idx}`} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Folder className={cn('size-3.5', hasChildrenSelected ? 'text-primary' : 'opacity-60')} />
                <span>{label}</span>
                {idx > 0 && (
                  <span className="text-[10px] opacity-70">(اختیاری — می‌توانید همین‌جا متوقف شوید)</span>
                )}
              </div>
              <SearchableSelect
                options={lvl.options}
                value={lvl.selectedId}
                onChange={v => handleLevelChange(idx, v)}
                placeholder={idx === 0 ? 'انتخاب دسته مادر' : 'انتخاب زیردسته (یا رد کردن)'}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptyText}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground leading-5" dir="rtl">
        ابتدا دسته مادر را انتخاب کنید؛ پس از هر انتخاب، زیردسته‌های آن (در صورت وجود) نمایش داده می‌شوند.
        می‌توانید در هر سطح متوقف شوید یا با جستجو سریعاً دسته مورد نظر را بیابید.
      </p>
    </div>
  );
}
