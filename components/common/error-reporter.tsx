'use client'

import { useEffect, useRef } from 'react'
import { reportErrorAction } from '@/app/actions/error-logs'
import { usePathname } from 'next/navigation'

export default function ErrorReporter() {
    const pathname = usePathname()

    useEffect(() => {
        // --- 1. Orijinal console.error'u sakla ---
        const originalConsoleError = console.error

        // --- 2. console.error'u override et (Interceptor) ---
        console.error = (...args: any[]) => {
            // Orijinal hatayı konsola basmaya devam et
            originalConsoleError.apply(console, args)

            // Hata raporlama dairesel döngüsünü engelle
            const argsString = JSON.stringify(args).toLowerCase()
            if (argsString.includes('reporterroraction') || argsString.includes('error_logs')) {
                return
            }

            let message = 'Console Error'
            let stack = ''
            let severity: 'error' | 'warning' | 'critical' = 'error'
            let foundError = false

            // Tüm argümanları tara (Supabase hatası genelde 2. argüman olabilir: console.error('Hata:', error))
            for (const arg of args) {
                if (arg && typeof arg === 'object') {
                    // Supabase hata objesi kontrolü (PostgrestError)
                    if (arg.code && arg.message && (arg.details !== undefined || arg.hint !== undefined)) {
                        message = `[DB] ${arg.code}: ${arg.message}`
                        stack = `Details: ${arg.details || 'None'}\nHint: ${arg.hint || 'None'}`
                        // Eğer ek metin varsa (örn: 'Feedback insert error:'), onu da başına ekle
                        if (args[0] !== arg && typeof args[0] === 'string') {
                            message = `${args[0]} -> ${message}`
                        }
                        foundError = true
                        break
                    } else if (arg instanceof Error) {
                        message = arg.message
                        stack = arg.stack || ''
                        foundError = true
                        break
                    }
                }
            }

            if (!foundError) {
                message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }

            // Gereksiz rapor kalabalığını engelle (Örn: Hydration warnings)
            if (message.includes('Hydration') || message.includes('react-dom') || message.includes('Minified React error')) return

            reportErrorAction({
                message: `[CONSOLE] ${message}`,
                stack: stack,
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                severity: severity
            })
        }

        // --- 3. Standart Runtime Hataları ---
        const handleError = (event: ErrorEvent) => {
            if (event.message?.includes('reportErrorAction')) return

            reportErrorAction({
                message: `[RUNTIME] ${event.message}`,
                stack: `File: ${event.filename}:${event.lineno}:${event.colno}\n\n${event.error?.stack || ''}`,
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                severity: 'error'
            })
        }

        // --- 4. Promise Redleri (Async hatalar) ---
        const handleRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason
            reportErrorAction({
                message: `[PROMISE] ${reason?.message || reason || 'Bilinmeyen Hata'}`,
                stack: reason?.stack || '',
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                severity: 'error'
            })
        }

        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleRejection)

        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleRejection)
            console.error = originalConsoleError
        }
    }, [pathname])

    return null
}
