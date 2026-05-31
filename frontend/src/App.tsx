import { useState } from "react";
import { Nav, type View } from "./components/Nav";
import { ErrorBanner, Spinner } from "./components/ui";
import { api } from "./lib/api";
import { useAsync } from "./lib/useAsync";
import { ProfileBuilder } from "./features/builder/ProfileBuilder";
import { PriceChecker } from "./features/checker/PriceChecker";
import { ProfilesList } from "./features/profiles/ProfilesList";

export default function App() {
  const [view, setView] = useState<View>("build");

  // Catalogue data is static for the session — load once and share.
  const catalog = useAsync(async () => {
    const [products, customers, groups] = await Promise.all([
      api.getProducts(),
      api.getCustomers(),
      api.getCustomerGroups(),
    ]);
    return { products, customers, groups };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav view={view} onChange={setView} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {catalog.loading && <Spinner label="Loading catalogue…" />}
        {catalog.error && <ErrorBanner message={catalog.error} />}
        {catalog.data && (
          <>
            {view === "build" && (
              <ProfileBuilder
                products={catalog.data.products}
                customers={catalog.data.customers}
                groups={catalog.data.groups}
                onSaved={() => setView("profiles")}
              />
            )}
            {view === "check" && (
              <PriceChecker products={catalog.data.products} customers={catalog.data.customers} />
            )}
            {view === "profiles" && (
              <ProfilesList customers={catalog.data.customers} groups={catalog.data.groups} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
