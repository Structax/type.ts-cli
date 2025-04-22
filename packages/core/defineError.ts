export type ErrorDefinition = {
    name: string
    message: string
    status?: number
    tags?: string[]
  }
  
  export type AppError = Error & {
    name: string
    message: string
    status: number
    tags: string[]
    context?: Record<string, unknown>
    withContext: (ctx: Record<string, unknown>) => AppError
  }
  
  export const defineError = (def: ErrorDefinition): AppError => {
    const base: AppError = {
      name: def.name,
      message: def.message,
      status: def.status ?? 500,
      tags: def.tags ?? [],
      context: undefined,
      withContext(ctx) {
        return {
          ...this,
          context: ctx,
        }
      },
    }
  
    // 明示的に prototype を設定（Error 継承対応）
    Object.setPrototypeOf(base, Error.prototype)
  
    return base
  }
  