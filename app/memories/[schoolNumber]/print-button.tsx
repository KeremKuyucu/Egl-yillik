"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
    return (
        <Button
            onClick={() => window.print()}
            variant="outline"
            className="mt-4 print:hidden"
        >
            <Printer className="mr-2 h-4 w-4" />
            Yazdır / PDF Kaydet
        </Button>
    )
}
