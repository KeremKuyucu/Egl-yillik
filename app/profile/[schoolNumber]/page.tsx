import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

type Params = {
  schoolNumber: string
}

export default async function LegacyProfileRedirectPage({
  params,
}: {
  params: Params
}) {
  const schoolNumber = decodeURIComponent(params.schoolNumber).trim()

  if (!schoolNumber) notFound()

  const supabase = await createClient()

  // Aynı school_number farklı yıllarda varsa en güncel yılı seç
  const { data, error } = await supabase
    .from("profiles")
    .select("user_year")
    .eq("school_number", schoolNumber)
    .order("user_year", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    // İstersen burada log da basabilirsin
    notFound()
  }

  const year = data?.user_year

  // user_year null kalabiliyorsa (eski kayıtlar vs) burada karar ver:
  // - notFound() => 404
  // - redirect(`/profile/latest/${schoolNumber}`) gibi bir fallback
  if (!year) notFound()

  redirect(`/profile/${year}/${encodeURIComponent(schoolNumber)}`)
}
