import { createBrowserClient } from "@supabase/ssr"
import { reportErrorAction } from "@/app/actions/error-logs"

export function createClient() {
  const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Proxy to intercept errors from any supabase call in the browser
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

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
                  // Browser-side silent error reporting
                  reportErrorAction({
                    message: `[BROWSER DB] ${String(prop)} error`,
                    stack: JSON.stringify(res.error),
                    pageUrl: window.location.href,
                    userAgent: navigator.userAgent,
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

      return value
    }
  })
}
