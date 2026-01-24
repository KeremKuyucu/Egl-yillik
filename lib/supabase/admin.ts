import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { serverLogger } from "../logger"

// Service Role Key ile admin client oluşturur
// DİKKAT: Bu client sadece sunucu tarafında kullanılmalıdır!
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set")
    }

    const client = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    // Proxy to intercept errors from any supabase call
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
                                    await serverLogger({
                                        message: `AdminSupabase ${String(prop)} error`,
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

            return value
        }
    })
}
