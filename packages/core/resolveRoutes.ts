import { readdirSync, statSync } from "fs"
import { join, resolve } from "path"

export type APIHandler = (input: any) => Promise<any>

export const resolveRoutes = (baseDir: string): Map<string, APIHandler> => {
  const routes = new Map<string, APIHandler>()

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

        // ここでimportしてhandlerを取り出す
        const mod = await import(fullPath)
        const api = mod?.api

        if (!api || typeof api.handler !== "function") {
          console.warn(`Skipping invalid API structure in ${fullPath}`)
          continue
        }

        const key = `${method} ${routePath}`
        routes.set(key, api.handler)
      }
    }
  }

  walk(resolve(baseDir))
  return routes
}