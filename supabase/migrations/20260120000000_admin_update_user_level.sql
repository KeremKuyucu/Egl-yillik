-- Kullanıcı seviyesini güvenli bir şekilde güncellemek için RPC fonksiyonu
-- Bu fonksiyon, JS tarafındaki kontrolleri veritabanı seviyesine taşır ve RLS bypass sağlar (Security Definer)

create or replace function admin_update_user_level(target_user_id uuid, new_level int)
returns void
language plpgsql
security definer -- Bu, fonksiyonun auth.uid() sahibi yerine fonksiyon sahibinin (service_role/postgres) yetkileriyle çalışmasını sağlar. RLS'i bypass eder.
as $$
declare
  requesting_user_level int;
  target_current_level int;
begin
  -- 1. İşlemi yapanın (auth.uid) seviyesini al
  select level into requesting_user_level
  from user_levels
  where id = auth.uid();

  -- Seviye bulunamazsa 0 kabul et
  requesting_user_level := coalesce(requesting_user_level, 0);

  -- Admin yetkisi kontrolü (en az 50)
  if requesting_user_level < 50 then
    raise exception 'Bu işlem için yetkiniz yok (En az 50. seviye gerekli)';
  end if;

  -- 2. Hedef kullanıcının mevcut seviyesini al
  select level into target_current_level
  from user_levels
  where id = target_user_id;

  target_current_level := coalesce(target_current_level, 0);

  -- 3. Kurallar ve Yetki Kontrolleri

  -- Kural 1: Kişi kendini düzenleyemez
  if target_user_id = auth.uid() then
    raise exception 'Kendi seviyenizi değiştiremezsiniz';
  end if;

  -- Kural 2: Kendinden üst veya eşit bir seviye ATAYAMAZ
  -- Örnek: 100 level (Super Admin), birini 100 level yapamaz. Sadece Owner yapabilir.
  if new_level >= requesting_user_level then
    raise exception 'Kendinizle aynı veya daha yüksek bir seviye atayamazsınız';
  end if;

  -- Kural 3: Kendinden üst veya eşit seviyedeki birini DÜZENLEYEMEZ
  -- Örnek: 50 level (Admin), başka bir 50 level Admin'i (veya 100 level Super Admin'i) düzenleyemez.
  if target_current_level >= requesting_user_level then
    raise exception 'Sizden daha yüksek veya eşit yetkiye sahip bir kullanıcının seviyesini değiştiremezsiniz';
  end if;

  -- 4. Güncelleme (Upsert)
  insert into user_levels (id, level, set_by, set_at, source, updated_at)
  values (
    target_user_id,
    new_level,
    auth.uid(),
    now(),
    'admin_panel_rpc',
    now()
  )
  on conflict (id) do update
  set 
    level = excluded.level,
    set_by = excluded.set_by,
    set_at = excluded.set_at,
    source = excluded.source,
    updated_at = excluded.updated_at;

end;
$$;
