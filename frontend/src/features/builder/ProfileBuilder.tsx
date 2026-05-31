import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { EMPTY_FILTERS, filterProducts, type ProductFilters as Filters } from "../../lib/filterProducts";
import type {
  Customer,
  CustomerGroup,
  PreviewRow,
  ProfilePricing,
  ProfileScope,
  ProfileTarget,
  Product,
} from "../../lib/types";
import { Button, Card, ErrorBanner, Field, TextInput } from "../../components/ui";
import { AdjustmentControls, type AdjType, type Direction, type PricingKind } from "./AdjustmentControls";
import { PreviewTable } from "./PreviewTable";
import { ProductFilters } from "./ProductFilters";
import { ProductList } from "./ProductList";
import { ScopeSelector, type ScopeKind } from "./ScopeSelector";
import { TargetSelector, type TargetKind } from "./TargetSelector";

export function ProfileBuilder({
  products,
  customers,
  groups,
  onSaved,
}: {
  products: Product[];
  customers: Customer[];
  groups: CustomerGroup[];
  onSaved: () => void;
}) {
  const [name, setName] = useState("");

  // Target
  const [targetKind, setTargetKind] = useState<TargetKind>("customer");
  const [customerId, setCustomerId] = useState("");
  const [groupId, setGroupId] = useState("");

  // Scope
  const [scopeKind, setScopeKind] = useState<ScopeKind>("all");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [segment, setSegment] = useState("");
  const [subCategory, setSubCategory] = useState("");

  // Pricing
  const [pricingKind, setPricingKind] = useState<PricingKind>("adjustment");
  const [adjType, setAdjType] = useState<AdjType>("dynamic");
  const [direction, setDirection] = useState<Direction>("decrease");
  const [value, setValue] = useState("10");
  const [overrideAmount, setOverrideAmount] = useState("");

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const overrideAllowed = scopeKind === "product";

  // Changing scope away from a single product invalidates a custom price.
  function changeScopeKind(kind: ScopeKind) {
    setScopeKind(kind);
    if (kind !== "product" && pricingKind === "override") setPricingKind("adjustment");
  }

  const filtered = useMemo(() => filterProducts(products, filters), [products, filters]);

  const target = useMemo<ProfileTarget | null>(() => {
    if (targetKind === "customer") return customerId ? { kind: "customer", customerId } : null;
    return groupId ? { kind: "group", groupId } : null;
  }, [targetKind, customerId, groupId]);

  const scope = useMemo<ProfileScope | null>(() => {
    switch (scopeKind) {
      case "product":
        return selectedProductId ? { kind: "product", productId: selectedProductId } : null;
      case "segment":
        return segment ? { kind: "segment", segment } : null;
      case "subCategory":
        return subCategory ? { kind: "subCategory", subCategory } : null;
      case "all":
        return { kind: "all" };
    }
  }, [scopeKind, selectedProductId, segment, subCategory]);

  const pricing = useMemo<ProfilePricing | null>(() => {
    if (pricingKind === "override") {
      const amount = Number(overrideAmount);
      return overrideAmount !== "" && amount >= 0 ? { kind: "override", amount } : null;
    }
    const v = Number(value);
    return value !== "" && v >= 0 ? { kind: "adjustment", type: adjType, direction, value: v } : null;
  }, [pricingKind, overrideAmount, value, adjType, direction]);

  // --- live preview (debounced) ---
  const [preview, setPreview] = useState<PreviewRow[]>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string>();
  const previewKey = scope && pricing ? JSON.stringify({ scope, pricing }) : "";

  useEffect(() => {
    if (!previewKey) {
      setPreview(undefined);
      return;
    }
    const { scope: s, pricing: p } = JSON.parse(previewKey);
    let cancelled = false;
    setPreviewLoading(true);
    const handle = setTimeout(() => {
      api
        .preview(s, p)
        .then((rows) => !cancelled && (setPreview(rows), setPreviewError(undefined)))
        .catch((err: unknown) => !cancelled && setPreviewError(err instanceof Error ? err.message : "Preview failed"))
        .finally(() => !cancelled && setPreviewLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [previewKey]);

  const canSave = Boolean(name.trim() && target && scope && pricing);

  async function save() {
    if (!target || !scope || !pricing) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      await api.createProfile({ name: name.trim(), target, scope, pricing });
      onSaved();
    } catch (err) {
      const detail =
        err instanceof ApiError && Array.isArray((err.body as { details?: unknown })?.details)
          ? " Check the highlighted fields."
          : "";
      setSaveError((err instanceof Error ? err.message : "Save failed") + detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Set up a pricing profile</h1>
        <p className="text-sm text-slate-500">Choose who it's for, what it covers, and how the price changes.</p>
      </div>

      <Card title="Profile details">
        <Field label="Profile name">
          <TextInput
            placeholder="e.g. VIP — 10% off Sparkling"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </Card>

      <Card title="Who is it for?">
        <TargetSelector
          customers={customers}
          groups={groups}
          kind={targetKind}
          customerId={customerId}
          groupId={groupId}
          onKindChange={setTargetKind}
          onCustomerChange={setCustomerId}
          onGroupChange={setGroupId}
        />
      </Card>

      <Card title="What does it cover?">
        <ScopeSelector
          products={products}
          kind={scopeKind}
          segment={segment}
          subCategory={subCategory}
          onKindChange={changeScopeKind}
          onSegmentChange={setSegment}
          onSubCategoryChange={setSubCategory}
        />
      </Card>

      <Card title="Products" subtitle="Search and filter the catalogue. Select one when scoping to a single product.">
        <div className="space-y-4">
          <ProductFilters products={products} filters={filters} onChange={setFilters} />
          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-100">
            <ProductList
              products={filtered}
              selectable={scopeKind === "product"}
              selectedId={selectedProductId}
              onSelect={setSelectedProductId}
            />
          </div>
        </div>
      </Card>

      <Card title="How does the price change?">
        <AdjustmentControls
          kind={pricingKind}
          adjType={adjType}
          direction={direction}
          value={value}
          overrideAmount={overrideAmount}
          overrideAllowed={overrideAllowed}
          onKindChange={setPricingKind}
          onAdjTypeChange={setAdjType}
          onDirectionChange={setDirection}
          onValueChange={setValue}
          onOverrideAmountChange={setOverrideAmount}
        />
      </Card>

      <Card title="Preview" subtitle="New prices for the products in scope — computed by the API.">
        <PreviewTable rows={preview} loading={previewLoading} error={previewError} />
      </Card>

      {saveError && <ErrorBanner message={saveError} />}

      <div className="flex items-center justify-end gap-3">
        {!canSave && (
          <span className="text-sm text-slate-400">Fill in a name, target, scope and price to save.</span>
        )}
        <Button onClick={save} disabled={!canSave || saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
