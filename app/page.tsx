// app/page.tsx
import { createClient } from "@/lib/supabase/client"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    redirect("/dashboard") // loginli kullanıcı dashboard’a
  } else {
    redirect("/login")     // loginli değilse login sayfasına
  }
}