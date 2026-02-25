import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import TextsGrid from "@/components/texts/texts-grid"
import { PenLine, Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MyTextsPage() {
    // JWT'den user ve profile bilgilerini al
    const user = await getCurrentUser()
    if (!user) return null;

    const supabase = await createClient()

    // Tüm yazdığı anıları getir
    const { data: rawTexts, error: textsError } = await supabase
        .from("texts")
        .select(`
      *,
      recipient_profile:recipient_id (
        first_name,
        last_name,
        class,
        school_number,
        user_year,
        deleted_at
      )
    `)
        .eq("author_id", user.id)
        .eq("is_active", true)
        .neq("recipient_id", user.id)
        .order("updated_at", { ascending: false })

    // Silinmiş profillere yazılan anıları filtrele
    const texts = rawTexts?.filter(t => t.recipient_profile && !t.recipient_profile.deleted_at) || []

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                        <PenLine className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Yazdığım Anılar</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Toplam {texts?.length || 0} arkadaşına anı bıraktın
                        </p>
                    </div>
                </div>

                <Link href="/new" prefetch={false}>
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 gap-2 h-11 px-6 rounded-xl">
                        <Plus className="h-4 w-4" />
                        Yeni Anı Yaz
                    </Button>
                </Link>
            </div>

            {/* @ts-ignore */}
            <TextsGrid texts={texts} />
        </div>
    )
}
