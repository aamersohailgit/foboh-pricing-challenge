import { describe, expect, it } from "vitest";
import request from "supertest";
import { seed } from "../data/seed";
import { buildRepositories } from "../repositories";
import { createApp } from "./app";

function app() {
  return createApp(buildRepositories(seed));
}

const validProfileBody = {
  name: "Test profile",
  target: { kind: "customer", customerId: "cust_bondi_cellars" },
  scope: { kind: "all" },
  pricing: { kind: "adjustment", type: "dynamic", direction: "decrease", value: 5 },
};

describe("GET /api/resolve-price", () => {
  it("resolves the headline scenario: Bondi + Koyama Brut -> $95 via profile_c", async () => {
    const res = await request(app())
      .get("/api/resolve-price")
      .query({ customerId: "cust_bondi_cellars", productId: "prod_koyama_brut" });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(95);
    expect(res.body.sourceProfile.id).toBe("profile_c");
    expect(res.body.appliedSteps).toContain("step1_customer");
  });

  it("404s an unknown customer", async () => {
    const res = await request(app())
      .get("/api/resolve-price")
      .query({ customerId: "nope", productId: "prod_koyama_brut" });
    expect(res.status).toBe(404);
  });

  it("404s a soft-deleted product (hidden by the store)", async () => {
    const res = await request(app())
      .get("/api/resolve-price")
      .query({ customerId: "cust_bondi_cellars", productId: "prod_koyama_pinot_gris_2017" });
    expect(res.status).toBe(404);
  });
});

describe("profiles CRUD", () => {
  it("creates, reads back, then deletes a profile", async () => {
    const server = app();

    const created = await request(server).post("/api/profiles").send(validProfileBody);
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTruthy();
    expect(created.body.createdAt).toBeTruthy();
    const id = created.body.id;

    const fetched = await request(server).get(`/api/profiles/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.name).toBe("Test profile");

    const deleted = await request(server).delete(`/api/profiles/${id}`);
    expect(deleted.status).toBe(204);

    const gone = await request(server).get(`/api/profiles/${id}`);
    expect(gone.status).toBe(404);
  });

  it("preserves createdAt across an update", async () => {
    const server = app();
    const created = await request(server).post("/api/profiles").send(validProfileBody);
    const { id, createdAt } = created.body;

    const updated = await request(server)
      .put(`/api/profiles/${id}`)
      .send({ ...validProfileBody, name: "Renamed" });

    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe("Renamed");
    expect(updated.body.id).toBe(id);
    expect(updated.body.createdAt).toBe(createdAt);
  });

  it("400s an invalid body", async () => {
    const res = await request(app())
      .post("/api/profiles")
      .send({ name: "bad", target: { kind: "customer" } }); // missing customerId, scope, pricing
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("404s update/delete of an unknown profile", async () => {
    const server = app();
    expect((await request(server).put("/api/profiles/nope").send(validProfileBody)).status).toBe(404);
    expect((await request(server).delete("/api/profiles/nope")).status).toBe(404);
  });
});

describe("catalog", () => {
  it("lists products excluding the soft-deleted one", async () => {
    const res = await request(app()).get("/api/products");
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id);
    expect(ids).toContain("prod_koyama_brut");
    expect(ids).not.toContain("prod_koyama_pinot_gris_2017");
  });

  it("serves the OpenAPI document", async () => {
    const res = await request(app()).get("/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths["/api/resolve-price"]).toBeTruthy();
  });
});
