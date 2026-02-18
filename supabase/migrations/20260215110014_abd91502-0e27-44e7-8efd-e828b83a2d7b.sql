
ALTER TABLE public.profiles ADD COLUMN theme text NOT NULL DEFAULT 'light';
ALTER TABLE public.profiles ADD COLUMN language text NOT NULL DEFAULT 'en';
