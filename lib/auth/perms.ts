// lib/auth/perms.ts
/**
 * BU DOSYA SADECE CONSTANT İÇERİR.
 * Supabase, next/headers, redirect, cache vs YOK!
 */

export const PERMS = {
  ADMIN_FEEDBACK_DELETE: "admin.feedback.delete",
  ADMIN_FEEDBACK_READ: "admin.feedback.read",
  ADMIN_LEVELS_READ: "admin.levels.read",
  ADMIN_LEVELS_UPDATE: "admin.levels.update",
  ADMIN_STATS_READ: "admin.stats.read",
  ADMIN_SUGGESTIONS_READ: "admin.suggestions.read",
  ADMIN_SUGGESTIONS_UPDATE: "admin.suggestions.update",
  ADMIN_TEXTS_DELETE: "admin.texts.delete",
  ADMIN_TEXTS_READ: "admin.texts.read",
  ADMIN_USERS_READ: "admin.users.read",
  ADMIN_USERS_UPDATE: "admin.users.update",
  SURVEY_CATEGORIES_READ_ALL: "survey.categories.read_all",
  SURVEY_CATEGORIES_WRITE: "survey.categories.write",
  EMAIL_OPT_OUTS_READ: "email_opt_outs.read",
  SITE_SETTINGS_WRITE: "site.settings.write",
  SYSTEM_LOGS_CLEANUP: "system.logs.cleanup",
  REMINDERS_SEND: "admin.reminders.send",
  REMINDERS_READ: "admin.reminders.read",
} as const;

export type PermKey = (typeof PERMS)[keyof typeof PERMS];

/**
 * Sayfa erişim permission'ları (sen AppHeader’da bunu kullanıyordun)
 * Burayı senin gerçek key’lerinle doldur.
 */
export const PAGE_PERMS = {
  PAGE_ADMIN_ACCESS: "page.admin.access",
  PAGE_ADMIN_OVERVIEW: "page.admin.overview",
  PAGE_ADMIN_CATEGORIES: "page.admin.categories",
  PAGE_ADMIN_SUGGESTIONS: "page.admin.suggestions",
  PAGE_ADMIN_USERS: "page.admin.users",
  PAGE_ADMIN_FEEDBACK: "page.admin.feedback",
  PAGE_ADMIN_TEXTS: "page.admin.texts",
  PAGE_ADMIN_VOTES: "page.admin.votes",
  PAGE_ADMIN_REMINDERS: "page.admin.reminders",
  PAGE_ADMIN_SETTINGS: "page.admin.settings",
  PAGE_ADMIN_LOGS: "page.admin.logs",
} as const;

export type PagePermKey = (typeof PAGE_PERMS)[keyof typeof PAGE_PERMS];