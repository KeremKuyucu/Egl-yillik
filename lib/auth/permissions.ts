// lib/auth/permissions.ts (server-only)
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AuthContext, AuthCheckResult } from "@/types/auth";

// -------------------- Permission Constants --------------------
// Re-export from shared constants file (client/server compatible)
export { PERMS, PAGE_PERMS, type PermKey } from "./permission-constants";
// Import for local use within this file
import { PERMS, type PermKey } from "./permission-constants";

// -------------------- Auth Context --------------------

/**
 * Yetki kontekstini getirir: user, roles, permissions
 * Permission/role kontrolü için kullanılır.
 */
export const getAuthContext = cache(async (): Promise<AuthContext> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { user: null, roles: [], permissions: [] };

    const [rolesRes, permsRes] = await Promise.all([
        supabase.rpc("get_my_roles"),
        supabase.rpc("get_my_permissions"),
    ]);

    if (rolesRes.error || permsRes.error) {
        console.error("Auth context RPC error", rolesRes.error, permsRes.error);
        return { user, roles: [], permissions: [] };
    }

    return {
        user,
        roles: (rolesRes.data ?? []) as string[],
        permissions: (permsRes.data ?? []) as string[],
    };
});


// -------------------- Core Permission API --------------------

export async function hasPermission(perm: PermKey | string): Promise<AuthCheckResult> {
    const { user, permissions } = await getAuthContext();
    if (!user) return { ok: false, error: "UNAUTHENTICATED" };
    if (!permissions.includes(perm)) return { ok: false, error: "FORBIDDEN" };
    return { ok: true };
}

export async function requirePermission(perm: PermKey | string) {
    const res = await hasPermission(perm);
    if (!res.ok) {
        console.log("Permission denied", res.error);
        if (res.error === "UNAUTHENTICATED") redirect("/login");
        redirect("/home");
    }
}

export async function hasRole(roleKey: string): Promise<AuthCheckResult> {
    const { user, roles } = await getAuthContext();
    if (!user) return { ok: false, error: "UNAUTHENTICATED" };
    if (!roles.includes(roleKey)) return { ok: false, error: "FORBIDDEN" };
    return { ok: true };
}

export async function requireRole(roleKey: string) {
    const res = await hasRole(roleKey);
    if (!res.ok) {
        console.log("Role denied", res.error, roleKey);
        if (res.error === "UNAUTHENTICATED") redirect("/login");
        redirect("/home");
    }
}

// -------------------- Role Checks --------------------

export const requireAdmin = () => requireRole("admin");
export const requireSuperAdmin = () => requireRole("super_admin");
export const requireSystemAdmin = () => requireRole("system_admin");
export const requireOwner = () => requireRole("owner");

export const checkAdmin = () => hasRole("admin");
export const checkSuperAdmin = () => hasRole("super_admin");
export const checkSystemAdmin = () => hasRole("system_admin");
export const checkOwner = () => hasRole("owner");

// -------------------- Auth Getters --------------------

export async function getCurrentRoles() {
    return (await getAuthContext()).roles;
}

export async function getCurrentPermissions() {
    return (await getAuthContext()).permissions;
}