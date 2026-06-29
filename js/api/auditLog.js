// js/api/auditLog.js — General-purpose audit log helper
//
// Fire-and-forget: errors are swallowed (console.warn) so a logging
// failure never surfaces to the user or blocks the triggering action.
//
// Usage:
//   import { logAction } from '../api/auditLog.js';
//   logAction('approve_leave_request', 'leave_request', req.id, empName,
//             { status: { old: 'pending', new: 'approved' } });

import { supabase } from '../config.js';
import { getProfile } from '../auth.js';

export async function logAction(action, entityType, entityId = null, entityLabel = null, changes = null, note = null) {
  try {
    const profile = getProfile();
    if (!profile) return;
    const { error } = await supabase.from('audit_log').insert({
      actor_id:     profile.id,
      actor_name:   profile.name || profile.email,
      action,
      entity_type:  entityType,
      entity_id:    entityId    != null ? String(entityId)    : null,
      entity_label: entityLabel != null ? String(entityLabel) : null,
      changes:      changes  || null,
      note:         note     || null,
    });
    if (error) console.warn('[auditLog] insert failed:', error.message);
  } catch (err) {
    console.warn('[auditLog] unexpected error:', err);
  }
}
