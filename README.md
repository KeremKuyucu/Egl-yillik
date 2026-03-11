# 📚 EGL Yıllık 2026

**EGL Yıllık**, Ertuğrulgazi Lisesi 2026 mezunları için tasarlanmış, anıları dijital dünyada ölümsüzleştiren premium bir yıllık platformudur. Geleneksel yıllık kültürünü modern bir dokunuşla geleceğe taşıyan bu sistem; anıların, etkileşimli anketlerin ve geleceğe bırakılan mektupların güvenle saklandığı dijital bir zaman kapsülü niteliğindedir.

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
  - Arkadaşlarına açık veya **anonim** olarak anı yazma ve düzenleme.
  - **Gizli Kasa**: Mezuniyet gününe kadar kilitli kalan, size yazılmış anılar.
  - **Kendine Mektup**: Gelecekte açılmak üzere kendinize notlar bırakma özelliği.
- **Fotoğraf Galerisi**: Yıllıkta yer alacak anı fotoğraflarının paylaşıldığı ve incelendiği alan.

### 🗳️ Anket & Etkileşim
- **Sınıf İçi Oylama**: "En komik", "En çalışkan" gibi kategorilerde oylama.
- **Öneri Sistemi**: Kullanıcıların yeni anket kategorileri önerebilmesi.
- **Canlı İstatistikler**: Katılım oranları ve anket durumları.
- **Geri Bildirim Sistemi**: Kullanıcıların soru, hata ve önerilerini doğrudan yönetime iletebilmesi.

### 🛡️ Yönetim & Güvenlik
- **Rol Tabanlı Erişim Kontrolü (RBAC)**:
   - Rol oluşturulabilip istenen yetki atanabiliyor.
   - Alt yetkili üst yetkiyi düzenleyemez.
   - Yetkisi olmayan biri o yetkiyi başkasına veremez.
- **Kapsamlı Gözetim ve Loglama**: Anı görüntülemeleri, oy erişimleri ve kritik sistem işlemlerinin detaylı log kayıtları (`text-access-log`, `vote-access-log`, `logs`).
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

##  Lisans

Bu proje GPL lisansı ile lisanslanmıştır.

---
**Geliştirici**: [Kerem Kuyucu](https://github.com/KeremKuyucu)
