// api/jobTitleRequests.js — Job title change request CRUD

import { supabase } from '../config.js';

const SELECT = `
  id, employee_id, requested_by, current_title, requested_title, reason,
  status, reviewed_by, reviewed_at, review_note, created_at,
  employee:employees!job_title_change_requests_employee_id_fkey(id, full_name, employee_id),
  requester:profiles!job_title_change_requests_requested_by_fkey(id, name, email)
`;

export async function submitJobTitleChangeRequest({ employeeId, requestedBy, currentTitle, requestedTitle, reason }) {
  const { data, error } = await supabase
    .from('job_title_change_requests')
    .insert({
      employee_id:     employeeId,
      requested_by:    requestedBy,
      current_title:   currentTitle || null,
      requested_title: requestedTitle,
      reason:          reason || null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function getPendingJobTitleChangeRequests() {
  const { data, error } = await supabase
    .from('job_title_change_requests')
    .select(SELECT)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function approveJobTitleChangeRequest(id, reviewerId) {
  const { data: req, error: fetchErr } = await supabase
    .from('job_title_change_requests')
    .select('employee_id, requested_title, current_title')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;

  // Capture the employee's current title so we can roll back if the second
  // write fails (no DB transaction available from the client).
  const { data: emp } = await supabase
    .from('employees')
    .select('job_title')
    .eq('id', req.employee_id)
    .maybeSingle();
  const prevTitle = emp?.job_title ?? req.current_title ?? null;

  const { error: empErr } = await supabase
    .from('employees')
    .update({ job_title: req.requested_title })
    .eq('id', req.employee_id);
  if (empErr) throw empErr;

  const { data, error } = await supabase
    .from('job_title_change_requests')
    .update({ status: 'approved', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) {
    // Compensating revert: restore the previous job title so we don't leave
    // the employee retitled while the request is still pending.
    await supabase.from('employees').update({ job_title: prevTitle }).eq('id', req.employee_id);
    throw error;
  }
  return data;
}

export async function rejectJobTitleChangeRequest(id, reviewerId, note) {
  const { data, error } = await supabase
    .from('job_title_change_requests')
    .update({
      status:      'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
    })
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function cancelJobTitleChangeRequest(id) {
  const { data, error } = await supabase.from('job_title_change_requests')
    .update({ status: 'cancelled' }).eq('id', id).select('id, status').single();
  if (error) throw error; return data;
}
