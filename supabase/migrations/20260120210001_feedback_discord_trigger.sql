-- ⚠️ BU DOSYAYI ÇALIŞTIRMADAN ÖNCE pg_net EXTENSION'INI AKTİF ET!
-- Supabase Dashboard -> Database -> Extensions -> "pg_net" ara ve enable et

-- Discord Webhook Function (pg_net gerektirir)
CREATE OR REPLACE FUNCTION public.handle_new_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_name TEXT;
    user_school_number TEXT;
    type_label TEXT;
    type_emoji TEXT;
    embed_color INTEGER;
BEGIN
    -- Kullanıcı bilgilerini al
    SELECT 
        COALESCE(p.first_name || ' ' || p.last_name, 'Anonim'),
        COALESCE(p.school_number::TEXT, 'Bilinmiyor')
    INTO user_name, user_school_number
    FROM public.profiles p
    WHERE p.id = new.user_id;

    -- Eğer kullanıcı bulunamazsa
    IF user_name IS NULL THEN
        user_name := 'Anonim';
        user_school_number := 'Bilinmiyor';
    END IF;

    -- Tür etiketini ve rengini belirle
    CASE new.type
        WHEN 'bug' THEN 
            type_label := '🐛 Hata Bildirimi';
            type_emoji := '🐛';
            embed_color := 15158332; -- Kırmızı
        WHEN 'suggestion' THEN 
            type_label := '💡 Öneri';
            type_emoji := '💡';
            embed_color := 16776960; -- Sarı
        WHEN 'complaint' THEN 
            type_label := '⚠️ Şikayet';
            type_emoji := '⚠️';
            embed_color := 16744448; -- Turuncu
        ELSE 
            type_label := '❓ Diğer';
            type_emoji := '❓';
            embed_color := 3447003; -- Mavi
    END CASE;

    -- Discord'a gönder (WEBHOOK URL'İNİ DEĞİŞTİR!)
    PERFORM net.http_post(
        url := 'DISCORD_WEBHOOK_URL_BURAYA',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
            'content', '<@483678328646270996>',
            'embeds', array[
                jsonb_build_object(
                    'title', type_emoji || ' Yeni Geri Bildirim',
                    'color', embed_color,
                    'fields', array[
                        jsonb_build_object('name', '📋 Tür', 'value', type_label, 'inline', true),
                        jsonb_build_object('name', '👤 Kullanıcı', 'value', user_name, 'inline', true),
                        jsonb_build_object('name', '🔢 Okul No', 'value', user_school_number, 'inline', true),
                        jsonb_build_object('name', '💬 Mesaj', 'value', CASE WHEN LENGTH(new.message) > 1000 THEN LEFT(new.message, 1000) || '...' ELSE new.message END, 'inline', false),
                        jsonb_build_object('name', '🔗 Sayfa', 'value', COALESCE(new.page_url, 'Belirtilmedi'), 'inline', false)
                    ],
                    'footer', jsonb_build_object('text', 'Feedback ID: ' || new.id::text),
                    'timestamp', new.created_at
                )
            ]
        )
    );
    
    RETURN new;
END;
$function$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_feedback_created ON public.feedback;
CREATE TRIGGER on_feedback_created
    AFTER INSERT ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_feedback();
