-- Function to update category product counts
CREATE OR REPLACE FUNCTION public.update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting or updating with a new category_id
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
    -- Increment new category count
    IF NEW.category_id IS NOT NULL THEN
      UPDATE public.categories 
      SET product_count = (
        SELECT COUNT(*) FROM public.products WHERE category_id = NEW.category_id AND is_active = true
      )
      WHERE id = NEW.category_id;
    END IF;
    
    -- Decrement old category count (for updates)
    IF TG_OP = 'UPDATE' AND OLD.category_id IS NOT NULL THEN
      UPDATE public.categories 
      SET product_count = (
        SELECT COUNT(*) FROM public.products WHERE category_id = OLD.category_id AND is_active = true
      )
      WHERE id = OLD.category_id;
    END IF;
  END IF;
  
  -- If deleting
  IF TG_OP = 'DELETE' THEN
    IF OLD.category_id IS NOT NULL THEN
      UPDATE public.categories 
      SET product_count = (
        SELECT COUNT(*) FROM public.products WHERE category_id = OLD.category_id AND is_active = true
      )
      WHERE id = OLD.category_id;
    END IF;
    RETURN OLD;
  END IF;
  
  -- Handle is_active changes
  IF TG_OP = 'UPDATE' AND OLD.is_active IS DISTINCT FROM NEW.is_active AND NEW.category_id IS NOT NULL THEN
    UPDATE public.categories 
    SET product_count = (
      SELECT COUNT(*) FROM public.products WHERE category_id = NEW.category_id AND is_active = true
    )
    WHERE id = NEW.category_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for products table
DROP TRIGGER IF EXISTS trigger_update_category_product_count ON public.products;
CREATE TRIGGER trigger_update_category_product_count
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_category_product_count();

-- Update all category counts to current values
UPDATE public.categories c
SET product_count = (
  SELECT COUNT(*) FROM public.products p WHERE p.category_id = c.id AND p.is_active = true
);