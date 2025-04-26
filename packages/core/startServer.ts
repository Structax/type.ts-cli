import { createServer } from "http"
import { parse } from "url"
import { resolveRoutes, APIHandler } from "./resolveRoutes"
import { safe } from "./safe"
import { toAPIError } from "./toAPIError"
import { z } from "zod"
import { readFileSync } from "fs"
import { join } from "path"
import { AppError } from "./defineError"

const parseBody = async (req: any): Promise<any> => {
  return new Promise((resolve) => {
    const chunks: any[] = []
    req.on("data", (chunk: any) => chunks.push(chunk))
    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString()
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

export const startServer = (routesDir: string, port = 8787): void => {
  const routes = resolveRoutes(routesDir)

  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url || "", true)
    const method = (req.method || "").toUpperCase()
    const path = (parsedUrl.pathname || "").replace(/\/+$/, "") || "/"

    const routeKey = `${method} ${path}`
    const handler = routes.get(routeKey)

    if (!handler) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Not Found" }))
      return
    }

    const input = await parseBody(req)
    const result = await safe(() => handler({ input }))

    if ("error" in result) {
      const apiError = toAPIError(result.error as AppError)
      res.writeHead(apiError.status || 500, { "Content-Type": "application/json" })
      res.end(JSON.stringify(apiError))
    } else if ("value" in result) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify(result.value))
    } else {
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Unknown result structure" }))
    }
  })

  server.listen(port, () => {
    console.log(`🟢 Type.ts server running at http://localhost:${port}`)
  })
}