import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { serverLogger } from "../logger"

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore errors from Server Components
        }
      },
    },
  })

  // Proxy to intercept errors from supabase calls
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      // Only proxy 'from' and 'rpc' which are functions
      if ((prop === 'from' || prop === 'rpc') && typeof value === 'function') {
        return (...args: any[]) => {
          const result = value.apply(target, args)

          // Infinite loop protection
          if (prop === 'from' && args[0] === 'error_logs') {
            return result
          }

          if (result && typeof result.then === 'function') {
            const originalThen = result.then
            result.then = (onFulfilled?: any, onRejected?: any) => {
              return originalThen.call(result, async (res: any) => {
                if (res && res.error) {
                  await serverLogger({
                    message: `Supabase ${String(prop)} error`,
                    stack: JSON.stringify(res.error),
                    severity: 'error'
                  })
                }
                return onFulfilled ? onFulfilled(res) : res
              }, onRejected)
            }
          }

          return result
        }
      }

      // For 'auth', it's an object, not a function. Let's return it as is for now to avoid the reported error.
      return value
    }
  })
}
