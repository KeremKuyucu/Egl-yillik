"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface UpdateUserProfileData {
    first_name: string
    last_name: string
    school_number: string
    class: string
}

export async function updateUserRole(userId: string, newRoleKey: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_update_user_role', {
            target_user_id: userId,
            new_role_key: newRoleKey
        })

        if (error) {
            console.error("Rol güncelleme hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Beklenmeyen hata:", error)
        return { success: false, error: "Beklenmeyen bir hata oluştu" }
    }
}

export async function updateUserProfile(
    userId: string,
    data: UpdateUserProfileData
) {
    try {
        const supabase = await createClient()

        const { data: result, error } = await supabase.rpc('admin_update_user_profile', {
            target_user_id: userId,
            new_first_name: data.first_name,
            new_last_name: data.last_name,
            new_school_number: data.school_number,
            new_class: data.class
        })

        if (error) {
            console.error("Profil güncelleme hatası:", error)
            return { success: false, error: error.message }
        }

        if (result && !result.success) {
            return { success: false, error: result.error }
        }

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}

// -------------------- Role Management Actions --------------------

export async function adminCreateRole(key: string, label: string, level: number, description: string = "", badgeColor: string = "bg-slate-100 text-slate-800") {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_create_role', {
            p_key: key,
            p_label: label,
            p_level: level,
            p_description: description,
            p_badge_color: badgeColor
        })

        if (error) {
            console.error("Rol oluşturma hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/roles")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}

export async function adminUpdateRole(key: string, label: string, level: number, description: string = "", badgeColor: string = "bg-slate-100 text-slate-800") {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_update_role', {
            p_key: key,
            p_label: label,
            p_level: level,
            p_description: description,
            p_badge_color: badgeColor
        })

        if (error) {
            console.error("Rol güncelleme hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/roles")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}

export async function adminDeleteRole(key: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_delete_role', {
            p_key: key
        })

        if (error) {
            console.error("Rol silme hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/roles")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}

export async function adminAddRolePermission(roleKey: string, permKey: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_add_role_permission', {
            p_role_key: roleKey,
            p_perm_key: permKey
        })

        if (error) {
            console.error("İzin ekleme hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/roles")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}

export async function adminRemoveRolePermission(roleKey: string, permKey: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_remove_role_permission', {
            p_role_key: roleKey,
            p_perm_key: permKey
        })

        if (error) {
            console.error("İzin kaldırma hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/roles")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}

// -------------------- User Role Management Actions --------------------

export async function adminGetUserRoles(userId: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('admin_get_user_roles', {
            target_user_id: userId
        })

        if (error) {
            console.error("Kullanıcı rolleri çekme hatası:", error)
            return { success: false, error: error.message, data: null }
        }

        return { success: true, data: data as { role_key: string; level: number }[] }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası", data: null }
    }
}

export async function adminAddUserRole(userId: string, roleKey: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_add_user_role', {
            target_user_id: userId,
            add_role_key: roleKey
        })

        if (error) {
            console.error("Rol ekleme hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}

export async function adminRemoveUserRole(userId: string, roleKey: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_remove_user_role', {
            target_user_id: userId,
            remove_role_key: roleKey
        })

        if (error) {
            console.error("Rol kaldırma hatası:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}
