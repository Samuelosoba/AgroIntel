// Local/Docker entry point. On Vercel, src/app.ts's default export is served directly.
import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`AgroIntel API listening on http://localhost:${env.PORT}`);
});
