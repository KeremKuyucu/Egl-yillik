-- Geçerli sınıflar
insert into public.site_settings (key, value, description)
values 
('valid_classes', '12A,12B,12C,12D,12E,12F', 'Profiles tablosu için geçerli sınıflar');

-- School number uzunluğu
insert into public.site_settings (key, value, description)
values 
('school_number_length', '3', 'Profiles tablosu için school_number uzunluğu');

-- School number regex
insert into public.site_settings (key, value, description)
values 
('school_number_regex', '^[0-9]{3}$', 'Profiles tablosu için school_number regex kuralı');
