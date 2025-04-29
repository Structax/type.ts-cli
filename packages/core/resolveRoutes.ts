import { readdirSync, statSync } from "fs"
import { join, resolve } from "path"
import { z } from "zod"
export type APIHandler<Input, Output> = (args: { input: Input }) => Promise<Output>

export type API<Input, Output> = {
  input: z.ZodType<Input>
  handler: APIHandler<Input, Output>
}

export const resolveRoutes = (baseDir: string): Map<string, API<unknown, unknown>> => {
  const routes = new Map<string, API<unknown, unknown>>()

  const walk = async (dir: string) => {
    for (const file of readdirSync(dir)) {
      const fullPath = join(dir, file)
      const stats = statSync(fullPath)

      if (stats.isDirectory()) {
        walk(fullPath)
      } else if (file.match(/\.(get|post|put|delete)\.ts$/)) {
        const methodMatch = file.match(/\.(get|post|put|delete)\.ts$/)
        const method = methodMatch ? methodMatch[1].toUpperCase() : ""
        const relativePath = fullPath
          .replace(baseDir, "")
          .replace(/\\/g, "/")
          .replace(/\.(get|post|put|delete)\.ts$/, "")
          .replace(/\[([^\]]+)\]/g, ":$1")
        const routePath = relativePath === "" ? "/" : relativePath

        const mod = await import("file://" + fullPath)
        const api = mod.api

        if (!api?.input || !api?.handler) {
          throw new Error(`Invalid API structure in ${fullPath}`)
        }

        const key = `${method} ${routePath}`
        routes.set(key, { input: api.input, handler: api.handler })
      }
    }
  }

  walk(resolve(baseDir))
  return routes
}