"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        // router.back() bazı edge durumlarda boş history'de işe yaramayabilir
        if (typeof window !== "undefined" && window.history.length > 1) {
          window.history.back()
        } else {
          router.push("/")
        }
      }}
      className="group inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-white/60 dark:bg-white/5 backdrop-blur-sm px-6 py-3 text-slate-700 dark:text-slate-200 hover:scale-105 transition-all duration-300"
    >
      <ArrowLeft size={18} />
      Geri Dön
    </button>
  )
}
