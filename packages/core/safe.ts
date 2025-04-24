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
export const isOk = <T>(result: Result<T>): result is { isOk: true; value: T } => {
  return 'isOk' in result && result.isOk === true
}

export const isErr = <T>(result: Result<T>): result is { isErr: true; error: unknown } => {
  return 'isErr' in result && result.isErr === true
}