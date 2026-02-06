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
        if (res.error === "UNAUTHENTICATED") redirect("/login");
        redirect("/home");
    }
}

// Factory: tek tek fonksiyon üretmek için
function makeCheck(perm: PermKey) {
    return () => hasPermission(perm);
}
function makeRequire(perm: PermKey) {
    return () => requirePermission(perm);
}

// -------------------- Permission Checks --------------------

// feedback
export const requireAdminFeedbackRead = makeRequire(PERMS.ADMIN_FEEDBACK_READ);

// stats
export const checkAdminStatsRead = makeCheck(PERMS.ADMIN_STATS_READ);
export const requireAdminStatsRead = makeRequire(PERMS.ADMIN_STATS_READ);

// suggestions
export const checkAdminSuggestionsRead = makeCheck(PERMS.ADMIN_SUGGESTIONS_READ);
export const requireAdminSuggestionsRead = makeRequire(PERMS.ADMIN_SUGGESTIONS_READ);

export const checkAdminSuggestionsUpdate = makeCheck(PERMS.ADMIN_SUGGESTIONS_UPDATE);
export const requireAdminSuggestionsUpdate = makeRequire(PERMS.ADMIN_SUGGESTIONS_UPDATE);

// texts
export const checkAdminTextsRead = makeCheck(PERMS.ADMIN_TEXTS_READ);
export const requireAdminTextsRead = makeRequire(PERMS.ADMIN_TEXTS_READ);

export const checkAdminTextsDelete = makeCheck(PERMS.ADMIN_TEXTS_DELETE);
export const requireAdminTextsDelete = makeRequire(PERMS.ADMIN_TEXTS_DELETE);

// users
export const checkAdminUsersRead = makeCheck(PERMS.ADMIN_USERS_READ);
export const requireAdminUsersRead = makeRequire(PERMS.ADMIN_USERS_READ);

export const checkAdminUsersUpdate = makeCheck(PERMS.ADMIN_USERS_UPDATE);
export const requireAdminUsersUpdate = makeRequire(PERMS.ADMIN_USERS_UPDATE);

// roles
export const checkAdminRolesRead = makeCheck(PERMS.ADMIN_ROLES_READ);
export const requireAdminRolesRead = makeRequire(PERMS.ADMIN_ROLES_READ);

export const checkAdminRolesUpdate = makeCheck(PERMS.ADMIN_ROLES_UPDATE);
export const requireAdminRolesUpdate = makeRequire(PERMS.ADMIN_ROLES_UPDATE);

// survey categories
export const checkSurveyCategoriesReadAll = makeCheck(PERMS.SURVEY_CATEGORIES_READ_ALL);
export const requireSurveyCategoriesReadAll = makeRequire(PERMS.SURVEY_CATEGORIES_READ_ALL);

export const checkSurveyCategoriesWrite = makeCheck(PERMS.SURVEY_CATEGORIES_WRITE);
export const requireSurveyCategoriesWrite = makeRequire(PERMS.SURVEY_CATEGORIES_WRITE);

// email opt-outs
export const checkEmailOptOutsRead = makeCheck(PERMS.EMAIL_OPT_OUTS_READ);
export const requireEmailOptOutsRead = makeRequire(PERMS.EMAIL_OPT_OUTS_READ);

// site settings
export const checkSiteSettingsWrite = makeCheck(PERMS.SITE_SETTINGS_WRITE);
export const requireSiteSettingsWrite = makeRequire(PERMS.SITE_SETTINGS_WRITE);

// system logs
export const checkSystemLogsCleanup = makeCheck(PERMS.SYSTEM_LOGS_CLEANUP);
export const requireSystemLogsCleanup = makeRequire(PERMS.SYSTEM_LOGS_CLEANUP);

export const checkSystemLogsRead = makeCheck(PERMS.SYSTEM_LOGS_READ);
export const requireSystemLogsRead = makeRequire(PERMS.SYSTEM_LOGS_READ);

// votes
export const checkAdminVotesRead = makeCheck(PERMS.ADMIN_VOTES_READ);
export const requireAdminVotesRead = makeRequire(PERMS.ADMIN_VOTES_READ);

// reminders
export const checkRemindersSend = makeCheck(PERMS.REMINDERS_SEND);
export const requireRemindersSend = makeRequire(PERMS.REMINDERS_SEND);

export const checkRemindersRead = makeCheck(PERMS.REMINDERS_READ);
export const requireRemindersRead = makeRequire(PERMS.REMINDERS_READ);

// -------------------- Role Checks --------------------

export const requireAdmin = () => requirePermission("role.admin");
export const requireSuperAdmin = () => requirePermission("role.super_admin");
export const requireSystemAdmin = () => requirePermission("role.system_admin");
export const requireOwner = () => requirePermission("role.owner");

export const checkAdmin = () => hasPermission("role.admin");
export const checkSuperAdmin = () => hasPermission("role.super_admin");
export const checkSystemAdmin = () => hasPermission("role.system_admin");
export const checkOwner = () => hasPermission("role.owner");

// -------------------- Auth Getters --------------------

export async function getCurrentRoles() {
    return (await getAuthContext()).roles;
}

export async function getCurrentPermissions() {
    return (await getAuthContext()).permissions;
}