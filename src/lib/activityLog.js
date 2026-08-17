import { supabase } from "./supabase";

/**
 * Records a non-critical user activity.
 *
 * IMPORTANT:
 * Failure to write history should not break
 * the main action the user was performing.
 */
export async function logActivity(
  action,
  {
    entityType = null,
    entityId = null,
    metadata = {},
  } = {}
) {
  try {
    const {
      data,
      error,
    } = await supabase.rpc(
      "log_activity",
      {
        p_action: action,
        p_entity_type:
          entityType,
        p_entity_id:
          entityId,
        p_metadata:
          metadata,
      }
    );

    if (error) {
      console.warn(
        "Activity logging failed:",
        error
      );

      return null;
    }

    return data;
  } catch (error) {
    console.warn(
      "Activity logging failed:",
      error
    );

    return null;
  }
}