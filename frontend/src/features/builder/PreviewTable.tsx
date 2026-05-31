import { formatMoney } from "../../lib/format";
import type { PreviewRow } from "../../lib/types";
import { Spinner } from "../../components/ui";

export function PreviewTable({
  rows,
  loading,
  error,
}: {
  rows: PreviewRow[] | undefined;
  loading: boolean;
  error: string | undefined;
}) {
  if (error) return <p className="py-6 text-center text-sm text-red-600">{error}</p>;
  if (loading && !rows) return <Spinner label="Calculating…" />;
  if (!rows || rows.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No products in scope yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="py-2 pr-4 font-medium">Product</th>
            <th className="py-2 pr-4 font-medium">SKU</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 text-right font-medium">Base price</th>
            <th className="py-2 pl-4 text-right font-medium">New price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const changed = r.newPrice !== r.basePrice;
            return (
              <tr key={r.productId}>
                <td className="py-2.5 pr-4 font-medium text-slate-800">{r.title}</td>
                <td className="py-2.5 pr-4 text-slate-500">{r.sku}</td>
                <td className="py-2.5 pr-4 text-slate-500">{r.subCategory} / {r.segment}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-slate-500">{formatMoney(r.basePrice)}</td>
                <td
                  className={[
                    "py-2.5 pl-4 text-right font-semibold tabular-nums",
                    changed ? "text-emerald-700" : "text-slate-700",
                  ].join(" ")}
                >
                  {formatMoney(r.newPrice)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
