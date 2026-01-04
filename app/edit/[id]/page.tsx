import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import EditTextForm from "@/components/edit-text-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export default async function EditTextPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: text, error: textError } = await supabase.from("texts").select("*").eq("id", id).single()

  if (textError || !text) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Secure Text App</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Edit Text</h2>
            <p className="text-muted-foreground">Update your message to {text.recipient_name}</p>
          </div>

          <EditTextForm text={text} />
        </div>
      </main>
    </div>
  )
}
