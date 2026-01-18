// app/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    redirect("/dashboard") // loginli kullanıcı dashboard’a
  } else {
    redirect("/login")     // loginli değilse login sayfasına
  }
}