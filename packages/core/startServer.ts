import { createServer } from "http"
import { parse as parseUrl } from "url"
import type { AppError } from "./defineError"
import { resolveRoutes, RouteEntry } from "./resolveRoutes"
import { toAPIError } from "./toAPIError"
import { isOk,isErr,safe } from "./safe"
 const matchPath = (pattern: string, actual: string): null | Record<string, string> => {
  const patternParts = pattern.split("/")
  const actualParts = actual.split("/")

  if (patternParts.length !== actualParts.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i]
    const a = actualParts[i]

    if (p.startsWith(":")) {
      params[p.slice(1)] = a
    } else if (p !== a) {
      return null
    }
  }

  return params
}

export const startServer = (routesDir: string, port = 3000): void => {
  const routes = resolveRoutes(routesDir)

  const server = createServer(async (req, res) => {
    const method = req.method?.toUpperCase()
    const parsed = parseUrl(req.url || "", true)
    const path = parsed.pathname
    const query = parsed.query

    if (!method || !path) {
      res.writeHead(400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Invalid request" }))
      return
    }

    let matchedRoute = null
    let params: Record<string, string> = {}

    for (const route of routes) {
      if (method === route.method) {
        const matchedParams = matchPath(route.path, path)
        if (matchedParams) {
          matchedRoute = route
          params = matchedParams
          break
        }
      }
    }

    if (!matchedRoute) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Not Found" }))
      return
    }

    const mod = await import(matchedRoute.filePath)
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

    const input = method === "GET"
      ? { ...params, ...query }
      : { ...params, ...json }

    const parsedInput = api.input.safeParse(input)
    if (!parsedInput.success) {
      res.writeHead(400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Invalid input", issues: parsedInput.error.issues }))
      return
    }
    const result = await safe(() => api.handler({ input: parsedInput.data }))
    if (isErr(result)) {
      const err = result.error as AppError
      const serialized = toAPIError(err)
      res.writeHead(serialized.status, { "Content-Type": "application/json" })
      res.end(JSON.stringify(serialized))
      return
    }
    if (isOk(result))
    { res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify(result.value))
    return}
  })

  server.listen(port, () => {
    console.log(`🟢 Type.ts server running at http://localhost:${port}`)
  })
}