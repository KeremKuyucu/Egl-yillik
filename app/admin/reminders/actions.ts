"use server"

import { Resend } from "resend"
import { hasPermission, PERMS } from "@/lib/auth/permissions"
import { getDeadline } from "@/lib/settings"
import { createClient } from "@/lib/supabase/server"
import type {
  ClassStats,
  SurveyStats,
  EmailResult,
  BulkStatsRPCResponse,
} from "@/types/reminder"

const resend = new Resend(process.env.RESEND_API_KEY)

// =========================
// INTERNAL HELPERS (not exported)
// =========================

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableResendError(e: any) {
  // Resend SDK error şekli değişebilir; güvenli kontrol:
  const status =
    e?.statusCode ?? e?.status ?? e?.response?.status ?? e?.response?.statusCode
  if (status === 429) return true
  if (typeof status === "number" && status >= 500) return true

  // Ağ hataları / timeouts
  const msg = String(e?.message ?? "")
  if (
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET") ||
    msg.includes("EAI_AGAIN") ||
    msg.toLowerCase().includes("timeout")
  ) {
    return true
  }
  return false
}

async function sendWithRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxRetries?: number; baseDelayMs?: number }
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 3
  const baseDelayMs = opts?.baseDelayMs ?? 400

  let lastErr: any
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      if (attempt === maxRetries || !isRetryableResendError(e)) break

      // exponential backoff + küçük jitter
      const jitter = Math.floor(Math.random() * 150)
      const delay = baseDelayMs * Math.pow(2, attempt) + jitter
      await sleep(delay)
    }
  }
  throw lastErr
}

async function sendReminderEmail(
  email: string,
  userName: string,
  stats: ClassStats,
  surveyStats?: SurveyStats
): Promise<EmailResult> {
  if (!email) return { error: "Email not found for user" }
  if (!stats || typeof stats.remaining_classmates !== "number") {
    return { error: "Invalid stats object" }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return { error: "NEXT_PUBLIC_APP_URL is not set" }

  const deadlineData = await getDeadline()
  const deadline = deadlineData.display
  const unsubscribeUrl = `${appUrl}/settings/unsubscribe`

  const remainingClassmates = stats.remaining_classmates

  const isTextComplete = remainingClassmates === 0
  const isSurveyComplete = surveyStats ? surveyStats.remaining === 0 : true
  const isFullyComplete = isTextComplete && isSurveyComplete

  const textPct = clampPercent(Number(stats.completion_percentage))
  const surveyPct = clampPercent(Number(surveyStats?.percentage ?? 0))

  const textProgressColor = isTextComplete
    ? "#059669"
    : textPct >= 50
      ? "#d97706"
      : "#dc2626"

  const surveyProgressColor = isSurveyComplete
    ? "#8b5cf6"
    : surveyPct >= 50
      ? "#a855f7"
      : "#c084fc"

  const safeName = userName?.trim() || "Arkadaşım"

  let subject = ""
  if (isFullyComplete) {
    subject = "✅ Tebrikler! Tüm Görevlerini Tamamladın"
  } else if (!isTextComplete && !isSurveyComplete) {
    subject = `⏰ Hatırlatma: ${remainingClassmates} Yazı ve ${surveyStats?.remaining || 0} Anket Bekliyor`
  } else if (!isTextComplete) {
    subject = `⏰ Hatırlatma: ${remainingClassmates} Arkadaşına Yazı Yazman Gerekiyor`
  } else {
    subject = `🗳️ Hatırlatma: ${surveyStats?.remaining || 0} Anket Daha Doldurman Gerekiyor`
  }

  try {
    const { data, error } = await sendWithRetry(
      () =>
        resend.emails.send({
          from: "EGL Yıllık <egl@keremkk.com.tr>",
          to: [email],
          subject,
          text: `
📚 EGL Yıllık
${stats.class} Sınıfı • 2025-2026

Merhaba ${safeName}! 👋

${
  isFullyComplete
    ? `
🎉 Süpersin!
Hem yazılarını hem de anketlerini tamamladın!
Yıllık çalışmamıza katkın için teşekkürler 💜
`
    : `
Yıllık için yapman gereken bazı şeyler kalmış görünüyor.
Aşağıda durumunu özetledik 📋
`
}

${isTextComplete ? "✅" : "✍️"} Yıllık Yazıları ${isTextComplete ? "- Tamamlandı!" : ""}
• Yazılan: ${stats.messages_sent_to_classmates} yazı
• Kalan: ${remainingClassmates > 0 ? `${remainingClassmates} kişi` : "Yok!"}
• İlerleme: %${textPct}

${
  surveyStats
    ? `
${isSurveyComplete ? "🏆" : "🗳️"} Sınıf Anketleri ${isSurveyComplete ? "- Tamamlandı!" : ""}
• Tamamlanan: ${surveyStats.completed} anket
• Kalan: ${surveyStats.remaining > 0 ? `${surveyStats.remaining} anket` : "Yok!"}
• İlerleme: %${surveyPct}
`
    : ""
}

${
  !isFullyComplete
    ? `
⏰ Son Teslim Tarihi
${deadline}
`
    : ""
}

Bağlantılar:
${!isTextComplete ? `• Yazı Yaz: ${appUrl}/texts\n` : ""}${!isSurveyComplete ? `• Anketlere Git: ${appUrl}/surveys\n` : ""}${isFullyComplete ? `• Yıllığı Görüntüle: ${appUrl}/home\n` : ""}

--
Bu email EGL Yıllık sistemi tarafından otomatik olarak gönderilmiştir.
Abonelikten çıkmak için: ${unsubscribeUrl}
© 2026 EGL Yıllık • Tüm hakları saklıdır.
          `,
          html: `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;max-width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6 0%,#a855f7 100%);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">📚 EGL Yıllık</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0 0;font-size:14px;">${stats.class} Sınıfı • 2025-2026</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h2 style="color:#1e293b;margin:0 0 16px 0;font-size:24px;">Merhaba ${safeName}! 👋</h2>

              ${
                isFullyComplete
                  ? `
              <div style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <div style="font-size:48px;margin-bottom:12px;">🎉</div>
                <h3 style="color:#ffffff;margin:0 0 8px 0;font-size:20px;">Süpersin!</h3>
                <p style="color:rgba(255,255,255,0.95);margin:0;font-size:14px;line-height:1.6;">
                  Hem yazılarını hem de anketlerini tamamladın!<br>
                  Yıllık çalışmamıza katkın için teşekkürler 💜
                </p>
              </div>
              `
                  : `
              <p style="color:#64748b;margin:0 0 24px 0;line-height:1.6;">
                Yıllık için yapman gereken bazı şeyler kalmış görünüyor.<br>
                Aşağıda durumunu özetledik 📋
              </p>
              `
              }

              <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid ${textProgressColor};">
                <div style="display:flex;align-items:center;margin-bottom:12px;">
                  <span style="font-size:24px;margin-right:12px;">${isTextComplete ? "✅" : "✍️"}</span>
                  <h3 style="color:#1e293b;margin:0;font-size:16px;font-weight:600;">
                    Yıllık Yazıları ${isTextComplete ? "- Tamamlandı!" : ""}
                  </h3>
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td width="50%" style="padding:8px;background:#ffffff;border-radius:8px;">
                      <div style="color:#64748b;font-size:12px;margin-bottom:4px;">Yazılan</div>
                      <div style="color:#059669;font-size:18px;font-weight:700;">✓ ${stats.messages_sent_to_classmates} yazı</div>
                    </td>
                    <td width="50%" style="padding:8px;background:#ffffff;border-radius:8px;">
                      <div style="color:#64748b;font-size:12px;margin-bottom:4px;">Kalan</div>
                      <div style="color:${remainingClassmates > 0 ? "#dc2626" : "#059669"};font-size:18px;font-weight:700;">
                        ${remainingClassmates > 0 ? `${remainingClassmates} kişi` : "Yok!"}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="background:#e2e8f0;height:8px;border-radius:4px;overflow:hidden;">
                  <div style="background:${textProgressColor};height:100%;width:${textPct}%;transition:width 0.3s;"></div>
                </div>
                <p style="color:#64748b;font-size:12px;text-align:right;margin:4px 0 0 0;">%${textPct}</p>
              </div>

              ${
                surveyStats
                  ? `
              <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid ${surveyProgressColor};">
                <div style="display:flex;align-items:center;margin-bottom:12px;">
                  <span style="font-size:24px;margin-right:12px;">${isSurveyComplete ? "🏆" : "🗳️"}</span>
                  <h3 style="color:#1e293b;margin:0;font-size:16px;font-weight:600;">
                    Sınıf Anketleri ${isSurveyComplete ? "- Tamamlandı!" : ""}
                  </h3>
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td width="50%" style="padding:8px;background:#ffffff;border-radius:8px;">
                      <div style="color:#64748b;font-size:12px;margin-bottom:4px;">Tamamlanan</div>
                      <div style="color:#8b5cf6;font-size:18px;font-weight:700;">✓ ${surveyStats.completed} anket</div>
                    </td>
                    <td width="50%" style="padding:8px;background:#ffffff;border-radius:8px;">
                      <div style="color:#64748b;font-size:12px;margin-bottom:4px;">Kalan</div>
                      <div style="color:${surveyStats.remaining > 0 ? "#dc2626" : "#8b5cf6"};font-size:18px;font-weight:700;">
                        ${surveyStats.remaining > 0 ? `${surveyStats.remaining} anket` : "Yok!"}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="background:#e2e8f0;height:8px;border-radius:4px;overflow:hidden;">
                  <div style="background:${surveyProgressColor};height:100%;width:${surveyPct}%;transition:width 0.3s;"></div>
                </div>
                <p style="color:#64748b;font-size:12px;text-align:right;margin:4px 0 0 0;">%${surveyPct}</p>
              </div>
              `
                  : ""
              }

              ${
                !isFullyComplete
                  ? `
              <div style="background:linear-gradient(135deg,#f59e0b 0%,#f97316 100%);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
                <div style="font-size:32px;margin-bottom:8px;">⏰</div>
                <div style="color:#ffffff;font-size:14px;font-weight:600;margin-bottom:4px;">Son Teslim Tarihi</div>
                <div style="color:#ffffff;font-size:24px;font-weight:700;">${deadline}</div>
              </div>
              `
                  : ""
              }

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${
                    !isTextComplete
                      ? `
                  <td style="padding:8px;">
                    <a href="${appUrl}/texts" style="display:block;background:#059669;color:#ffffff;text-align:center;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                      ✍️ Yazı Yaz
                    </a>
                    <p style="margin:6px 0 0 0;font-size:11px;color:#64748b;word-break:break-all;text-align:center;">${appUrl}/texts</p>
                  </td>
                  `
                      : ""
                  }
                  ${
                    !isSurveyComplete
                      ? `
                  <td style="padding:8px;">
                    <a href="${appUrl}/surveys" style="display:block;background:#8b5cf6;color:#ffffff;text-align:center;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                      🗳️ Anketlere Git
                    </a>
                    <p style="margin:6px 0 0 0;font-size:11px;color:#64748b;word-break:break-all;text-align:center;">${appUrl}/surveys</p>
                  </td>
                  `
                      : ""
                  }
                  ${
                    isFullyComplete
                      ? `
                  <td style="padding:8px;">
                    <a href="${appUrl}/home" style="display:block;background:#8b5cf6;color:#ffffff;text-align:center;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                      📚 Yıllığı Görüntüle
                    </a>
                    <p style="margin:6px 0 0 0;font-size:11px;color:#64748b;word-break:break-all;text-align:center;">${appUrl}/home</p>
                  </td>
                  `
                      : ""
                  }
                </tr>
              </table>

              <div style="margin-top:20px;text-align:center;">
                <p style="color:#64748b;font-size:11px;margin:0;">
                  Abonelikten çıkmak için: <a href="${unsubscribeUrl}" style="color:#4f46e5;text-decoration:underline;">tıkla</a>
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">© 2026 EGL Yıllık</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        }),
      { maxRetries: 3, baseDelayMs: 500 }
    )

    if (error) {
      console.error("Resend Error:", error)
      return { error: error.message ?? "Resend error" }
    }

    return { success: true, data }
  } catch (e: any) {
    console.error("Email Exception:", e)
    return { error: e?.message ?? "Unknown error" }
  }
}

async function processBulkReminders(
  targets: BulkStatsRPCResponse[],
  opts?: { concurrency?: number; interChunkDelayMs?: number }
) {
  const concurrency = Math.max(1, Math.min(opts?.concurrency ?? 3, 10))
  const interChunkDelayMs = Math.max(0, opts?.interChunkDelayMs ?? 700)

  const results: Record<string, { success: boolean; error?: string; skipped?: boolean }> = {}
  let sent = 0
  let failed = 0
  let skipped = 0

  // basit concurrency pool: chunk = concurrency
  for (let i = 0; i < targets.length; i += concurrency) {
    const chunk = targets.slice(i, i + concurrency)

    await Promise.all(
      chunk.map(async (user) => {
        // güvenlik/kalite: email yoksa skip
        if (!user.email) {
          results[user.user_id] = { success: false, error: "Email adresi yok" }
          failed++
          return
        }

        const stats: ClassStats = {
          user_id: user.user_id,
          class: user.class,
          total_classmates: user.total_classmates,
          messages_sent_to_classmates: user.messages_sent_to_classmates,
          remaining_classmates: user.remaining_classmates,
          completion_percentage: Number(user.text_completion_percentage),
        }

        const surveyStats: SurveyStats = {
          total: user.total_survey_categories,
          completed: user.completed_surveys,
          remaining: user.remaining_surveys,
          percentage: Number(user.survey_completion_percentage),
        }

        const userName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
        const res = await sendReminderEmail(user.email, userName, stats, surveyStats)

        if (res.success) {
          results[user.user_id] = { success: true }
          sent++
        } else {
          results[user.user_id] = { success: false, error: res.error ?? "Unknown error" }
          failed++
        }
      })
    )

    if (i + concurrency < targets.length && interChunkDelayMs > 0) {
      await sleep(interChunkDelayMs)
    }
  }

  return { results, stats: { sent, failed, skipped } }
}

// =========================
// PUBLIC ENTRYPOINT (only export)
// =========================

export async function sendBulkUsersReminders(userIds: string[]) {
  // 0) input guard
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { error: "userIds boş" }
  }

  // ✅ 1) TEK YERDE YETKİ KONTROLÜ
  const auth = await hasPermission(PERMS.REMINDERS_SEND)
  if (!auth.ok) return { error: auth.error }

  // 2) sadece seçililer için DB’den taze stats çek
  const supabase = await createClient()
  const { data: usersData, error: rpcError } = (await supabase.rpc(
    "get_bulk_user_stats",
    { user_ids: userIds }
  )) as { data: BulkStatsRPCResponse[] | null; error: any }

  if (rpcError || !usersData) {
    console.error("Bulk Stats Error:", rpcError)
    return { error: "Kullanıcı verileri alınırken hata oluştu." }
  }

  // 3) opted-out olanları skip et (RPC zaten işaretliyor)
  const targets = usersData.filter((u) => !u.is_opted_out)

  // 4) gönderim
  const { results, stats } = await processBulkReminders(targets, {
    concurrency: 3,          // spam/reputation için 3 mantıklı başlangıç
    interChunkDelayMs: 700,  // burst azaltır
  })

  return {
    success: true,
    meta: {
      requested: userIds.length,
      eligible: targets.length,
      sent: stats.sent,
      failed: stats.failed,
      skipped_opted_out: usersData.length - targets.length,
    },
    results,
  }
}