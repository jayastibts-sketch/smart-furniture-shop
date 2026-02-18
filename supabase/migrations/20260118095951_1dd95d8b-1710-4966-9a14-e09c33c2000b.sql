-- Add RLS policies for moderators to view and update orders
CREATE POLICY "Moderators can view all orders" 
ON public.orders 
FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update order status" 
ON public.orders 
FOR UPDATE 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Add RLS policies for moderators to view all order items
CREATE POLICY "Moderators can view all order items" 
ON public.order_items 
FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Add RLS policies for moderators to view products (for reference)
-- Products are already publicly viewable, but moderators can update stock
CREATE POLICY "Moderators can update products" 
ON public.products 
FOR UPDATE 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Add RLS policy for moderators to view all profiles (for customer info)
CREATE POLICY "Moderators can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));