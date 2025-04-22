export type Result<T> =
  | { isOk: true; value: T }
  | { isErr: true; error: unknown }

export const safe = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
  try {
    const value = await fn()
    return { isOk: true, value }
  } catch (error: unknown) {
    return { isErr: true, error }
  }
}
