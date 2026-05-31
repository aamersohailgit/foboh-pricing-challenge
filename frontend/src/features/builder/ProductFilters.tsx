import { distinctValues, type ProductFilters as Filters } from "../../lib/filterProducts";
import type { Product } from "../../lib/types";
import { Field, Select, TextInput } from "../../components/ui";

export function ProductFilters({
  products,
  filters,
  onChange,
}: {
  products: Product[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <Field label="Search">
          <TextInput
            placeholder="Title or SKU"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Sub-category">
        <Select value={filters.subCategory} onChange={(e) => set({ subCategory: e.target.value })}>
          <option value="">All</option>
          {distinctValues(products, "subCategory").map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
      </Field>
      <Field label="Segment">
        <Select value={filters.segment} onChange={(e) => set({ segment: e.target.value })}>
          <option value="">All</option>
          {distinctValues(products, "segment").map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
      </Field>
      <Field label="Brand">
        <Select value={filters.brand} onChange={(e) => set({ brand: e.target.value })}>
          <option value="">All</option>
          {distinctValues(products, "brand").map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
