/**
 * Bir promise'e timeout ekler
 * @param promise - Beklenecek promise
 * @param timeoutMs - Timeout süresi (ms)
 * @param fallback - Timeout olduğunda döndürülecek değer (opsiyonel)
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallback?: T
): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) => {
        setTimeout(() => {
            if (fallback !== undefined) {
                // Fallback varsa resolve et
                (_ as any)(fallback)
            } else {
                reject(new Error(`Request timed out after ${timeoutMs}ms`))
            }
        }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
}

/**
 * Retry ile birlikte timeout
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number
        timeoutMs?: number
        delayMs?: number
    } = {}
): Promise<T> {
    const { maxRetries = 2, timeoutMs = 5000, delayMs = 500 } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await withTimeout(fn(), timeoutMs)
        } catch (error) {
            lastError = error as Error
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs))
            }
        }
    }

    throw lastError
}
