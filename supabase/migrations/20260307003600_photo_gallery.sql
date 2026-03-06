-- Fotoğraf galerisi tablosu
create table if not exists public.gallery_photos (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    storage_path text not null,
    file_name text not null,
    file_size integer not null default 0,
    caption text,
    created_at timestamptz default now() not null
);

-- Index'ler
create index if not exists idx_gallery_photos_user_id on public.gallery_photos(user_id);
create index if not exists idx_gallery_photos_created_at on public.gallery_photos(created_at desc);

-- RLS aktif (policy yok — tüm erişim RPC ve admin client üzerinden)
alter table public.gallery_photos enable row level security;

-- Not: Storage bucket 'gallery' Dashboard'dan oluşturulmalı
-- Bucket ayarları:
--   Name: gallery
--   Public: true (URL ile erişim için)
--   File size limit: 5MB
--   Allowed MIME types: image/webp, image/jpeg, image/png
--   Policy: YOK — tüm upload/delete admin client üzerinden
