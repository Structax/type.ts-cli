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
    violations.push(`❌ [${filePath}] Default exports are not allowed`)
  }

  if (!namedExports.includes("api")) {
    violations.push(`❌ [${filePath}] 'export const api = { ... }' is missing`)
    return
  }

  if (namedExports.length !== 1) {
    violations.push(`❌ [${filePath}] Exports other than 'api' are present: ${namedExports.join(", ")}`)
  }

  const apiDecls = exportStatements.get("api")
  const apiVar = apiDecls?.[0]?.getParent()

  if (!Node.isVariableStatement(apiVar)) return

  const obj = apiVar.getDeclarations()[0]
    .getFirstDescendantByKind(SyntaxKind.ObjectLiteralExpression)

  if (!obj) {
    violations.push(`❌ [${filePath}] The value of api is not an object`)
    return
  }

  const inputProp = obj.getProperty("input")
  const handlerProp = obj.getProperty("handler")

  if (!inputProp) {
    violations.push(`❌ [${filePath}] api.input is not defined`)
  } else {
    const initializer = (inputProp as any).getInitializer()
    const text = initializer?.getText()
    if (!text?.startsWith("z.object") && !text?.includes("ZodObject")) {
      violations.push(`❌ [${filePath}] api.input must be a z.object or ZodObject`)
    }
  }

  if (!handlerProp) {
    violations.push(`❌ [${filePath}] api.handler is not defined`)
  } else {
    const initializer = (handlerProp as any).getInitializer()
    const isAsync = initializer?.isAsync?.()
    const params = initializer?.getParameters?.()
    const firstParam = params?.[0]?.getName?.()

    if (!isAsync) {
      violations.push(`❌ [${filePath}] api.handler must be an async function`)
    }
    if (firstParam !== "{ input }" && firstParam !== "args") {
      violations.push(`❌ [${filePath}] api.handler's argument must be { input } or args`)
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