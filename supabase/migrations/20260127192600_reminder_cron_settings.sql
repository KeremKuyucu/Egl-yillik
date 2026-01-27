-- Otomatik hatırlatıcı ayarlarını ekle
INSERT INTO public.site_settings (key, value, description)
VALUES 
    ('reminder_auto_enabled', 'false', 'Otomatik hatırlatma maillerinin gönderilip gönderilmeyeceğini belirler.'),
    ('reminder_auto_interval', '3', 'Otomatik hatırlatmaların kaç günde bir gönderileceğini belirler (gün sayısı).'),
    ('reminder_last_run', '', 'Otomatik hatırlatıcının son çalışma zamanı (ISO timestamp).')
ON CONFLICT (key) DO NOTHING;
