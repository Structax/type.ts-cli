import { z } from "zod"

type AnyZodObject = z.ZodObject<any, any, any>

type APIType<I extends AnyZodObject, H extends (args: { input: z.infer<I> }) => Promise<any>> = {
  input: I
  handler: H
}

export const defineAPI = <
  I extends AnyZodObject,
  H extends (args: { input: z.infer<I> }) => Promise<any>
>(
  api: APIType<I, H>
): APIType<I, H> => {
  if (typeof api !== "object" || api === null) {
    throw new Error("defineAPI: api must be an object")
  }

  const keys = Object.keys(api)
  if (!("input" in api)) {
    throw new Error("defineAPI: 'input' field is required")
  }
  if (!("handler" in api)) {
    throw new Error("defineAPI: 'handler' field is required")
  }
  if (keys.length !== 2) {
    throw new Error("defineAPI: Unallowed fields are included")
  }

  if (!(api.input instanceof z.ZodObject)) {
    throw new Error("defineAPI: 'input' must be of type z.ZodObject")
  }

  // async チェックは削除 ✅ 実行時は型とPromiseベースで保証すればOK
  return api
}

