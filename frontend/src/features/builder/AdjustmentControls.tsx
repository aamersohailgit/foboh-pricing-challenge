import { Field, RadioGroup, TextInput } from "../../components/ui";

export type PricingKind = "adjustment" | "override";
export type AdjType = "fixed" | "dynamic";
export type Direction = "increase" | "decrease";

export function AdjustmentControls({
  kind,
  adjType,
  direction,
  value,
  overrideAmount,
  overrideAllowed,
  onKindChange,
  onAdjTypeChange,
  onDirectionChange,
  onValueChange,
  onOverrideAmountChange,
}: {
  kind: PricingKind;
  adjType: AdjType;
  direction: Direction;
  value: string;
  overrideAmount: string;
  overrideAllowed: boolean;
  onKindChange: (kind: PricingKind) => void;
  onAdjTypeChange: (t: AdjType) => void;
  onDirectionChange: (d: Direction) => void;
  onValueChange: (v: string) => void;
  onOverrideAmountChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <RadioGroup
        name="pricingKind"
        value={kind}
        onChange={onKindChange}
        options={[
          { value: "adjustment", label: "Adjust the price" },
          { value: "override", label: "Set a custom price", disabled: !overrideAllowed },
        ]}
      />
      {!overrideAllowed && (
        <p className="text-xs text-slate-400">
          A custom flat price is only available when the scope is a single product.
        </p>
      )}

      {kind === "adjustment" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Type">
            <RadioGroup
              name="adjType"
              value={adjType}
              onChange={onAdjTypeChange}
              options={[
                { value: "fixed", label: "Fixed ($)" },
                { value: "dynamic", label: "Dynamic (%)" },
              ]}
            />
          </Field>
          <Field label="Direction">
            <RadioGroup
              name="direction"
              value={direction}
              onChange={onDirectionChange}
              options={[
                { value: "decrease", label: "Decrease −" },
                { value: "increase", label: "Increase +" },
              ]}
            />
          </Field>
          <Field label={adjType === "fixed" ? "Amount ($)" : "Percentage (%)"}>
            <TextInput
              type="number"
              min="0"
              step={adjType === "fixed" ? "0.01" : "1"}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
            />
          </Field>
        </div>
      ) : (
        <Field label="Custom price ($)" hint="Applied as a flat price, ignoring the base.">
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={overrideAmount}
            onChange={(e) => onOverrideAmountChange(e.target.value)}
          />
        </Field>
      )}
    </div>
  );
}
