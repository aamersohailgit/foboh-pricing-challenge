import { distinctValues } from "../../lib/filterProducts";
import type { Product } from "../../lib/types";
import { Field, RadioGroup, Select } from "../../components/ui";

export type ScopeKind = "product" | "segment" | "subCategory" | "all";

export function ScopeSelector({
  products,
  kind,
  segment,
  subCategory,
  onKindChange,
  onSegmentChange,
  onSubCategoryChange,
}: {
  products: Product[];
  kind: ScopeKind;
  segment: string;
  subCategory: string;
  onKindChange: (kind: ScopeKind) => void;
  onSegmentChange: (segment: string) => void;
  onSubCategoryChange: (subCategory: string) => void;
}) {
  return (
    <div className="space-y-3">
      <RadioGroup
        name="scopeKind"
        value={kind}
        onChange={onKindChange}
        options={[
          { value: "product", label: "One product" },
          { value: "segment", label: "By segment" },
          { value: "subCategory", label: "By sub-category" },
          { value: "all", label: "All products" },
        ]}
      />
      {kind === "product" && (
        <p className="text-sm text-slate-500">Pick a product from the list below.</p>
      )}
      {kind === "segment" && (
        <Field label="Segment">
          <Select value={segment} onChange={(e) => onSegmentChange(e.target.value)}>
            <option value="">Select a segment…</option>
            {distinctValues(products, "segment").map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>
      )}
      {kind === "subCategory" && (
        <Field label="Sub-category">
          <Select value={subCategory} onChange={(e) => onSubCategoryChange(e.target.value)}>
            <option value="">Select a sub-category…</option>
            {distinctValues(products, "subCategory").map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>
      )}
      {kind === "all" && (
        <p className="text-sm text-slate-500">
          Applies to every product, including ones added later.
        </p>
      )}
    </div>
  );
}
