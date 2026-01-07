"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function PrintButton() {
    return (
        <Button
            onClick={() => window.print()}
            className="gap-2 shadow-lg hover:scale-105 transition-transform font-semibold bg-white text-slate-900 hover:bg-slate-100"
        >
            <Printer className="h-4 w-4" />
            Yazdır / PDF Kaydet
        </Button>
    )
}