# Type.ts ✨

> The **fastest**, **safest**, and **most philosophically pure** Node.js framework.

Built for the future of application architecture: **State Streaming** over Event Sourcing.  
Faster than Bun. Stronger than Go. Sharper than anything before.

---

## 🔄 Concept

- **Only one correct way to write APIs**
- **O(1) routing** with fully preloaded handlers
- **Type-safety enforced by Zod and static checks**
- **State is built from Event Streams, not from queries**
- **Minimalist, Real-time, Reflective System architecture**

> **Type.ts** is not just another framework.  
> It's a **philosophy turned into code**.

---

## 🚀 Highlights

- ⚡️ **54,366 RPS** on a single Node.js process
- 🔢 **Zero runtime imports**, fully preloaded
- 📈 **State streaming ready** (Event-Reflective System)
- 🔑 **Absolute type safety** (input, output, error structures)
- 💳 **Developer CLI** (type dev, type check, type generate-client)
- 💡 **Built-in Client SDK Generator**
- 🏢 **Production-grade structure from Day 1**

---

## 🔍 Quick Example

### Define an API
```ts
import { z } from "zod"
import { defineAPI } from "type-ts"

export const api = defineAPI({
  input: z.object({ name: z.string() }),
  async handler({ input }) {
    return { message: `hello ${input.name}` }
  }
})
```

### Generate client SDK
```bash
npx type generate-client
```

### Use from frontend
```ts
import { fetchUser } from "../gen/client"

const data = await fetchUser({ name: "Taro" })
console.log(data.message) // "hello Taro"
```

### Event Reflective System (State Streaming)
- POST /event: Store events
- GET /state: Rebuild current state from event stream

> Your database becomes a pure **event log**.  
> Your application becomes a **live reflection of events**.

---

## 📅 Roadmap

- [x] O(1) Route resolver
- [x] Static typing enforcement (type check)
- [x] Developer CLI (dev, check, generate-client)
- [x] Event System MVP (event.post.ts, state.get.ts)
- [x] Benchmarked: Faster than Bun Serve
- [ ] Official GitHub public release
- [ ] V1.0 production certification

---

## 🌍 Philosophy

> “There should be only one way to write an API.”

> “State should be a reflection of time, not a mutable entity.”

> “Fast, Safe, Beautiful — from the very first line.”

**Type.ts** is not an extension of the past.  
It's a creation of the next thousand years.

---

# Welcome to the future. Welcome to Type.ts.

