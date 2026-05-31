import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import type { Customer, Product, ResolveResult } from "../../lib/types";
import { Badge, Card, ErrorBanner, Field, Select, Spinner } from "../../components/ui";

const STEP_LABELS: Record<string, string> = {
  step0_active: "Active profiles",
  step1_customer: "Customer specificity",
  step2_product: "Product specificity",
  step3_customer_over_product: "Customer over product",
  step4_recency: "Most recent wins",
};

export function PriceChecker({ products, customers }: { products: Product[]; customers: Customer[] }) {
  // Default to the headline scenario when the seed data is present.
  const [customerId, setCustomerId] = useState(
    () => customers.find((c) => c.id === "cust_bondi_cellars")?.id ?? customers[0]?.id ?? "",
  );
  const [productId, setProductId] = useState(
    () => products.find((p) => p.id === "prod_koyama_brut")?.id ?? products[0]?.id ?? "",
  );

  const [result, setResult] = useState<ResolveResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!customerId || !productId) return;
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    api
      .resolvePrice(customerId, productId)
      .then((r) => !cancelled && setResult(r))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : "Failed to resolve"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [customerId, productId]);

  const saving = useMemo(() => formatMoney(result && result.basePrice !== null && result.price !== null ? result.basePrice - result.price : null), [result]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Price checker</h1>
        <p className="text-sm text-slate-500">
          Resolve what a customer pays for a product when pricing profiles overlap — and see why.
        </p>
      </div>

      <Card title="Pick a customer and product">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Customer">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Product">
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {loading && <Spinner label="Resolving…" />}
      {error && <ErrorBanner message={error} />}

      {result && !loading && (
        <Card title="Resolved price">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Price</p>
              <p className="text-3xl font-bold text-emerald-700">{formatMoney(result.price)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Base price</p>
              <p className="text-lg font-medium text-slate-500 line-through">{formatMoney(result.basePrice)}</p>
            </div>
            {result.price !== null && result.basePrice !== null && result.price !== result.basePrice && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Saving</p>
                <p className="text-lg font-medium text-slate-700">{saving}</p>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Source profile</p>
              <p className="text-sm font-medium text-slate-800">
                {result.sourceProfile ? result.sourceProfile.name : "None — base price applies"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Why</p>
              <p className="text-sm text-slate-700">{result.reason}</p>
            </div>
            {result.appliedSteps.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.appliedSteps.map((step) => (
                  <Badge key={step}>{STEP_LABELS[step] ?? step}</Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
