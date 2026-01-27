-- Trigger fonksiyonu
create or replace function public.validate_profile()
returns trigger as $$
declare
    valid_classes text[];
    school_number_len int;
    school_number_regex text;
begin
    -- site_settings'ten değerleri al (varsayılan değerlerle)
    select string_to_array(value, ',') into valid_classes
    from site_settings
    where key = 'valid_classes';
    
    -- Eğer ayar yoksa varsayılan sınıfları kullan (Güvenlik önlemi)
    if valid_classes is null then
        valid_classes := ARRAY['12A','12B','12C','12D','12E','12F'];
    end if;

    select COALESCE(value::int, 3) into school_number_len
    from site_settings
    where key = 'school_number_length';

    select COALESCE(value, '^[0-9]{3}$') into school_number_regex
    from site_settings
    where key = 'school_number_regex';

    -- Class kontrolü (Sadece doluysa kontrol et)
    if new.class is not null and not (new.class = any(valid_classes)) then
        raise exception 'Geçersiz class: %. Geçerli sınıflar: %', new.class, array_to_string(valid_classes, ', ');
    end if;

    -- School number kontrolü (Sadece doluysa kontrol et)
    if new.school_number is not null and (length(new.school_number) != school_number_len or new.school_number !~ school_number_regex) then
        raise exception 'Geçersiz school_number: %. Beklenen uzunluk: %, Regex: %', new.school_number, school_number_len, school_number_regex;
    end if;

    return new;
end;
$$ language plpgsql;

-- Trigger'ı profile tablosuna bağla
DROP TRIGGER IF EXISTS validate_profile_trigger ON public.profiles;
CREATE TRIGGER validate_profile_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_profile();
