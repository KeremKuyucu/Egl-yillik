# AGENTS.md — EGL Yıllık

> Bu dosya, bu repo üzerinde çalışan AI agent'ların uyması gereken kuralları, proje yapısını ve standartları tanımlar.

---

## 1. Proje Özeti

EGL Yıllık, Ertuğrulgazi Lisesi 2026 mezunları için geliştirilmiş bir dijital yıllık ve anı platformudur. Kullanıcılar birbirlerine anı/mesaj yazabilir, sınıf içi anketlere katılabilir, profil sayfalarını yönetebilir ve mezuniyet gününe kadar kilitli kalan "Gizli Kasa" anılarını görebilirler. Proje, rol tabanlı erişim kontrolü (RBAC) ile kullanıcı/admin/owner ayrımı yaparak güvenli bir yönetim paneli sunar. Backend tamamen Supabase (Auth + PostgreSQL + RLS + RPC) üzerine kuruludur; frontend Next.js App Router ile sunucu öncelikli (server-first) mimari kullanır.

---

## 2. Tech Stack

| Kategori | Teknoloji | Sürüm / Detay |
|---|---|---|
| **Framework** | Next.js | `^16.1.6` (App Router) |
| **UI Library** | React | `^19.2.4` |
| **Dil** | TypeScript | `^5.9.3` (strict mode) |
| **Styling** | Tailwind CSS v4 | `^4.1.9` (`@tailwindcss/postcss` ile) |
| **UI Components** | shadcn/ui (New York stili) | Radix UI primitifleri + `components/ui/` |
| **Animasyon** | Framer Motion | `^12.29.2` |
| **İkon** | Lucide React | `^0.454.0` |
| **Tema** | next-themes | `^0.4.6` (dark/light/system) |
| **Form** | React Hook Form + Zod | `^7.60.0` / `3.25.76` |
| **Backend / Auth** | Supabase (Auth + DB + RLS + RPC) | `@supabase/ssr: 0.8.0`, `@supabase/supabase-js: latest` |
| **E-posta** | Resend | `^6.7.0` |
| **Analitik** | Vercel Analytics | `1.3.1` |
| **Dağıtım** | Vercel | — |
| **State Yönetimi** | React Server Components + `cache()` | Global store yok; state sunucu tarafında |
| **Data Fetching** | Supabase JS client + RPC + Server Actions | `revalidatePath` ile cache invalidation |
| **Paket Yöneticisi** | npm (veya pnpm/bun) | `package-lock.json`, `pnpm-lock.yaml`, `bun.lock` mevcut |
| **Testing** | ❌ Repo'da bulunamadı | Test framework, test dosyaları veya test script'i yok |
| **CI/CD** | ❌ Repo'da bulunamadı | `.github/` dizini yok; muhtemelen Vercel otomatik deploy |
| **Linting** | ESLint (script mevcut: `eslint .`) | `.eslintrc.*` veya `eslint.config.*` dosyası repo'da bulunamadı |
| **Formatting** | ❌ Prettier yapılandırması bulunamadı | `.prettierrc` veya `.editorconfig` yok |
| **Middleware** | ❌ Repo'da bulunamadı | `middleware.ts` dosyası yok |

---

## 3. Repo Yapısı

```
Egl-yillik/
├── app/                        # Next.js App Router (tüm sayfalar ve API)
│   ├── layout.tsx              # Root layout (font, tema, Toaster, Analytics)
│   ├── globals.css             # Global CSS: Tailwind v4 import, oklch renk scheme, animasyonlar
│   ├── page.tsx                # "/" → user varsa /home, yoksa /login redirect
│   ├── not-found.tsx           # Global 404 sayfası
│   ├── (auth)/                 # Auth sayfaları (login, signup, forgot/update-password)
│   │   ├── layout.tsx          # Auth layout (header yok, minimal)
│   │   ├── (auth-locked)/      # Route group: login, signup, forgot-password
│   │   └── update-password/    # Şifre güncelleme
│   ├── (user)/                 # Kullanıcı arayüzü (oturum gerektiren sayfalar)
│   │   ├── layout.tsx          # User layout: auth kontrolü, AppHeader, Footer
│   │   ├── home/               # Dashboard
│   │   ├── profile/            # Profil sayfaları (dinamik [schoolNumber])
│   │   ├── new/                # Yeni anı yazma
│   │   ├── edit/               # Anı düzenleme
│   │   ├── my-texts/           # Kullanıcının yazdığı anılar listesi
│   │   ├── anonymous/          # Anonim mesaj
│   │   ├── future-me/          # Kendine mektup
│   │   ├── school/             # Okul/Sınıf listesi
│   │   ├── surveys/            # Anket sistemi ([categoryId], add-custom)
│   │   └── settings/           # Hesap ayarları
│   ├── admin/                  # Yönetim paneli (permission gerektiren sayfalar)
│   │   ├── layout.tsx          # Admin layout: permission check, AppHeader
│   │   ├── page.tsx            # Admin dashboard (istatistikler, grafikler)
│   │   ├── users/              # Kullanıcı yönetimi
│   │   ├── texts/              # Tüm anılar ve içerik denetimi
│   │   ├── suggestions/        # Kategori önerileri yönetimi
│   │   ├── votes/              # Anket sonuçları
│   │   ├── categories/         # Anket kategorileri CRUD
│   │   ├── reminders/          # E-posta hatırlatma sistemi
│   │   ├── roles/              # Rol yönetimi
│   │   ├── settings/           # Sistem ayarları
│   │   ├── logs/               # Aktivite logları
│   │   ├── feedback/           # Kullanıcı geri bildirimleri
│   │   └── ...                 # Diğer admin alt sayfaları
│   ├── actions/                # Server Actions (dosya başına "use server")
│   │   ├── admin.ts            # Admin işlemleri (rol, kullanıcı, hesap silme)
│   │   ├── texts.ts            # Anı CRUD (create, update, delete, future-me)
│   │   ├── auth.ts             # Auth işlemleri
│   │   ├── profile.ts          # Profil güncelleme
│   │   ├── feedback.ts         # Geri bildirim gönderme
│   │   ├── settings.ts         # Ayar güncelleme
│   │   └── ...                 # Diğer action dosyaları
│   ├── auth/callback/          # Supabase Auth callback route handler
│   ├── health/route.ts         # Health check endpoint (Edge Runtime)
│   ├── complete-profile/       # İlk giriş profil tamamlama sayfası
│   ├── register-closed/        # Kayıt kapalı bilgilendirme sayfası
│   └── unsubscribe/            # E-posta abonelik iptali
├── components/                 # UI bileşenleri (domain bazlı alt klasörler)
│   ├── ui/                     # shadcn/ui primitifleri (button, card, dialog, input vb.)
│   ├── layout/                 # Genel layout bileşenleri (header, footer, mode-toggle, blobs)
│   │   └── header/             # Header alt bileşenleri (desktop-nav, mobile-menu, admin-nav)
│   ├── texts/                  # Anı bileşenleri (texts-grid, new/edit/anonymous-text-form)
│   ├── admin/                  # Admin bileşenleri (user-management, roles, dashboard kartları)
│   ├── home/                   # Ana sayfa bileşenleri
│   ├── profile/                # Profil bileşenleri (complete-profile-form, collapsible)
│   ├── settings/               # Ayar bileşenleri (change-password, delete-account)
│   ├── providers/              # Context Provider'lar (theme-provider)
│   ├── common/                 # Ortak bileşenler (feedback-button, back-button, logout)
│   ├── future/                 # Kendine mektup formu
│   └── school/                 # Okul listesi bileşeni
├── lib/                        # Yardımcı fonksiyonlar ve yapılandırmalar
│   ├── utils.ts                # cn(), getFullName(), getInitials()
│   ├── supabase/               # Supabase client oluşturucuları
│   │   ├── server.ts           # Server Component / Server Action client (cookies)
│   │   ├── client.ts           # Client Component client (browser)
│   │   └── admin.ts            # Admin client (Service Role Key — SADECE sunucu)
│   ├── auth/                   # Auth yardımcıları
│   │   ├── data.ts             # getUserData(), getCurrentUser(), getCurrentProfile() (cache'li)
│   │   ├── permissions.ts      # getAuthContext(), hasPermission(), requirePermission()
│   │   └── permission-constants.ts # PERMS, PAGE_PERMS sabitleri
│   ├── roles.ts                # Rol sistemi (getRoles, getHighestRole — DB'den, cache'li)
│   ├── settings.ts             # Site ayarları (isMessagingEnabled, isVotingEnabled vb.)
│   ├── constants.ts            # Tip tanımlamaları (Role, RoleDetails)
│   ├── admin-nav.ts            # Admin navigasyon yapısı
│   ├── survey-categories.ts    # Anket kategorileri
│   ├── profile-utils.tsx       # Profil yardımcı fonksiyonları
│   └── unsubscribe.ts          # Abonelik iptali (JWT token ile)
├── types/                      # TypeScript tip tanımlamaları
│   ├── auth.ts                 # UserData, AuthContext, AuthCheckResult
│   └── reminder.ts             # ClassStats, SurveyStats, UserWithStats
├── styles/
│   └── globals.css             # Eski/yedek global CSS (app/globals.css asıl kullanılan)
├── supabase/                   # Supabase yapılandırması ve migration'lar
│   ├── config.toml             # Supabase proje yapılandırması
│   ├── migrations/             # SQL migration dosyaları
│   └── backup/                 # Yedek dosyalar
├── public/                     # Statik dosyalar (image.png — favicon/logo)
├── theme-for-agent.md          # Agent'lar için UI/UX tasarım rehberi
├── components.json             # shadcn/ui konfigürasyonu
├── next.config.mjs             # Next.js ayarları (TS hata toleransı, unoptimized images)
├── tsconfig.json               # TypeScript ayarları (strict, @/* path alias)
├── postcss.config.mjs          # PostCSS: @tailwindcss/postcss
└── package.json                # Proje bağımlılıkları ve script'ler
```

---

## 4. Çalıştırma Komutları

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (`next dev`) — `http://localhost:3000` |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Production sunucusu (`next start`) |
| `npm run lint` | ESLint taraması (`eslint .`) |
| `npm run format` | ❌ Tanımlı değil — Prettier yapılandırması bulunamadı |
| `npm test` | ❌ Tanımlı değil — Test framework'ü kurulmamış |

---

## 5. Kod Standartları

### 5.1 Dil & Dosya Kuralları

- **Dil**: TypeScript (`.ts` / `.tsx`). JavaScript kullanma.
- **strict mode** aktif (`tsconfig.json` → `"strict": true`).
- **Path alias**: `@/*` → proje kökü. Her zaman `@/` ile import yap (göreli path kullanma).
- **Dosya isimlendirme**: `kebab-case` (örn: `texts-grid.tsx`, `user-management-client.tsx`).
- **Bileşen isimlendirme**: `PascalCase` (örn: `TextsGrid`, `AppHeader`).
- **Fonksiyon/değişken isimlendirme**: `camelCase`.
- **Tip/Interface isimlendirme**: `PascalCase` (örn: `UserData`, `AuthContext`).

### 5.2 Import Düzeni (Gözlemlenen Kalıp)

```typescript
// 1. React / Next.js core
import { cache } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"

// 2. Kütüphaneler
import { Resend } from "resend"
import { z } from "zod"

// 3. Dahili lib/utils
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/data"
import { cn } from "@/lib/utils"

// 4. Components
import { Button } from "@/components/ui/button"
import TextsGrid from "@/components/texts/texts-grid"

// 5. Types
import type { UserData } from "@/types/auth"

// 6. İkonlar
import { PenLine, Plus } from "lucide-react"
```

### 5.3 ESLint / Prettier

- **ESLint**: `eslint .` script'i mevcut ancak repo'da `.eslintrc.*` veya `eslint.config.*` dosyası **bulunamadı**. Next.js varsayılan ESLint yapılandırması kullanılıyor olabilir.
- **Prettier**: Yapılandırma dosyası **bulunamadı**. `.editorconfig` da yok.
- **Mevcut stil gözlemleri**:
  - Çift tırnak (`"`) kullanılır (string literal'lerde).
  - Satır sonu noktalı virgül kullanılmaz (semicolon-free).
  - 4 boşluk girintileme (tab değil).
  - Trailing comma yok.

### 5.4 Tailwind CSS v4 Kuralları

- Tailwind CSS **v4** kullanılıyor. `tailwind.config.*` dosyası **yoktur** — CSS-first konfigürasyon (`app/globals.css`).
- `@import "tailwindcss"` ve `@import "tw-animate-css"` kullanılır.
- Renk sistemi: `oklch()` formatında CSS custom property'ler.
- `@theme inline` bloğu ile Tailwind token'ları tanımlanır.
- `@custom-variant dark (&:is(.dark *))` kullanılır (class-based dark mode).
- `cn()` utility fonksiyonu (`clsx` + `tailwind-merge`) ile class birleştirme yapılır.

### 5.5 shadcn/ui Kuralları

- **Stil**: `new-york`.
- **RSC**: `true` (Server Components destekli).
- **Alias'lar**: `@/components/ui/*`, `@/lib/utils`, `@/hooks/*`.
- **İkon kütüphanesi**: `lucide`.
- Yeni shadcn/ui bileşeni eklemek için: `npx shadcn@latest add <component-name>`.

---

## 6. Next.js Kuralları

### 6.1 Routing Yaklaşımı — App Router

- Proje **App Router** kullanır (`app/` dizini). `pages/` dizini **yoktur**.
- Route Group'lar:
  - `(auth)` — Auth sayfaları (login, signup). Layout: minimal, header yok.
  - `(user)` — Kullanıcı sayfaları. Layout: auth kontrolü + AppHeader + Footer.
  - `admin/` — Admin paneli. Layout: permission kontrolü + AppHeader.
- Dinamik route'lar: `[schoolNumber]`, `[categoryId]` gibi klasör isimleri ile.

### 6.2 Server / Client Component Politikası

- **Varsayılan Server Component'tir.** Dosya başına `"use client"` yazmadan bileşen Server Component olarak çalışır.
- `"use client"` sadece şu durumlarda kullanılır:
  - `useState`, `useEffect`, `useRef` gibi React hook'ları gerektiğinde.
  - Kullanıcı etkileşimi (onClick, onChange, form submit) gerektiren bileşenlerde.
  - Browser API'lerine erişim gerektiğinde.
- **Kalıp**: Sayfa (page.tsx) → Server Component (veri çeker), interaktif bileşenler → `"use client"` ile ayrı dosyada.
  - Örnek: `app/(user)/my-texts/page.tsx` (Server) → `components/texts/texts-grid.tsx` (Client).
- `components/ui/` altındaki birçok shadcn/ui primitifi `"use client"` kullanır (interaktif oldukları için).
- `components/providers/theme-provider.tsx` `"use client"` olarak işaretlidir.

### 6.3 Data Fetching

- **Server Component'lerde**: `createClient()` (server) ile doğrudan Supabase sorgusu.
- **Server Actions**: `"use server"` ile işaretli dosyalar `app/actions/` altında bulunur. Form submit ve mutasyon işlemleri için kullanılır.
- **Inline Server Actions**: Layout dosyalarında inline `"use server"` fonksiyonları kullanılır (örn: `handleSignOut`).
- **Cache**: `react` > `cache()` fonksiyonu ile request-level memoization (`getUserData`, `getAuthContext`).
- **Revalidation**: Mutasyon sonrası `revalidatePath()` ile ilgili path'ler invalidate edilir.
- **RPC**: Supabase RPC fonksiyonları (`supabase.rpc("...")`), özellikle güvenlik ve business logic için kullanılır.
- `getServerSideProps` / `getStaticProps` **kullanılmaz** (bunlar Pages Router'a aittir).

### 6.4 API Routes / Route Handlers

- Route handler'lar `route.ts` dosyaları ile tanımlanır.
  - `app/health/route.ts` — Health check (Edge Runtime, `force-dynamic`).
  - `app/auth/callback/` — Supabase Auth callback.
- Yeni API route eklerken `app/<path>/route.ts` olarak oluştur.
- Uygun olan durumlarda Server Action'ları tercih et (route handler yerine).

---

## 7. Environment & Secrets

### 7.1 Kullanılan Çevresel Değişkenler

| Değişken | Tür | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase proje URL'si |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonim anahtar (RLS ile korunur) |
| `NEXT_PUBLIC_APP_URL` | Public | Uygulamanın public URL'si (e-posta linkleri için) |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 Secret | Admin client için (RLS bypass). Sadece sunucu tarafı. |
| `RESEND_API_KEY` | 🔒 Secret | E-posta gönderimi (Resend) |
| `UNSUB_SECRET` | 🔒 Secret | E-posta abonelik iptali JWT secret'ı |

### 7.2 Kurallar

- `.env.local` dosyası gitignore'da. **Asla** repo'ya secret commit etme.
- `.env.example` dosyası **bulunamadı** — yeni bir secret eklendiğinde README veya bu dosyada belgelenmelidir.
- `NEXT_PUBLIC_` ön ekli değişkenler client tarafında erişilebilir. Secret'lar bu ön eki **kullanmamalıdır**.
- `SUPABASE_SERVICE_ROLE_KEY` sadece `lib/supabase/admin.ts` içinde kullanılır ve sadece sunucu tarafında çağrılmalıdır.

---

## 8. Testing Politikası

> **Repo'da test framework'ü, test dosyası veya test script'i bulunamadı.**

### Minimum Beklenti

- Yeni bir test framework'ü eklemeden önce mevcut ekiple (proje sahibiyle) konuş.
- Eğer test eklenmesi istenirse önerilen yapı:
  - **Unit Test**: Vitest (`vitest` + `@testing-library/react`)
  - **E2E Test**: Playwright
  - Dosya konumları: `__tests__/` veya dosya yanına `.test.ts(x)`.
- Mevcut durumda, değişikliklerin doğruluğu `npm run build` ile kontrol edilmelidir.

---

## 9. Commit & PR Kuralları

### 9.1 Commit Mesajları

[Conventional Commits](https://conventionalcommits.org) formatı kullan:

```
<tip>(<kapsam>): <açıklama>

feat(texts): anı silme onay diyaloğu eklendi
fix(auth): login redirect döngüsü düzeltildi
style(admin): dashboard kart spacing ayarı
refactor(lib): roles cache mekanizması yeniden yazıldı
chore(deps): next.js 16.1.6'ya güncellendi
```

**Tipler**: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `perf`, `test`.

### 9.2 Branch İsimlendirme

```
feature/<kısa-açıklama>    # Yeni özellik
fix/<kısa-açıklama>        # Bug düzeltme
refactor/<kısa-açıklama>   # Yeniden yapılandırma
chore/<kısa-açıklama>      # Bakım işleri
```

### 9.3 PR Checklist

- [ ] `npm run build` başarılı mı?
- [ ] `npm run lint` hata veriyor mu?
- [ ] Yeni environment variable eklendi mi? → Belgelendi mi?
- [ ] `"use client"` gereksiz yere eklenmedi mi?
- [ ] Supabase RLS politikaları etkileniyor mu?
- [ ] Tasarım `theme-for-agent.md` rehberine uygun mu?
- [ ] Yeni bağımlılık eklendi mi? → Gerekçesi var mı?

---

## 10. Agent Çalışma Akışı

### 10.1 Değişiklik Öncesi Plan

1. **Anlama**: İlgili dosyaları oku, mevcut kalıpları öğren.
2. **`theme-for-agent.md` dosyasını oku**: UI değişikliği yapıyorsan bu rehbere uy.
3. **Plan yaz**: Değişiklik kapsamını, etkilenen dosyaları ve potansiyel riskleri belirle.
4. **Minimal değişiklik yap**: Gereksiz refactor veya bağımlılık ekleme. Mevcut yapıyla uyumlu çalış.

### 10.2 Küçük, Atomik Commit'ler

- Tek bir mantıksal değişiklik = tek commit.
- Birden fazla dosyayı etkileyen büyük değişiklikler birden fazla commit'e bölünebilir.

### 10.3 Doğrulama Adımları

Her değişiklik sonrası:

```bash
npm run lint          # Lint kontrol (ESLint)
npm run build         # Build doğrulama (TypeScript + Next.js)
```

> ⚠️ `next.config.mjs` içinde `typescript.ignoreBuildErrors: true` ayarı var. Bu, build sırasında TS hatalarını susturur. Yine de TypeScript hatalarını görmezden gelme; IDE veya `tsc --noEmit` ile kontrol et.

### 10.4 Değişiklik Özetleri & Risk Notları

Her değişiklik grubunda şunları belirt:
- **Ne değişti**: Hangi dosyalar, hangi fonksiyonlar.
- **Neden değişti**: İş mantığı veya teknik sebep.
- **Risk**: Potansiyel yan etkiler (RLS, auth, diğer sayfalar).

---

## 11. ⛔ Yapma Listesi

| ❌ YAPMA | ✅ BUNUN YERİNE |
|---|---|
| `// @ts-ignore` veya `// @ts-nocheck` ekleme | Tipi düzgün tanımla |
| ESLint kuralını `eslint-disable` ile geçici susturma | Sorunu kök nedeninden çöz |
| `any` tipini gereksiz kullanma | Doğru tipi tanımla veya `unknown` kullan |
| Yeni bağımlılık ekleme (gerekçesiz) | Mevcut araçlarla çöz |
| Global `.gitignore` veya config dosyalarına rastgele ekleme yapma | Tartış, belirli dosyaya ekle |
| Secret/API key'i koda gömme | `.env.local` kullan |
| `NEXT_PUBLIC_` ön ekini secret'lara ekleme | Secret'lar ön eksiz olmalı |
| `"use client"` gereksiz yere ekleme | Server Component olarak bırak; sadece hook/interaksiyon gerektiğinde ekle |
| Supabase RLS politikalarını bypass etme (client tarafı) | RPC veya admin client kullan (sadece sunucu tarafı) |
| `createAdminClient()` fonksiyonunu client component'te kullanma | Sadece server-side (actions, route handlers) |
| Mevcut API contract'ını (RPC function signature) bozma | Yeni fonksiyon yaz, eski desteği koru |
| `revalidatePath` yazmayı unutma (mutasyon sonrası) | Her mutasyon sonrası ilgili path'leri revalidate et |
| Tailwind config dosyası oluşturma (v4) | CSS-first konfigürasyon kullan (`globals.css`) |
| `pages/` dizini oluşturma | App Router kullan (`app/`) |
| `getServerSideProps` / `getStaticProps` kullanma | Server Component veya Server Action kullan |

---

## 12. Örnek Görev Akışları

### 12.1 Yeni Sayfa/Route Ekleme

**Senaryo**: `/announcements` adında yeni bir kullanıcı sayfası ekle.

```
1. Planla:
   - Sayfa `(user)` route group altında olacak → `app/(user)/announcements/page.tsx`
   - Auth kontrolü (user) layout tarafından yapılır — ekstra kontrol gerekmez.
   - Veri Supabase'den çekilecek → Server Component olarak yaz.
   - İnteraktif liste filtreleme gerekli → Client Component ayrı dosyada.

2. Dosyaları oluştur:
   a. `app/(user)/announcements/page.tsx` (Server Component)
      - `createClient()` ile Supabase sorgusu.
      - Veriyi Client Component'e prop olarak geçir.

   b. `components/announcements/announcements-list.tsx` (Client Component)
      - Dosya başına `"use client"` ekle.
      - UI bileşenlerini `@/components/ui/*` kullan.
      - Tasarımı `theme-for-agent.md` rehberine uygun yap.
      - Lucide ikonları kullan.

3. Navigasyonu güncelle:
   - `components/layout/header/desktop-nav.tsx` veya ilgili nav dosyasına link ekle.

4. Doğrula:
   npm run lint
   npm run build

5. Commit:
   feat(announcements): duyurular sayfası eklendi
```

### 12.2 Var Olan Bileşende Bugfix

**Senaryo**: `TextsGrid` bileşeninde arama (search) büyük-küçük harf duyarlı, düzeltilmeli.

```
1. Analiz:
   - Dosya: `components/texts/texts-grid.tsx`
   - `"use client"` bileşeni, `useState` ile arama state'i yönetiliyor.
   - Mevcut filtreleme mantığını bul.

2. Sorunu tespit et:
   - `filter()` içinde `includes()` kullanılıyor, locale-insensitive.

3. Minimal düzeltme yap:
   - `toLocaleLowerCase('tr')` ekle (Türkçe karakter desteği — İ/ı, Ö/ö vb.).

4. Etki analizi:
   - Sadece client-side filtreleme etkilenir.
   - Supabase sorgusu değişmez.
   - RLS'ye etkisi yok.

5. Doğrula:
   npm run lint
   npm run build

6. Commit:
   fix(texts): arama filtresinde büyük-küçük harf duyarsızlığı düzeltildi
```

---

## Ek: UI/UX Tasarım Rehberi

Arayüz değişikliği yapılırken **mutlaka** `theme-for-agent.md` dosyasını oku ve uy. Özetle:

- **Glassmorphism**: `backdrop-blur-md`, `bg-white/10`, `border-white/5`.
- **Gradyanlar**: `from-indigo-500 to-purple-600` ana vurgu.
- **Kartlar**: `rounded-2xl` / `rounded-3xl`, renkli gölgeler (`shadow-xl shadow-indigo-500/10`).
- **Renkler**: Indigo/Purple (primary), Emerald/Teal (success), Amber (warning).
- **Dark mode**: Derin uzay tonları (`bg-[#0b1021]`, `bg-[#0f172a]`). Saf siyah kullanma.
- **Font**: Geist (sans), Geist Mono (mono), `font-serif` vurgulu başlıklar için.
- **Hover**: `hover:scale-105`, `transition-all duration-300`.
- **İkonlar**: Lucide React.
