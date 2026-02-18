-- Create activity logs table for audit purposes
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Moderators can view all logs
CREATE POLICY "Moderators can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Admins can insert logs
CREATE POLICY "Admins can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Moderators can insert logs
CREATE POLICY "Moderators can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);