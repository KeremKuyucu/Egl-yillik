import { createClient } from "@/lib/supabase/server"
import { Quote, School, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PrintActions from "@/components/print-actions"
import Image from "next/image"
import { ROLES } from "@/lib/constants"

export default async function PrintPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    if (!id || id === 'undefined' || id === 'null') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive">
                <h1 className="text-2xl font-bold">Hata: Geçersiz Kimlik</h1>
                <Link href="/dashboard" className="mt-4 underline">Panele Dön</Link>
            </div>
        )
    }

    const supabase = await createClient()

    // --- YETKİ KONTROLÜ ---
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive">
                <h1 className="text-2xl font-bold">Lütfen giriş yapın.</h1>
                <Link href="/login" className="mt-4 underline">Giriş Yap</Link>
            </div>
        )
    }

    const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    const { data: targetText, error: textError } = await supabase
        .from("texts")
        .select("recipient_id")
        .eq("id", id)
        .single()

    if (textError || !targetText) {
        return <div className="p-10 text-center">Metin bulunamadı.</div>
    }

    const recipientId = targetText.recipient_id

    // Sadece adminler veya alıcının kendisi görebilir
    const isAdmin = (currentUserProfile?.level || 0) >= ROLES.ADMIN
    const isRecipient = user.id === recipientId

    if (!isAdmin && !isRecipient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive p-4 text-center">
                <h1 className="text-2xl font-bold font-serif mb-2">Yetkisiz Erişim</h1>
                <p className="text-muted-foreground mb-6">Bu sayfayı görüntüleme yetkiniz bulunmuyor.</p>
                <Link href="/dashboard">
                    <Button variant="outline">Panele Dön</Button>
                </Link>
            </div>
        )
    }

    const { data: recipient } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", recipientId)
        .single()

    if (!recipient) return <div className="p-10 text-center">Öğrenci bulunamadı.</div>

    const { data: texts } = await supabase
        .from("texts")
        .select(`
      id,
      content,
      created_at,
      author:profiles!texts_author_id_fkey (
        first_name,
        last_name,
        class
      )
    `)
        .eq("recipient_id", recipientId)
        .order("created_at", { ascending: false })

    return (
        <div className="min-h-screen bg-zinc-950 p-8 print:p-0 flex flex-col items-center">

            {/* --- TARAYICI VE BASKI AYARLARI --- */}
            <style>{`
        @page {
          size: A4;
          margin: 20mm;
        }
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          table { width: 100%; table-layout: fixed; }
        }
      `}</style>

            {/* --- KONTROL PANELİ (Çıktıda Gizlenir) --- */}
            <div className="w-full max-w-[210mm] mb-8 print:hidden flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="text-sm text-zinc-400">
                        <span className="font-bold text-white block text-lg">{recipient.first_name} {recipient.last_name}</span>
                        <span>Yıllık Önizlemesi</span>
                    </div>
                </div>

                <PrintActions />
            </div>

            {/* --- A4 KAĞIT ALANI --- */}
            <div className="print-container w-[210mm] min-h-[297mm] bg-white shadow-2xl font-serif text-slate-900 relative p-[20mm] print:p-0">

                <table className="w-full border-collapse">

                    {/* HEADER */}
                    <thead>
                        <tr>
                            <td className="pt-0">
                                <div className="border-b-4 border-slate-800 pb-4 mb-6 flex justify-between items-start">
                                    <div className="relative z-10">
                                        <h1 className="text-5xl font-black tracking-tight text-slate-900 uppercase leading-none">
                                            {recipient.first_name} <br />
                                            <span className="text-slate-700">{recipient.last_name}</span>
                                        </h1>
                                        <div className="flex items-center gap-3 mt-4 text-slate-700 font-bold">
                                            <span className="flex items-center gap-1.5 bg-slate-200 px-3 py-1 rounded-md border-2 border-slate-300 text-sm print:bg-transparent print:border-slate-800">
                                                <School className="h-4 w-4" />
                                                {recipient.class}
                                            </span>
                                            <span className="text-sm tracking-widest font-black border-l-2 pl-3 border-slate-800">
                                                NO: {recipient.school_number}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="mb-2 opacity-80 mix-blend-multiply md:w-32 w-24">
                                            <Image src="/image.png" alt="Logo" width={150} height={150} className="object-contain" />
                                        </div>
                                        <div>
                                            <div className="text-4xl font-black text-slate-400 print:text-slate-600 leading-none">2026</div>
                                            <div className="text-[10px] text-slate-500 print:text-slate-700 uppercase tracking-[0.3em] font-bold mt-1">Mezuniyet Yıllığı</div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </thead>

                    {/* İÇERİK (Body) */}
                    <tbody>
                        <tr>
                            <td className="align-top p-0">
                                <div className="columns-1 md:columns-2 gap-8 space-y-8 print:block print:columns-2 px-1">
                                    {texts && texts.length > 0 ? (
                                        texts.map((text: any, index: number) => {
                                            const author = Array.isArray(text.author) ? text.author[0] : text.author;
                                            const authorName = author ? `${author.first_name} ${author.last_name}` : "Anonim";
                                            const authorClass = author?.class || "";
                                            const isTargetText = text.id === id;

                                            return (
                                                <div key={index} className={`break-inside-avoid mb-8 group ${isTargetText ? 'print:relative' : ''}`}>
                                                    <div className={`relative p-5 rounded-xl border-2 transition-all
                            ${isTargetText
                                                            ? 'border-slate-600 bg-slate-50 shadow-md print:border-slate-900 print:bg-transparent print:shadow-none'
                                                            : 'border-slate-200 bg-white print:border-slate-300 print:bg-transparent'
                                                        }`}>

                                                        <Quote className="absolute -top-3 -left-2 h-6 w-6 text-slate-400 bg-white rounded-full p-1 border-2 border-slate-200 print:hidden" />

                                                        <p className="text-slate-900 text-[13px] leading-6 font-medium italic text-justify">
                                                            "{text.content}"
                                                        </p>

                                                        <div className="mt-3 pt-3 border-t-2 border-slate-100 flex justify-between items-end">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-xs text-slate-900 uppercase">
                                                                    — {authorName}
                                                                </span>
                                                                {authorClass && (
                                                                    <span className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
                                                                        {authorClass}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase tracking-widest">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                {new Date(text.created_at).toLocaleDateString("tr-TR")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="col-span-2 text-center py-20 border-4 border-dashed border-slate-200 rounded-xl">
                                            <p className="text-slate-500 italic">Henüz anı yok.</p>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tbody>

                    {/* FOOTER */}
                    <tfoot>
                        <tr>
                            <td className="p-0">
                                <div className="h-10" />
                                <div className="border-t-2 border-slate-200 pt-2 text-center w-full pb-0">
                                    <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
                                        Ertuğrulgazi Lisesi • 2026 Hatıra Defteri
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* Filigran */}
                <div className="fixed top-4 right-4 w-[200px] h-[200px] bg-slate-100 print:bg-slate-200 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 opacity-50 print:opacity-40 pointer-events-none" />
                <div className="fixed bottom-4 left-4 w-[300px] h-[300px] bg-slate-50 print:bg-slate-100 rounded-full translate-y-1/3 -translate-x-1/3 -z-10 opacity-50 print:opacity-40 pointer-events-none" />

            </div>
        </div>
    )
}