# 📚 EGL Yıllık 2026

Ertuğrulgazi Lisesi 2026 mezunları için dijital yıllık uygulaması. Öğrenciler birbirlerine anılar yazabilir, sınıf anketlerine katılabilir ve mezuniyet gününde tüm hatıraları görebilir.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)

## ✨ Özellikler

### 👤 Kullanıcı Özellikleri
- **Anı Yazma**: Sınıf arkadaşlarına kişisel anılar yazma
- **Dashboard**: İlerleme takibi, istatistikler, geri sayım
- **Profil Sayfası**: Kişisel istatistikler ve anket başarıları
- **Hesap Yönetimi**: Şifre değiştirme, Google hesabı entegrasyonu ve hesap silme
- **Gizli Kasa**: Sana yazılan anılar mezuniyet gününe kadar kilitli
- **Tema Desteği**: Sistemle uyumlu otomatik karanlık/aydınlık mod ve hydration-safe UI

### 🗳️ Anket Sistemi
- **Dinamik Kategoriler**: Admin tarafından yönetilebilir anket kategorileri
- **Sınıf Bazlı Oylama**: Her sınıf kendi içinde oy kullanır
- **Özel Seçenek Ekleme**: Kullanıcılar özel seçenek ekleyebilir
- **Gerçek Zamanlı Sonuçlar**: Canlı oy sayısı ve sıralama

### 🔒 Yetki Sistemi
| Seviye | Rol | Yetkiler |
|--------|-----|----------|
| 0 | User | Yazma, oylama |
| 50 | Admin | Kullanıcı yönetimi |
| 100 | Super Admin | Tam yetki, kategori yönetimi |
| 1000 | Owner | Sistem sahibi |

### 📧 Bildirim Sistemi
- **E-posta Hatırlatmaları**: Eksik yazısı olanlara otomatik ve manuel e-posta gönderimi
- **Gelişmiş Şablonlar**: Cihaz uyumlu (Outlook, Gmail vs.) tablo tabanlı HTML e-postalar
- **İlerleme Takibi**: E-posta içerisinde görsel ilerleme çubukları (progress bar)
- **Güvenlik Mailleri**: Şifre sıfırlama ve kayıt onaylama mailleri (spam korumalı)

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **E-posta**: Resend
- **Deployment**: Vercel

## 📁 Proje Yapısı

```
app/
├── dashboard/          # Ana kullanıcı paneli
├── new/                # Yeni anı yazma
├── edit/               # Anı düzenleme
├── profile/            # Profil sayfaları
├── surveys/            # Anket sistemi
│   ├── [categoryId]/   # Kategori detay sayfası
│   └── add-custom/     # Özel seçenek ekleme
├── memories/           # Gelen anılar (kilitli)
├── admin/              # Admin paneli
│   ├── users/          # Kullanıcı yönetimi
│   ├── categories/     # Kategori yönetimi
│   ├── reminders/      # E-posta hatırlatmaları
│   └── surveys/        # Anket sonuçları
├── api/                # API routes
├── auth/               # Auth callback ve redirect yönetimi
├── login/              # Giriş sayfası
├── signup/             # Kayıt sayfası
├── settings/           # Kullanıcı hesap ayarları
└── (root pages)        # Ana sayfa ve okul seçimleri

components/             # Yeniden kullanılabilir bileşenler
lib/                    # Yardımcı fonksiyonlar
├── supabase/           # Supabase client'ları
├── constants.ts        # Sabitler ve rol tanımları
├── utils.ts            # Yardımcı fonksiyonlar
└── survey-categories.ts# Anket kategori tipleri
```

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya pnpm
- Supabase hesabı
- Resend hesabı (e-posta için)

### Adımlar

1. **Repo'yu klonlayın:**
```bash
git clone https://github.com/KeremKuyucu/Egl-yillik.git
cd Egl-yillik
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment değişkenlerini ayarlayın:**
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
POSTGRES_DATABASE=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_PRISMA_URL=
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
VERCEL_OIDC_TOKEN=
RESEND_API_KEY=r
NEXT_PUBLIC_APP_URL=
```

4. **Supabase tablolarını oluşturun:**
```bash
# Migration dosyalarını Supabase SQL Editor'da çalıştırın
supabase/migrations/001_initial.sql
supabase/migrations/16.01.2026
```

5. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

## 📊 Veritabanı Şeması

### Ana Tablolar
- `profiles` - Kullanıcı profilleri
- `texts` - Yazılan anılar
- `survey_categories` - Anket kategorileri
- `survey_votes` - Kullanıcı oyları
- `survey_custom_options` - Özel seçenekler

### Önemli RLS Politikaları
- Kullanıcılar sadece kendi yazdıklarını görebilir
- Anılar mezuniyet tarihine kadar alıcı tarafından görülemez
- Oylar sadece aynı sınıftakiler arasında geçerli

## 🔐 Güvenlik

- **Row Level Security (RLS)**: Tüm tablolarda aktif
- **Server-Side Auth**: Kritik işlemler sunucu tarafında
- **Admin Client**: RLS bypass için ayrı admin client
- **Rol Kontrolü**: Her endpoint'te seviye kontrolü

## 📱 Responsive Tasarım

- Mobil öncelikli tasarım
- Tablet ve masaüstü optimizasyonu
- Dark mode desteği
- Modern glassmorphism UI

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Kerem Kuyucu**
- GitHub: [@KeremKuyucu](https://github.com/KeremKuyucu)

---

<p align="center">
  Made with ❤️ for Eyüboğlu Lisesi 2026 Mezunları
</p>
