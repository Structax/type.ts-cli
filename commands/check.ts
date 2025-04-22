import { Project, SyntaxKind, Node, ExportAssignment } from "ts-morph"
import { join, resolve } from "path"
import { readdirSync, statSync } from "fs"

const ROUTES_DIR = resolve("examples/routes")

const violations: string[] = []

const walkFiles = (dir: string): string[] => {
  const files: string[] = []
  for (const file of readdirSync(dir)) {
    const fullPath = join(dir, file)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      files.push(...walkFiles(fullPath))
    } else if (file.endsWith(".ts")) {
      files.push(fullPath)
    }
  }
  return files
}

const checkFile = (filePath: string): void => {
  const project = new Project()
  const source = project.addSourceFileAtPath(filePath)

  const exportStatements = source.getExportedDeclarations()
  const hasDefaultExport = source.getExportAssignments().some((a: { isExportEquals: () => boolean }) => a.isExportEquals() === false)
  const namedExports = Array.from(exportStatements.keys())

  if (hasDefaultExport) {
    violations.push(`❌ [${filePath}] default export は使用禁止です`)
  }

  if (!namedExports.includes("api")) {
    violations.push(`❌ [${filePath}] 'export const api = { ... }' が存在しません`)
    return
  }

  if (namedExports.length !== 1) {
    violations.push(`❌ [${filePath}] 'api' 以外の export が存在しています: ${namedExports.join(", ")}`)
  }

  const apiDecls = exportStatements.get("api")
  const apiVar = apiDecls?.[0]?.getParent()

  if (!Node.isVariableStatement(apiVar)) return

  const obj = apiVar.getDeclarations()[0]
    .getFirstDescendantByKind(SyntaxKind.ObjectLiteralExpression)

  if (!obj) {
    violations.push(`❌ [${filePath}] api の値がオブジェクトではありません`)
    return
  }

  const inputProp = obj.getProperty("input")
  const handlerProp = obj.getProperty("handler")

  if (!inputProp) {
    violations.push(`❌ [${filePath}] api.input が定義されていません`)
  } else {
    const initializer = (inputProp as any).getInitializer()
    const text = initializer?.getText()
    if (!text?.startsWith("z.object") && !text?.includes("ZodObject")) {
      violations.push(`❌ [${filePath}] api.input は z.object または ZodObject である必要があります`)
    }
  }

  if (!handlerProp) {
    violations.push(`❌ [${filePath}] api.handler が定義されていません`)
  } else {
    const initializer = (handlerProp as any).getInitializer()
    const isAsync = initializer?.isAsync?.()
    const params = initializer?.getParameters?.()
    const firstParam = params?.[0]?.getName?.()

    if (!isAsync) {
      violations.push(`❌ [${filePath}] api.handler は async 関数である必要があります`)
    }
    if (firstParam !== "{ input }" && firstParam !== "args") {
      violations.push(`❌ [${filePath}] api.handler の引数は { input } である必要があります`)
    }
  }
}

const files = walkFiles(ROUTES_DIR)
for (const file of files) {
  checkFile(file)
}

if (violations.length > 0) {
  console.error("\n🚨 Type.ts Structural Check Failed:")
  for (const v of violations) console.error(v)
  process.exit(1)
} else {
  console.log("✅ All routes passed Type.ts structural check")
}