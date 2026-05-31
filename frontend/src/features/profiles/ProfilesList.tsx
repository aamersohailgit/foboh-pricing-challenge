import { useState } from "react";
import { api } from "../../lib/api";
import { describePricing, describeScope } from "../../lib/format";
import type { Customer, CustomerGroup, PricingProfile, ProfileTarget } from "../../lib/types";
import { useAsync } from "../../lib/useAsync";
import { Badge, Button, Card, ErrorBanner, Spinner } from "../../components/ui";

export function ProfilesList({ customers, groups }: { customers: Customer[]; groups: CustomerGroup[] }) {
  const { data, loading, error, reload } = useAsync(() => api.listProfiles());
  const [deletingId, setDeletingId] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  function describeTarget(target: ProfileTarget): string {
    if (target.kind === "customer") {
      return customers.find((c) => c.id === target.customerId)?.name ?? "Unknown customer";
    }
    return `${groups.find((g) => g.id === target.groupId)?.name ?? "Unknown group"} (group)`;
  }

  async function remove(profile: PricingProfile) {
    if (!window.confirm(`Delete "${profile.name}"?`)) return;
    setDeletingId(profile.id);
    setActionError(undefined);
    try {
      await api.deleteProfile(profile.id);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Pricing profiles</h1>
        <p className="text-sm text-slate-500">Every profile the resolver considers when pricing an order.</p>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      <Card>
        {loading && <Spinner />}
        {error && <ErrorBanner message={error} />}
        {data && data.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No profiles yet — build one to get started.</p>
        )}
        {data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Applies to</th>
                  <th className="py-2 pr-4 font-medium">Scope</th>
                  <th className="py-2 pr-4 font-medium">Price rule</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 font-medium text-slate-800">{p.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{describeTarget(p.target)}</td>
                    <td className="py-3 pr-4 text-slate-600">{describeScope(p.scope)}</td>
                    <td className="py-3 pr-4">
                      <Badge>{describePricing(p.pricing)}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Button variant="danger" onClick={() => remove(p)} disabled={deletingId === p.id}>
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
