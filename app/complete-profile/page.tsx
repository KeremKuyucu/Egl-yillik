import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CompleteProfileForm from "@/components/profile/complete-profile-form"
import { getCurrentProfile } from "@/lib/auth"
import { isRegistrationEnabled } from "@/lib/settings"

export default async function CompleteProfilePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const profile = await getCurrentProfile()

    // Profil varsa zaten tamam; kayıt kapalı/açık önemli değil
    if (profile) {
        redirect("/dashboard")
    }

    // Profil yoksa: kayıt kapalıysa bu sayfayı da kapat
    const enabled = await isRegistrationEnabled()
    if (!enabled) {
        redirect("/register-closed")
    }

    // metadata -> initial form
    const metadata = user.user_metadata || {}
    let firstName = ""
    let lastName = ""

    if (metadata.full_name) {
        const names = String(metadata.full_name).trim().split(/\s+/)
        firstName = names[0] || ""
        lastName = names.slice(1).join(" ") || ""
    } else {
        firstName = metadata.first_name || ""
        lastName = metadata.last_name || ""
    }

    const initialData = {
        firstName,
        lastName,
        schoolNumber: metadata.school_number || "",
        classRoom: metadata.class || "",
    }

    return <CompleteProfileForm initialData={initialData} />
}
