import type {
  CreateProfileInput,
  Customer,
  CustomerGroup,
  PreviewRow,
  PricingProfile,
  ProfilePricing,
  ProfileScope,
  Product,
  ResolveResult,
} from "./types";

/** Thrown when the API returns a non-2xx response. Carries status + parsed body. */
export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    const message =
      (body && typeof body === "object" && "error" in body && String(body.error)) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getProducts: () => request<Product[]>("/api/products"),
  getCustomers: () => request<Customer[]>("/api/customers"),
  getCustomerGroups: () => request<CustomerGroup[]>("/api/customer-groups"),

  listProfiles: () => request<PricingProfile[]>("/api/profiles"),
  createProfile: (input: CreateProfileInput) =>
    request<PricingProfile>("/api/profiles", { method: "POST", body: JSON.stringify(input) }),
  deleteProfile: (id: string) =>
    request<void>(`/api/profiles/${id}`, { method: "DELETE" }),

  preview: (scope: ProfileScope, pricing: ProfilePricing) =>
    request<PreviewRow[]>("/api/preview", {
      method: "POST",
      body: JSON.stringify({ scope, pricing }),
    }),

  resolvePrice: (customerId: string, productId: string) =>
    request<ResolveResult>(
      `/api/resolve-price?customerId=${encodeURIComponent(customerId)}&productId=${encodeURIComponent(productId)}`,
    ),
};
