-- Create contact_requests table for customer inquiries from Contact page
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  handled_by UUID,
  handled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for admin/moderator access
CREATE POLICY "Admins can view all contact requests" 
ON public.contact_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can view all contact requests" 
ON public.contact_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can update contact requests" 
ON public.contact_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can update contact requests" 
ON public.contact_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow anyone to submit a contact request (public form)
CREATE POLICY "Anyone can insert contact requests" 
ON public.contact_requests 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contact_requests_updated_at
BEFORE UPDATE ON public.contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_contact_requests_status ON public.contact_requests(status);
CREATE INDEX idx_contact_requests_created_at ON public.contact_requests(created_at DESC);