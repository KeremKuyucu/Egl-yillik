-- Migration: Update get_profile_page_extended_data for service_role only
-- This function is called from server-side code only (cron jobs, internal API routes)

CREATE OR REPLACE FUNCTION public.get_profile_page_extended_data(
    target_school_number text, 
    target_year smallint DEFAULT NULL::smallint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_profile_id UUID;
    v_user_year SMALLINT;
    v_unlock_date TIMESTAMP;
    v_is_unlocked BOOLEAN;
    v_days_left INTEGER;
    
    -- Profil ve istatistik verileri
    v_profile_data RECORD;
    v_memories JSON;
    v_memories_preview JSON;
    v_self_memories JSON;
    v_categories JSON;
BEGIN
    -- ========================================================================
    -- 1. PROFİL BULMA
    -- ========================================================================
    -- school_data_view kullanarak profil ve istatistikleri getir
    SELECT 
        sdv.id,
        sdv.first_name,
        sdv.last_name,
        sdv.school_number,
        sdv.class,
        sdv.user_year,
        sdv.total_texts_received,
        sdv.total_texts_written,
        sdv.total_votes
    INTO v_profile_data
    FROM school_data_view sdv
    WHERE sdv.school_number = target_school_number
      AND (target_year IS NULL OR sdv.user_year = target_year)
    ORDER BY sdv.user_year DESC NULLS LAST
    LIMIT 1;

    -- Profil bulunamadı
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_profile_id := v_profile_data.id;
    v_user_year := v_profile_data.user_year;

    -- ========================================================================
    -- 2. KİLİT DURUMU HESAPLAMA
    -- ========================================================================
    -- Yıla özel mezuniyet tarihini kontrol et
    SELECT (value)::timestamp 
    INTO v_unlock_date
    FROM site_settings
    WHERE key = 'graduation_date_' || v_user_year::text
    LIMIT 1;

    -- Yıla özel bulunamazsa genel mezuniyet tarihini kullan
    IF v_unlock_date IS NULL THEN
        SELECT (value)::timestamp 
        INTO v_unlock_date
        FROM site_settings
        WHERE key = 'graduation_date'
        LIMIT 1;
    END IF;

    -- Hiçbir tarih yoksa varsayılan gelecek tarihi kullan
    v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00'::timestamp);

    -- Kilit durumunu belirle
    v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;

    -- Kalan gün sayısını hesapla
    IF v_is_unlocked THEN
        v_days_left := 0;
    ELSE
        v_days_left := CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::int;
        v_days_left := GREATEST(0, v_days_left);
    END IF;

    -- ========================================================================
    -- 3. ANILARI GETIR (texts_memories_v view kullanarak)
    -- ========================================================================
    IF v_is_unlocked THEN
        -- Kilitli değilse tam anıları getir
        SELECT memories
        INTO v_memories
        FROM texts_memories_v
        WHERE recipient_id = v_profile_id;
        
        v_memories := COALESCE(v_memories, '[]'::json);
    ELSE
        -- Kilitliyse boş array
        v_memories := '[]'::json;
    END IF;

    -- ========================================================================
    -- 4. ANILARIN ÖNİZLEMESİNİ GETIR (texts_memories_preview_v view kullanarak)
    -- ========================================================================
    -- Önizleme her zaman gösterilir (kilit durumundan bağımsız)
    SELECT memories_preview
    INTO v_memories_preview
    FROM texts_memories_preview_v
    WHERE recipient_id = v_profile_id;
    
    v_memories_preview := COALESCE(v_memories_preview, '[]'::json);

    -- ========================================================================
    -- 5. KENDİNE YAZILAN ANILARI GETIR (texts_self_v view kullanarak)
    -- ========================================================================
    IF v_is_unlocked THEN
        -- Kilitli değilse kendine yazılan anıları getir
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', ts.id,
                'content', ts.content,
                'created_at', ts.created_at,
                'updated_at', ts.updated_at,
                'author_id', ts.author_id,
                'recipient_id', ts.recipient_id,
                'author', ts.author
            )
            ORDER BY ts.created_at DESC
        ), '[]'::json)
        INTO v_self_memories
        FROM texts_self_v ts
        WHERE ts.recipient_id = v_profile_id;
    ELSE
        -- Kilitliyse boş array
        v_self_memories := '[]'::json;
    END IF;

    -- ========================================================================
    -- 6. KATEGORİLERİ VE OY SAYILARINI GETIR (profile_vote_summary_v2 view kullanarak)
    -- ========================================================================
    IF v_is_unlocked THEN
        -- Kilitli değilse kategorileri ve oy sayılarını getir
        SELECT COALESCE(json_agg(
            json_build_object(
                'category', json_build_object(
                    'id', sc.id,
                    'title', sc.title,
                    'emoji', sc.emoji,
                    'color', sc.color
                ),
                'count', COALESCE(pvs.vote_count, 0)
            )
            ORDER BY COALESCE(pvs.vote_count, 0) DESC, sc.sort_order ASC
        ), '[]'::json)
        INTO v_categories
        FROM survey_categories sc
        LEFT JOIN profile_vote_summary_v2 pvs 
            ON sc.id = pvs.category_id 
            AND pvs.voted_for_id = v_profile_id
        WHERE sc.is_active = true;
    ELSE
        -- Kilitliyse boş array
        v_categories := '[]'::json;
    END IF;

    -- ========================================================================
    -- 7. SONUÇ JSON OLUŞTUR
    -- ========================================================================
    RETURN json_build_object(
        'profile', json_build_object(
            'id', v_profile_data.id,
            'first_name', v_profile_data.first_name,
            'last_name', v_profile_data.last_name,
            'school_number', v_profile_data.school_number,
            'class', v_profile_data.class,
            'user_year', v_profile_data.user_year
        ),
        'receivedCount', v_profile_data.total_texts_received,
        'writtenCount', v_profile_data.total_texts_written,
        'totalVotes', v_profile_data.total_votes,
        'is_unlocked', v_is_unlocked,
        'days_until_unlock', v_days_left,
        'memories', v_memories,
        'memories_preview', v_memories_preview,
        'self_memories', v_self_memories,
        'categories', v_categories
    );
END;
$function$;

-- Sadece service_role erişebilir (server-side only)
REVOKE ALL ON FUNCTION public.get_profile_page_extended_data(text, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_profile_page_extended_data(text, smallint) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_page_extended_data(text, smallint) TO service_role;

COMMENT ON FUNCTION public.get_profile_page_extended_data IS 
'Profil sayfası için genişletilmiş veri getiren fonksiyon.
- Sadece service_role erişebilir (server-side calls only)
- Normal kullanıcılar bu fonksiyonu doğrudan çağıramaz';
