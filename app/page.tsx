// app/page.tsx
import { getCurrentUser } from "@/lib/auth/data"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/home") // loginli kullanıcı home’a
  } else {
    redirect("/login")     // loginli değilse login sayfasına
  }
}