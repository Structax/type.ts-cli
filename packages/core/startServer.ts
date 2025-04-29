import { createServer } from "http"
import { parse } from "url"
import { resolveRoutes, APIHandler } from "./resolveRoutes"
import { isErr, isOk, safe } from "./safe"
import { toAPIError } from "./toAPIError"
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
    const api = routes.get(routeKey)
    if (!handler) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ ok: false, error: { message: "Not Found" } }))
      return
    }
if (!api) {
  res.writeHead(404, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ ok: false, error: { message: "Not Found" } }))
  return
}
    const input = await parseBody(req)

    const validation = safe(() => {
      if ('input' in api) {
        return (api as any).input.parse(input)
      }
      throw new Error("API handler does not have an 'input' property")
    })
    const validationResult = await validation
    if (isOk(validationResult)) {
      const result = await safe(() => api.handler({ input: validationResult.value }))
      
      if (isErr(result)) {
        const apiError = toAPIError(result.error as AppError)
        res.writeHead(apiError.status || 500, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: apiError }))
      } else {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: true, data: result.value }))
      }
    } else {
      const apiError = toAPIError(validationResult.error as AppError)
      res.writeHead(apiError.status || 400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ ok: false, error: apiError }))
    }
    if (isErr(validationResult)) {
      const apiError = toAPIError(validationResult.error as AppError)
      res.writeHead(apiError.status || 400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ ok: false, error: apiError }))
      return
    }
  })

  server.listen(port, () => {
    console.log(`🟢 Type.ts server running at http://localhost:${port}`)
  })
}