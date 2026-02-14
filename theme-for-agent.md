# EGL Yıllık - Agent Theme Guide

Bu dosya, EGL Yıllık projesinin kullanıcı arayüzü (UI) ve kullanıcı deneyimi (UX) tasarım dilini belgeler. Agent olarak yeni sayfalar veya bileşenler oluştururken bu rehbere sadık kalmalısın.

## 1. Genel Tasarım Felsefesi
- **Premium & Modern**: "Basit" değil, "Zengin" bir görünüm. Düz renkler yerine gradyanlar, sönük gölgeler yerine renkli ve geniş gölgeler (`shadow-indigo-500/20` gibi).
- **Glassmorphism**: Arka plan bulanıklığı (`backdrop-blur-md`), yarı saydam katmanlar (`bg-white/10`) ve ince kenarlıklar (`border-white/5`) sıkça kullanılır.
- **Canlı & İnteraktif**: Hover efektleri, ölçeklenmeler (`hover:scale-105`), yumuşak geçişler (`transition-all duration-300`) ve mikro animasyonlar (örn. `animate-pulse`, `animate-bounce`) önemlidir.
- **Kart Tabanlı Layout**: İçerik genellikle `rounded-2xl` veya `rounded-3xl` yarıçaplı kartlar içinde sunulur.

## 2. Renk Paleti (Tailwind & CSS Variables)
`globals.css` içinde tanımlı `oklch` renkleri ve Tailwind sınıfları temel alınır.

### Ana Renkler
- **Primary (Vurgu)**: Indigo (`indigo-500` - `indigo-600`) ve Purple (`purple-600`). Genellikle gradyanlarda birlikte kullanılır (`from-indigo-500 to-purple-600`).
- **Success (Tamamlanan)**: Emerald (`emerald-500`) ve Teal (`teal-500`). Başarı mesajları, tamamlanan progress barlar ve "Açık Kasa" durumları için.
- **Warning/Locked (Kilitli)**: Amber (`amber-500`). Kilitli kartlar, uyarılar ve "Gizli" durumlar için.
- **Backgrounds**:
  - **Light**: `bg-slate-50`, `bg-white`, `bg-indigo-50`.
  - **Dark**: Saf siyah yerine derin uzay tonları (`bg-[#0b1021]`, `bg-[#0f172a]`, `bg-[#1e1b4b]`).

### Metin Renkleri
- **Başlıklar**: `text-slate-900` (Light), `dark:text-white` (Dark). Önemli başlıklarda `font-serif` ve gradyan metin (`text-transparent bg-clip-text ...`) kullanılabilir.
- **Alt Metinler**: `text-slate-600` (Light), `dark:text-slate-400` (Dark).

## 3. Tipografi
- **Sans-serif (Varsayılan)**: `Geist` (`font-sans`). Genel metinler için.
- **Serif**: `font-serif`. İsimler, büyük sayılar veya vurgulu başlıklar için (`className="font-serif"`).
- **Monospace**: `Geist Mono` (`font-mono`). Sayaçlar, kod parçaları veya teknik veriler için.

## 4. Bileşen Desenleri (Component Patterns)

### Kartlar (Cards)
Kartlar projenin temel yapıtaşıdır.
- **Şekil**: `rounded-2xl` veya `rounded-3xl`.
- **Kenarlık**: İnce ve renkli olabilir (`border-2 border-indigo-100 dark:border-indigo-500/30`).
- **Gölge**: Standart gölge yerine renkli gölgeler (`shadow-xl shadow-indigo-500/10`).
- **Efektler**: İçinde genellikle `absolute` pozisyonlu dekoratif gradient globlar (`blur-[100px]`) bulunur.

**Örnek Kart Yapısı:**
```tsx
<div className="relative overflow-hidden rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 shadow-2xl bg-white dark:bg-transparent">
  {/* Dekoratif Arka Plan */}
  <div className="absolute inset-0 bg-gradient-to-br from-white to-indigo-50/30 dark:from-[#0f172a] dark:to-[#1e1b4b]"></div>
  
  {/* İçerik */}
  <div className="relative z-10 p-8">
    <h2 className="font-serif text-2xl">Başlık</h2>
  </div>
</div>
```

### Butonlar
- **Şekil**: Genellikle `rounded-xl` veya `rounded-full`.
- **Stil**: `bg-indigo-600` gibi düz renkler yerine gradientler veya hafif transparan arka planlar tercih edilebilir.
- **İkonlar**: `lucide-react` ikonları metinle birlikte sıkça kullanılır.

### İlerleme Çubukları (Progress Bars)
- **Kapsayıcı**: `bg-slate-100` veya `bg-white/5` (`rounded-full`).
- **Doluluk**: Gradient dolgu (`bg-gradient-to-r from-indigo-500 to-purple-600`).
- **Gölge**: Parlama efekti için `box-shadow` kullanılabilir (`shadow-[0_0_15px_rgba(99,102,241,0.5)]`).

## 5. Layout & Spacing
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` yapısı yaygındır.
- **Gap**: Elemanlar arası boşluk geniştir (`gap-6` veya `gap-8`).
- **Container**: `max-w-7xl mx-auto` veya `container` sınıfı ile içerik ortalanır.

## 6. Örnek Kullanım Senaryoları
- **Kullanıcı Sayfaları**: Kişisel ve duygusal bir ton. "Senin için", "Anıların" gibi ifadeler.
- **Admin Paneli**: Daha teknik ama yine de estetik. Veri görselleştirme ve liste görünümleri ağırlıklı.

Bu rehberi kullanarak oluşturacağın her yeni arayüz, mevcut 'EGL Yıllık' ekosistemiyle bütünleşik ve profesyonel görünecektir.
