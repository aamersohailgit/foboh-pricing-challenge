import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import type { Repositories } from "../repositories";
import { buildOpenApiDocument } from "../openapi";
import { catalogRouter } from "./catalog";
import { errorHandler } from "./errors";
import { previewRouter } from "./preview";
import { profilesRouter } from "./profiles";
import { resolveRouter } from "./resolve";

/**
 * Build the Express app from a set of repositories. Taking repositories as an
 * argument (rather than importing the seed directly) keeps the app testable
 * with custom fixtures.
 */
export function createApp(repos: Repositories): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/profiles", profilesRouter(repos.profiles));
  app.use("/api", resolveRouter(repos));
  app.use("/api", previewRouter(repos));
  app.use("/api", catalogRouter(repos));

  const openApiDocument = buildOpenApiDocument();
  app.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // Error middleware must be registered last.
  app.use(errorHandler);

  return app;
}
