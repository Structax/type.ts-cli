import { createServer } from "http"
import { parse as parseUrl } from "url"
import { readFileSync } from "fs"
import { join, extname } from "path"
import { z } from "zod"
import type { AppError } from "./defineError"
import { resolveRoutes, RouteEntry } from "./resolveRoutes"
import { toAPIError } from "./toAPIError"
import { safe } from "./safe"

export const startServer = (routesDir: string, port = 3000): void => {
  const routes = resolveRoutes(routesDir)

  const server = createServer(async (req, res) => {
    const method = req.method?.toUpperCase()
    const parsed = parseUrl(req.url || "", true)
    const path = parsed.pathname

    const match = routes.find(route => route.method === method && route.path === path)

    if (!match) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Not Found" }))
      return
    }

    const mod = await import(match.filePath)
    const api = mod.api

    if (!api || !api.input || !api.handler) {
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Invalid API structure" }))
      return
    }

    const buffers: Uint8Array[] = []
    for await (const chunk of req) {
      buffers.push(chunk)
    }

    const body = Buffer.concat(buffers).toString()
    const json = body ? JSON.parse(body) : {}

    const parsedInput = api.input.safeParse(json)
    if (!parsedInput.success) {
      res.writeHead(400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Invalid input", issues: parsedInput.error.issues }))
      return
    }

    const result = await safe(() => api.handler({ input: parsedInput.data }))

    if ("isErr" in result && result.isErr) {
        const err = result.error as AppError
        const serialized = toAPIError(err)
        res.writeHead(serialized.status, { "Content-Type": "application/json" })
        res.end(JSON.stringify(serialized))
        return
      
    }

    if ("isOk" in result && result.isOk) {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify(result.value)) // エラー消える
      }
  })

  server.listen(port, () => {
    console.log(`🟢 Type.ts server running at http://localhost:${port}`)
  })
}
