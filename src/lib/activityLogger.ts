import { supabase } from "@/integrations/supabase/client";

interface LogActivityParams {
  action: string;
  entityType: "order" | "product" | "category" | "user";
  entityId: string;
  details?: Record<string, any>;
}

export async function logActivity({ action, entityType, entityId, details = {} }: LogActivityParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No user found for activity logging");
      return;
    }

    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
