import { z, type ZodType } from "zod";
import {
  CustomerGroupSchema,
  CustomerSchema,
  PricingProfileSchema,
  ProductSchema,
} from "./domain";
import {
  CreateProfileSchema,
  PreviewRequestSchema,
  PreviewRowSchema,
  ResolveResultSchema,
} from "./api/schemas";

/**
 * Convert a Zod schema to an OpenAPI-3.0 schema object. Dates are
 * unrepresentable in JSON Schema, so an override renders them as `date-time`
 * strings; the leftover `$schema` key is dropped (OpenAPI doesn't use it).
 */
function toSchema(schema: ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, {
    target: "openapi-3.0",
    unrepresentable: "any",
    override: (ctx) => {
      const def = (ctx.zodSchema as { _zod?: { def?: { type?: string } } })._zod?.def;
      if (def?.type === "date") {
        ctx.jsonSchema.type = "string";
        ctx.jsonSchema.format = "date-time";
      }
    },
  }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const jsonResponse = (schema: object, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
} as const;

/** Build the OpenAPI document served at /docs and /openapi.json. */
export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "FOBOH Pricing API",
      version: "1.0.0",
      description:
        "Customer-specific pricing for F&B suppliers. CRUD for pricing profiles plus a resolver that returns the price a customer pays for a product, the source profile, and why.",
    },
    servers: [{ url: "http://localhost:3001" }],
    paths: {
      "/health": {
        get: {
          tags: ["meta"],
          summary: "Health check",
          responses: { "200": jsonResponse({ type: "object", properties: { status: { type: "string" } } }, "OK") },
        },
      },
      "/api/profiles": {
        get: {
          tags: ["profiles"],
          summary: "List pricing profiles",
          responses: { "200": jsonResponse({ type: "array", items: ref("PricingProfile") }, "All profiles") },
        },
        post: {
          tags: ["profiles"],
          summary: "Create a pricing profile",
          requestBody: { required: true, content: { "application/json": { schema: ref("CreateProfile") } } },
          responses: {
            "201": jsonResponse(ref("PricingProfile"), "Created"),
            "400": jsonResponse(ref("Error"), "Validation failed"),
          },
        },
      },
      "/api/profiles/{id}": {
        get: {
          tags: ["profiles"],
          summary: "Get a pricing profile",
          parameters: [idParam],
          responses: {
            "200": jsonResponse(ref("PricingProfile"), "The profile"),
            "404": jsonResponse(ref("Error"), "Not found"),
          },
        },
        put: {
          tags: ["profiles"],
          summary: "Replace a pricing profile (id and createdAt are preserved)",
          parameters: [idParam],
          requestBody: { required: true, content: { "application/json": { schema: ref("CreateProfile") } } },
          responses: {
            "200": jsonResponse(ref("PricingProfile"), "Updated"),
            "400": jsonResponse(ref("Error"), "Validation failed"),
            "404": jsonResponse(ref("Error"), "Not found"),
          },
        },
        delete: {
          tags: ["profiles"],
          summary: "Delete a pricing profile",
          parameters: [idParam],
          responses: { "204": { description: "Deleted" }, "404": jsonResponse(ref("Error"), "Not found") },
        },
      },
      "/api/resolve-price": {
        get: {
          tags: ["pricing"],
          summary: "Resolve the price a customer pays for a product",
          parameters: [
            { name: "customerId", in: "query", required: true, schema: { type: "string" } },
            { name: "productId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": jsonResponse(ref("ResolveResult"), "Resolved price with explanation"),
            "404": jsonResponse(ref("Error"), "Customer or product not found"),
          },
        },
      },
      "/api/preview": {
        post: {
          tags: ["pricing"],
          summary: "Preview the prices a scope + adjustment would produce",
          requestBody: { required: true, content: { "application/json": { schema: ref("PreviewRequest") } } },
          responses: {
            "200": jsonResponse({ type: "array", items: ref("PreviewRow") }, "Preview rows"),
            "400": jsonResponse(ref("Error"), "Validation failed"),
          },
        },
      },
      "/api/products": {
        get: {
          tags: ["catalog"],
          summary: "List products (excludes soft-deleted)",
          responses: { "200": jsonResponse({ type: "array", items: ref("Product") }, "Live products") },
        },
      },
      "/api/customers": {
        get: {
          tags: ["catalog"],
          summary: "List customers",
          responses: { "200": jsonResponse({ type: "array", items: ref("Customer") }, "All customers") },
        },
      },
      "/api/customer-groups": {
        get: {
          tags: ["catalog"],
          summary: "List customer groups",
          responses: { "200": jsonResponse({ type: "array", items: ref("CustomerGroup") }, "All groups") },
        },
      },
    },
    components: {
      schemas: {
        Product: toSchema(ProductSchema),
        Customer: toSchema(CustomerSchema),
        CustomerGroup: toSchema(CustomerGroupSchema),
        PricingProfile: toSchema(PricingProfileSchema),
        CreateProfile: toSchema(CreateProfileSchema),
        ResolveResult: toSchema(ResolveResultSchema),
        PreviewRequest: toSchema(PreviewRequestSchema),
        PreviewRow: toSchema(PreviewRowSchema),
        Error: {
          type: "object",
          properties: { error: { type: "string" }, details: { type: "array", items: { type: "object" } } },
          required: ["error"],
        },
      },
    },
  };
}
