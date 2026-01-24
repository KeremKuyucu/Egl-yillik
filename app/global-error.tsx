'use client'

import { useEffect } from 'react'
import { reportErrorAction } from '@/app/actions/error-logs'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Hata meydana geldiğinde otomatik bildir
        reportErrorAction({
            message: `[CRITICAL] ${error.message}`,
            stack: `Digest: ${error.digest || 'Yok'}\n\n${error.stack || ''}`,
            pageUrl: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
            severity: 'critical'
        })
        console.error(error)
    }, [error])

    return (
        <html>
            <body className="flex flex-col items-center justify-center min-h-screen p-4 text-center font-sans">
                <div className="max-w-md w-full space-y-6">
                    <div className="text-6xl text-red-500 mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-foreground">Hay aksi, bir şeyler ters gitti!</h2>
                    <p className="text-muted-foreground">
                        Sistemde kritik bir hata oluştu. Geliştiricilerimiz bu konuda otomatik olarak bilgilendirildi.
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => reset()}
                            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-all"
                        >
                            Tekrar Dene
                        </button>
                        <a
                            href="/"
                            className="text-sm text-muted-foreground hover:underline"
                        >
                            Ana Sayfaya Dön
                        </a>
                    </div>
                </div>
            </body>
        </html>
    )
}
