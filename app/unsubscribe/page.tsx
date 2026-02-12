import { unsubscribeWithToken } from "@/lib/unsubscribe"

export const runtime = "nodejs" // jsonwebtoken/crypto Edge'te sorun çıkarabilir :contentReference[oaicite:1]{index=1}

type PageProps = {
    searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
    const sp = await searchParams
    const token = sp.token

    if (!token) {
        return (
            <main className="mx-auto max-w-xl px-4 py-16">
                <h1 className="text-2xl font-semibold">Geçersiz bağlantı</h1>
                <p className="mt-2 text-muted-foreground">
                    Bu bağlantıda gerekli bilgi yok.
                </p>
            </main>
        )
    }

    const res = await unsubscribeWithToken(token)

    if (!res.ok) {
        const msg =
            res.reason === "INVALID_OR_EXPIRED"
                ? "Bağlantı geçersiz veya süresi dolmuş."
                : res.reason === "DB_ERROR"
                    ? "İşlem sırasında bir hata oluştu."
                    : "Geçersiz bağlantı."

        return (
            <main className="mx-auto max-w-xl px-4 py-16">
                <h1 className="text-2xl font-semibold">İşlem tamamlanamadı</h1>
                <p className="mt-2 text-muted-foreground">{msg}</p>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-xl px-4 py-16">
            <h1 className="text-2xl font-semibold">E-posta listesinden çıkarıldınız</h1>
            <p className="mt-2 text-muted-foreground">
                Artık hatırlatma e-postaları almayacaksınız.
            </p>
        </main>
    )
}
