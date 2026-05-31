import type { Customer, CustomerGroup } from "../../lib/types";
import { Field, RadioGroup, Select } from "../../components/ui";

export type TargetKind = "customer" | "group";

export function TargetSelector({
  customers,
  groups,
  kind,
  customerId,
  groupId,
  onKindChange,
  onCustomerChange,
  onGroupChange,
}: {
  customers: Customer[];
  groups: CustomerGroup[];
  kind: TargetKind;
  customerId: string;
  groupId: string;
  onKindChange: (kind: TargetKind) => void;
  onCustomerChange: (id: string) => void;
  onGroupChange: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <RadioGroup
        name="targetKind"
        value={kind}
        onChange={onKindChange}
        options={[
          { value: "customer", label: "A specific customer" },
          { value: "group", label: "A customer group" },
        ]}
      />
      {kind === "customer" ? (
        <Field label="Customer">
          <Select value={customerId} onChange={(e) => onCustomerChange(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Customer group">
          <Select value={groupId} onChange={(e) => onGroupChange(e.target.value)}>
            <option value="">Select a group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}
