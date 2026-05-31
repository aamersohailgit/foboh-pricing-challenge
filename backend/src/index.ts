import { createApp } from "./api/app";
import { seed } from "./data/seed";
import { buildRepositories } from "./repositories";

const PORT = process.env.PORT ?? 3001;

const app = createApp(buildRepositories(seed));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API docs at      http://localhost:${PORT}/docs`);
});
