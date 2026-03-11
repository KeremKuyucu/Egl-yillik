# 📚 EGL Yıllık 2026

Ertuğrulgazi Lisesi 2026 mezunları için geliştirilmiş, modern ve kullanıcı dostu dijital yıllık platformu.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React 19](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)

## ✨ Özellikler

### 👤 Kullanıcı Deneyimi
- **Kişiselleştirilmiş Dashboard**: Günlük selamlamalar, anlık istatistikler ve geri sayım sayaçları.
- **Profil Sistemi**: Kullanıcıların unvanları (badge) ve aktivite durumları.
- **Anı Kutusu**: 
  - Arkadaşlarına anı yazma/düzenleme.
  - **Gizli Kasa**: Mezuniyet gününe kadar kilitli kalan, size yazılmış anılar.

### 🗳️ Anket & Etkileşim
- **Sınıf İçi Oylama**: "En komik", "En çalışkan" gibi kategorilerde oylama.
- **Öneri Sistemi**: Kullanıcıların yeni anket kategorileri önerebilmesi.
- **Canlı İstatistikler**: Katılım oranları ve anket durumları.

### �️ Yönetim & Güvenlik
- **Rol Tabanlı Erişim Kontrolü (RBAC)**:
- Rol oluşturulabilip istenen yetki atanabiliyor.
- Alt yetkili üst yetkiyi düzenleyemez.
- Yetkisi olmayan biri o yetkiyi başkasına veremez.
- **Güvenlik**:
  - Supabase Auth entegrasyonu.
  - Row Level Security (RLS) ile veri güvenliği.
  - Şifreli veri iletişimi.
- **Güvenlik Kilitleri**: Kayıt olma veya mesaj yazma düzenleme gibi olaylar uzaktan kapatılabiliyor admin erişimi ile.

## 🛠️ Teknoloji Yığını

- **Framework**: Next.js 16 (App Router)
- **Dil**: TypeScript
- **UI Kütüphanesi**: React 19, Shadcn/ui, Radix UI
- **Stil**: Tailwind CSS v4
- **Veritabanı & Auth**: Supabase
- **E-posta Servisi**: Resend
- **Dağıtım**: Vercel

## � Proje Yapısı

```
app/
├── (auth)/             # Kimlik doğrulama
│   ├── login/          # Giriş sayfası
│   ├── signup/         # Kayıt sayfası
│   ├── forgot-password/# Şifre sıfırlama talebi
│   └── update-password/# Yeni şifre belirleme
├── (user)/             # Kullanıcı Arayüzü
│   ├── dashboard/      # Ana kontrol paneli
│   ├── profile/        # Profil ve gelen anılar
│   │   └── [schoolNumber]/ # Kullanıcı detay sayfası
│   ├── new/            # Yeni anı yazma sayfası
│   ├── edit/           # Anı düzenleme sayfası
│   ├── school/         # Okul/Sınıf listesi ve istatistikler
│   ├── my-texts/       # Yazdığım anılar
│   ├── surveys/        # Anket sistemi
│   │   ├── [categoryId]/ # Kategori oy kullanma
│   │   └── add-custom/   # Özel seçenek ekleme
│   └── settings/       # Hesap ayarları
├── admin/              # Yönetim Paneli
│   ├── users/          # Kullanıcı yönetimi
│   ├── texts/          # Tüm anılar ve içerik denetimi
│   ├── suggestions/    # Kategori önerileri yönetimi
│   ├── surveys/        # Anket sonuçları ve yönetimi
│   ├── categories/     # Kategori tanımları
│   ├── reminders/      # E-posta hatırlatma sistemi
│   └── settings/       # Sistem ayarları (Dönem, mezuniyet tarihi)
├── complete-profile/   # İlk giriş profil tamamlama
├── maintenance/        # Bakım modu sayfası
├── auth/               # Auth callback handler
components/             # UI bileşenleri
lib/                    # Yardımcı fonksiyonlar ve yapılandırmalar
```

## 🚀 Kurulum ve Geliştirme

Projenin yerel ortamda çalıştırılması için:

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/KeremKuyucu/Egl-yillik.git
   cd Egl-yillik
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   # veya
   pnpm install
   ```

3. **Çevresel Değişkenleri Ayarlayın:**
   `.env.local` dosyasını oluşturun ve gerekli anahtarları ekleyin:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   RESEND_API_KEY=your_resend_api_key
   ...
   ```

4. **Sunucuyu Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcıda `http://localhost:3000` adresine gidin.

## 🤝 Katkıda Bulunma

1. Bu repoyu fork'layın.
2. Yeni bir feature branch oluşturun (`git checkout -b feature/yenilik`).
3. Değişikliklerinizi commit'leyin (`git commit -m 'Yeni özellik eklendi'`).
4. Branch'inizi push'layın (`git push origin feature/yenilik`).
5. Bir Pull Request oluşturun.

##  Lisans

Bu proje GPL lisansı ile lisanslanmıştır.

---
**Geliştirici**: [Kerem Kuyucu](https://github.com/KeremKuyucu)
