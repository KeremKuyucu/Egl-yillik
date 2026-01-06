import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Quote, School, Calendar, Printer } from "lucide-react"

export default async function PrintPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    // Güvenlik: ID Kontrolü
    if (!id || id === 'undefined' || id === 'null') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-red-600">
                <h1 className="text-2xl font-bold">Hata: Geçersiz Kimlik</h1>
            </div>
        )
    }

    const supabase = await createClient()

    // 1. Öğrenci Bilgisini Çek
    const { data: recipient, error: recipientError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single()

    if (recipientError || !recipient) {
        return <div className="p-10 text-center">Öğrenci bulunamadı.</div>
    }

    // 2. Anıları Çek
    const { data: texts } = await supabase
        .from("texts")
        .select(`
      content,
      created_at,
      author:profiles!texts_author_id_fkey (
        first_name,
        last_name,
        class
      )
    `)
        .eq("recipient_id", id)
        .order("created_at", { ascending: false })

    return (
        <div className="min-h-screen bg-slate-100/50 p-8 print:p-0 flex flex-col items-center">

            {/* ÜST KONTROL PANELİ (Çıktıda GİZLENİR 'print:hidden') */}
            <div className="w-full max-w-[210mm] mb-6 print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">{recipient.first_name} {recipient.last_name}</span> önizlemesi.
                </div>

                {/* BASİT YAZDIR BUTONU */}
                {/* Bu buton tarayıcının yazdırma penceresini açar. Kullanıcı oradan "PDF Olarak Kaydet" seçebilir. */}
                <button
                    // @ts-ignore
                    onClick="window.print()"
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-md font-medium text-sm"
                >
                    <Printer className="h-4 w-4" />
                    Yazdır / PDF Kaydet
                </button>
            </div>

            {/* --- A4 KAĞIT ALANI --- */}
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none p-12 print:p-0 relative overflow-hidden text-slate-900">

                {/* Dekoratif Arka Plan */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 print:opacity-50" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full translate-y-1/3 -translate-x-1/3 -z-10 print:opacity-50" />

                {/* Başlık */}
                <header className="border-b-2 border-slate-900 pb-6 mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold font-serif tracking-tight text-slate-900 uppercase">
                            {recipient.first_name} {recipient.last_name}
                        </h1>
                        <div className="flex items-center gap-4 mt-3 text-slate-600 font-medium">
                            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                                <School className="h-4 w-4" />
                                {recipient.class}
                            </span>
                            <span className="text-sm tracking-widest">#{recipient.school_number}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-serif font-bold text-slate-300">2026</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Mezuniyet Yıllığı</div>
                    </div>
                </header>

                {/* İçerik / Anılar (Columns ile Masonry Düzeni) */}
                <div className="columns-1 md:columns-2 gap-6 space-y-6">
                    {texts && texts.length > 0 ? (
                        texts.map((text: any, index: number) => {
                            const author = Array.isArray(text.author) ? text.author[0] : text.author;

                            return (
                                <div key={index} className="break-inside-avoid mb-6">
                                    <div className="relative bg-slate-50/40 p-6 rounded-xl border border-slate-100 print:border-slate-200">
                                        <Quote className="absolute -top-3 -left-2 h-6 w-6 text-slate-300 bg-white rounded-full p-1 border border-slate-100" />

                                        <p className="text-slate-800 text-[13px] leading-relaxed font-serif italic relative z-10 text-justify">
                                            "{text.content}"
                                        </p>

                                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-900">
                                                    {author ? `${author.first_name} ${author.last_name}` : "Anonim"}
                                                </span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                                                    {author?.class || "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                                <Calendar className="h-2.5 w-2.5" />
                                                {new Date(text.created_at).toLocaleDateString("tr-TR")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="col-span-2 text-center py-20 border-2 border-dashed border-slate-100 rounded-xl">
                            <p className="text-slate-400 italic font-serif">
                                Henüz bu yıllığa yazılmış bir anı bulunmamaktadır.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="absolute bottom-6 left-0 right-0 text-center">
                    <div className="inline-block border-t border-slate-100 pt-2">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">Ertuğrulgazi Lisesi • Hatıra Defteri</p>
                    </div>
                </footer>
            </div>

            {/* Client Side Script: Buton Tıklaması için */}
            <script dangerouslySetInnerHTML={{
                __html: `
        document.querySelector('button').addEventListener('click', () => window.print());
      `}} />
        </div>
    )
}