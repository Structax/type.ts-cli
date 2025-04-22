import type { AppError } from "./defineError"

export type APIErrorObject = {
  name: string
  message: string
  status: number
  context?: Record<string, unknown>
}

export const toAPIError = (error: AppError): APIErrorObject => {
  return {
    name: error.name,
    message: error.message,
    status: error.status,
    context: error.context ?? {},
  }
}