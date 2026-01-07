"use client"

import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"

export default function PrintActions() {

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="flex items-center gap-2">
            {/* Yazdırma Butonu */}
            <Button
                onClick={handlePrint}
                variant="secondary"
                className="gap-2 shadow-sm bg-white/10 hover:bg-white/20 text-zinc-100 border border-white/10"
            >
                <Printer className="h-4 w-4" />
                Yazdır
            </Button>

            {/* İndirme Butonu (Tarayıcı yazdırma penceresini açar) */}
            <Button
                onClick={handlePrint}
                className="gap-2 shadow-lg hover:scale-105 transition-transform font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                title="PDF olarak kaydetmek için açılan pencerede hedefi 'PDF Olarak Kaydet' seçin."
            >
                <Download className="h-4 w-4" />
                PDF İndir
            </Button>
        </div>
    )
}