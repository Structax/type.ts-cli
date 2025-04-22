import { readdirSync, statSync } from "fs"
import { join, extname, basename, relative, sep, resolve } from "path" // ← ✅ resolve を追加！

export type RouteEntry = {
  filePath: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
}

const METHOD_SUFFIXES = [".get.ts", ".post.ts", ".put.ts", ".delete.ts"] as const
const METHOD_MAP = {
  ".get.ts": "GET",
  ".post.ts": "POST",
  ".put.ts": "PUT",
  ".delete.ts": "DELETE",
} as const

export const resolveRoutes = (baseDir: string): RouteEntry[] => {
  const entries: RouteEntry[] = []

  const walk = (dir: string) => {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stats = statSync(fullPath)

      if (stats.isDirectory()) {
        walk(fullPath)
        continue
      }

      for (const suffix of METHOD_SUFFIXES) {
        if (item.endsWith(suffix)) {
          const method = METHOD_MAP[suffix]
          const relativePath = relative(baseDir, fullPath)
          const noExt = relativePath.slice(0, -suffix.length)
          const segments = noExt.split(sep).map(segment =>
            segment.startsWith("[") && segment.endsWith("]")
              ? `:${segment.slice(1, -1)}`
              : segment
          )
          const routePath = "/" + segments.join("/")

          entries.push({
            filePath: resolve(fullPath), // ← ✅ 絶対パスに修正
            method,
            path: routePath,
          })
          break
        }
      }
    }
  }

  walk(baseDir)
  return entries
}
