// app/page.tsx
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard") // loginli kullanıcı dashboard’a
  } else {
    redirect("/login")     // loginli değilse login sayfasına
  }
}