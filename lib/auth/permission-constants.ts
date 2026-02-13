// lib/auth/permission-constants.ts
// Bu dosya hem client hem server tarafında kullanılabilir

/**
 * Permission stringleri tek yerden yönetilecek.
 * Buraya ekle, başka yerde string yazma.
 */
export const PERMS = {
    ADMIN_FEEDBACK_DELETE: "admin.feedback.delete", // yerelde client olduğu için kontrol yok rls ile kontrol edilecek
    ADMIN_FEEDBACK_READ: "admin.feedback.read", // sayfa erişimi için gerekli aynı zamanda rls ile kulllanılıyor

    ADMIN_USERS_READ: "admin.users.read", // Kullanıcı sayfası erişim ve 
    ADMIN_USERS_UPDATE: "admin.users.update", // Kullanıcı sayfası update

    ADMIN_ROLES_READ: "admin.roles.read", // tüm levelleri çekebilme izni yerelde kontrol edilmiyor rls ile kontrol edilecek
    ADMIN_ROLES_UPDATE: "admin.roles.update", // Level sayfası update yerelde kontrol edilmiyor rls ile kontrol edilecek

    ADMIN_ROLE_PERMISSIONS_READ: "admin.role_permissions.read", // Rol izinlerini okuma
    ADMIN_ROLE_PERMISSIONS_UPDATE: "admin.role_permissions.update", // Rol izinlerini güncelleme

    ADMIN_STATS_READ: "admin.stats.read", // Ana sayfadaki fonksiyon için erişim yerelde kontrole gerek yok fonksiyona erişim izni veriyor

    ADMIN_SUGGESTIONS_READ: "admin.suggestions.read", // Suggestion sayfası erişim
    ADMIN_SUGGESTIONS_UPDATE: "admin.suggestions.update", // Suggestion sayfası silme için update izni

    ADMIN_TEXTS_DELETE: "admin.texts.delete", // Text sayfası mesaj silme
    ADMIN_TEXTS_READ: "admin.texts.read", // Text sayfası mesaj içeriğini okuma
    ADMIN_TEXTS_METADATA: "admin.texts.metadata", // Text sayfası erişim (meta veriler)
    ADMIN_TEXTS_ACCESS_LOG: "system.texts.access_log", // Metin erişim loglarını görme

    ADMIN_VOTES_READ: "admin.votes.read", // Vote sayfası erişim

    SURVEY_CATEGORIES_READ_ALL: "survey.categories.read_all", // Survey sayfası is_active false olan kategoleri görme
    SURVEY_CATEGORIES_WRITE: "survey.categories.write", // Survey sayfası kategori oluşturma

    EMAIL_OPT_OUTS_READ: "email_opt_outs.read", // Email istememe şeysine erişim
    SITE_SETTINGS_WRITE: "site.settings.write", // Site Settings sayfası erişim

    SYSTEM_LOGS_READ: "system.logs.read", // System Logs sayfası erişim
    SYSTEM_LOGS_CLEANUP: "system.logs.cleanup", // System Logs sayfası temizleme boş aslında bu birşey yapmıyor

    REMINDERS_READ: "admin.reminder.read", // hatırlatıcı gönderme sayfasına girme ve fonksiyonun kullanabilme
    REMINDERS_SEND: "admin.reminder.send", // hatırlatıcı gönderme fonksiyonu kullanabilme

} as const;

export const PAGE_PERMS = {
    PAGE_ADMIN_OVERVIEW: PERMS.ADMIN_STATS_READ,
    PAGE_ADMIN_CATEGORIES: PERMS.SURVEY_CATEGORIES_READ_ALL,
    PAGE_ADMIN_SUGGESTIONS: PERMS.ADMIN_SUGGESTIONS_READ,
    PAGE_ADMIN_USERS: PERMS.ADMIN_USERS_READ,
    PAGE_ADMIN_ROLES: PERMS.ADMIN_ROLES_READ,
    PAGE_ADMIN_FEEDBACK: PERMS.ADMIN_FEEDBACK_READ,
    PAGE_ADMIN_TEXTS: PERMS.ADMIN_TEXTS_METADATA,
    PAGE_ADMIN_VOTES: PERMS.ADMIN_VOTES_READ,
    PAGE_ADMIN_REMINDERS: PERMS.REMINDERS_READ,
    PAGE_ADMIN_SETTINGS: PERMS.SITE_SETTINGS_WRITE,
    PAGE_ADMIN_LOGS: PERMS.SYSTEM_LOGS_READ,
    PAGE_ADMIN_TEXT_ACCESS_LOG: PERMS.ADMIN_TEXTS_ACCESS_LOG,

    PAGE_ADMIN_ACCESS: "role.admin",
} as const;

export type PermKey = (typeof PERMS)[keyof typeof PERMS];
