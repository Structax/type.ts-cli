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
    throw new Error("defineAPI: api はオブジェクトである必要があります")
  }

  const keys = Object.keys(api)
  if (!("input" in api)) {
    throw new Error("defineAPI: 'input' フィールドが必要です")
  }
  if (!("handler" in api)) {
    throw new Error("defineAPI: 'handler' フィールドが必要です")
  }
  if (keys.length !== 2) {
    throw new Error("defineAPI: 許可されていないフィールドが含まれています")
  }

  if (!(api.input instanceof z.ZodObject)) {
    throw new Error("defineAPI: 'input' は z.ZodObject 型である必要があります")
  }

  // async チェックは削除 ✅ 実行時は型とPromiseベースで保証すればOK
  return api
}

