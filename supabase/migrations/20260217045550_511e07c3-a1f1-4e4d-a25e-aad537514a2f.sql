
-- Create trigger function to update product rating and review_count when reviews change
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.products
    SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE product_id = OLD.product_id::text), 0),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = OLD.product_id::text)
    WHERE id::text = OLD.product_id;
    RETURN OLD;
  ELSE
    UPDATE public.products
    SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE product_id = NEW.product_id::text), 0),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = NEW.product_id::text)
    WHERE id::text = NEW.product_id;
    RETURN NEW;
  END IF;
END;
$function$;

-- Create trigger on reviews table
CREATE TRIGGER update_product_stats_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_review_stats();
