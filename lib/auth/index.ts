// lib/auth/index.ts
// Re-export everything for backwards compatibility

// Types
export type { UserT, UserData, AuthContext, AuthCheckResult } from "./types";

// Data fetching (UI için)
export {
    getUserData,
    getCurrentUser,
    getCurrentProfile,
    getCurrentLevel,
} from "./data";

// Permissions (Yetki kontrolü için)
export {
    // Constants
    PERMS,
    type PermKey,

    // Auth context
    getAuthContext,

    // Core API
    hasPermission,
    requirePermission,

    // Permission checks
    checkAdminFeedbackDelete,
    requireAdminFeedbackDelete,
    checkAdminLevelsRead,
    requireAdminLevelsRead,
    checkAdminLevelsUpdate,
    requireAdminLevelsUpdate,
    checkAdminStatsRead,
    requireAdminStatsRead,
    checkAdminSuggestionsRead,
    requireAdminSuggestionsRead,
    checkAdminSuggestionsUpdate,
    requireAdminSuggestionsUpdate,
    checkAdminTextsRead,
    requireAdminTextsRead,
    checkAdminTextsDelete,
    requireAdminTextsDelete,
    checkAdminUsersRead,
    requireAdminUsersRead,
    checkAdminUsersUpdate,
    requireAdminUsersUpdate,
    checkSurveyCategoriesReadAll,
    requireSurveyCategoriesReadAll,
    checkSurveyCategoriesWrite,
    requireSurveyCategoriesWrite,
    checkEmailOptOutsRead,
    requireEmailOptOutsRead,
    checkSiteSettingsWrite,
    requireSiteSettingsWrite,
    checkSystemLogsCleanup,
    requireSystemLogsCleanup,

    // Role checks
    requireAdmin,
    requireSuperAdmin,
    requireSystemAdmin,
    requireOwner,
    checkAdmin,
    checkSuperAdmin,
    checkSystemAdmin,
    checkOwner,

    // Auth getters
    getCurrentRoles,
    getCurrentPermissions,
} from "./permissions";
