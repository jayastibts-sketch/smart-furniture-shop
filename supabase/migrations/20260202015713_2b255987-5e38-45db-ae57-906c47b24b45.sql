-- Add shipping days to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS shipping_days integer DEFAULT 7;

-- Update categories with shipping days based on category type
-- This will be set via admin or we set defaults
UPDATE public.categories SET shipping_days = 8 WHERE slug = 'living';
UPDATE public.categories SET shipping_days = 10 WHERE slug = 'bedroom';
UPDATE public.categories SET shipping_days = 12 WHERE slug = 'dining';
UPDATE public.categories SET shipping_days = 7 WHERE slug = 'office';

-- Add expected delivery date, delay notification, and payment details to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expected_delivery_date date;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_delay_message text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS card_last4 text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS card_type text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number text;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number = 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto invoice number generation
DROP TRIGGER IF EXISTS generate_order_invoice_number ON public.orders;
CREATE TRIGGER generate_order_invoice_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_invoice_number();