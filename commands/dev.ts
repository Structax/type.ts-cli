import { watch } from "fs"
import { join, resolve } from "path"

import { startServer } from "../packages/core/startServer"
import { resolveRoutes } from "../packages/core/resolveRoutes"

const routesDir = resolve("examples/routes")
const port = 8787

console.log("🔧 Starting dev server...")

const routes = await resolveRoutes(routesDir)
for (const route of routes) {
  const [method, handler] = route;
  console.log(`🔗 ${method} ${"path" in handler ? handler.path : "unknown path"}`)
}

startServer(routesDir, port)

watch(routesDir, { recursive: true}, (_event, filename) => {
  if (filename && filename.endsWith(".ts")) {
    console.log("♻️ Restarting due to change in:", filename)
    process.exit(0)
  }
})