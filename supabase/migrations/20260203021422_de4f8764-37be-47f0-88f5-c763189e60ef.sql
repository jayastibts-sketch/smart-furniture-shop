-- Add cancellation and refund columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS refund_requested_at timestamp with time zone;

-- Add comment for refund_status values: 'pending', 'approved', 'processed', 'rejected'