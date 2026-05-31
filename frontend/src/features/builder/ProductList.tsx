import { formatMoney } from "../../lib/format";
import type { Product } from "../../lib/types";

/**
 * Browsable product list. When `selectable` (scope = One Product), rows are
 * single-select; otherwise it's a read-only catalogue browser.
 */
export function ProductList({
  products,
  selectable,
  selectedId,
  onSelect,
}: {
  products: Product[];
  selectable: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (products.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No products match your filters.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {products.map((p) => {
        const selected = selectable && p.id === selectedId;
        return (
          <li key={p.id}>
            <button
              type="button"
              disabled={!selectable}
              onClick={() => onSelect(p.id)}
              className={[
                "flex w-full items-center gap-3 px-2 py-2.5 text-left transition",
                selectable ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                selected ? "bg-emerald-50" : "",
              ].join(" ")}
            >
              {selectable && (
                <span
                  className={[
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-emerald-600 bg-emerald-600" : "border-slate-300",
                  ].join(" ")}
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">{p.title}</span>
                <span className="block text-xs text-slate-400">
                  {p.sku} · {p.subCategory} / {p.segment} · {p.brand}
                </span>
              </span>
              <span className="shrink-0 text-sm tabular-nums text-slate-600">{formatMoney(p.basePrice)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
