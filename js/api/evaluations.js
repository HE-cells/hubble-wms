// api/evaluations.js — Module M5: evaluation cycles, question bank, evaluations, responses, KPI feed

import { supabase } from '../config.js';

// ── SELECT constants ──────────────────────────────────────────

const CYCLE_SELECT = `
  id, name, cycle_type, period_start, period_end, response_deadline, status, created_at
`;

const EVAL_SELECT = `
  id, cycle_id, employee_id, manager_id, status,
  self_submitted_at, manager_submitted_at,
  final_rating, final_note, published_at, created_at,
  cycle:evaluation_cycles(id, name, cycle_type, period_start, period_end, response_deadline, status),
  employee:employees!evaluations_employee_id_fkey(id, full_name, employee_id, job_title, department_code, start_date),
  manager:employees!evaluations_manager_id_fkey(id, full_name, employee_id)
`;

// ── Cycles (admin) ────────────────────────────────────────────

export async function getCycles() {
  const { data, error } = await supabase
    .from('evaluation_cycles')
    .select(CYCLE_SELECT)
    .order('period_start', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCycle({ name, cycleType, periodStart, periodEnd, responseDeadline }) {
  const { data, error } = await supabase
    .from('evaluation_cycles')
    .insert({
      name,
      cycle_type: cycleType,
      period_start: periodStart,
      period_end: periodEnd,
      response_deadline: responseDeadline || null,
    })
    .select(CYCLE_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function updateCycle(id, patch) {
  const { data, error } = await supabase
    .from('evaluation_cycles')
    .update(patch)
    .eq('id', id)
    .select(CYCLE_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function setCycleStatus(id, status) {
  return updateCycle(id, { status });
}

// ── Question bank ─────────────────────────────────────────────

export async function getQuestions() {
  const { data, error } = await supabase
    .from('evaluation_questions')
    .select('id, code, section, kind, asked_of, label_en, label_th, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Evaluations ───────────────────────────────────────────────

// RLS scopes rows: employees see their own, managers their team's, admin all.
export async function getVisibleEvaluations() {
  const { data, error } = await supabase
    .from('evaluations')
    .select(EVAL_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getEvaluation(id) {
  const { data, error } = await supabase
    .from('evaluations')
    .select(EVAL_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Responses ─────────────────────────────────────────────────

// RLS filters by role + evaluation status (e.g. manager rows hidden until published).
export async function getResponses(evaluationId) {
  const { data, error } = await supabase
    .from('evaluation_responses')
    .select('id, evaluation_id, question_id, respondent_role, rating, answer')
    .eq('evaluation_id', evaluationId);
  if (error) throw error;
  return data || [];
}

// items: [{ questionId, rating, answer }] — upserts the caller's draft for one role.
export async function saveResponses(evaluationId, role, items) {
  if (!items.length) return [];
  const rows = items.map(i => ({
    evaluation_id: evaluationId,
    question_id: i.questionId,
    respondent_role: role,
    rating: i.rating ?? null,
    answer: i.answer ?? null,
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase
    .from('evaluation_responses')
    .upsert(rows, { onConflict: 'evaluation_id,question_id,respondent_role' })
    .select('id, question_id, respondent_role');
  if (error) throw error;
  return data || [];
}

// ── Status transitions ────────────────────────────────────────

export async function submitSelf(evaluationId) {
  const { data, error } = await supabase
    .from('evaluations')
    .update({ status: 'self_submitted', self_submitted_at: new Date().toISOString() })
    .eq('id', evaluationId)
    .eq('status', 'self_pending')
    .select('id, status')
    .single();
  if (error) throw error;
  return data;
}

export async function submitManagerReview(evaluationId) {
  const { data, error } = await supabase
    .from('evaluations')
    .update({ status: 'manager_submitted', manager_submitted_at: new Date().toISOString() })
    .eq('id', evaluationId)
    .eq('status', 'self_submitted')
    .select('id, status')
    .single();
  if (error) throw error;
  return data;
}

// Admin: publish final outcome — single UPDATE so final fields never exist pre-publish.
export async function publishEvaluation(evaluationId, finalRating, finalNote, publishedBy) {
  const { data, error } = await supabase
    .from('evaluations')
    .update({
      status: 'published',
      final_rating: finalRating,
      final_note: finalNote || null,
      published_by: publishedBy,
      published_at: new Date().toISOString(),
    })
    .eq('id', evaluationId)
    .select('id, status, final_rating')
    .single();
  if (error) throw error;
  return data;
}

// Admin correction path: reopen to an earlier stage (clears stage timestamps/final fields as needed).
export async function reopenEvaluation(evaluationId, toStatus) {
  const patch = { status: toStatus };
  if (toStatus === 'self_pending') { patch.self_submitted_at = null; patch.manager_submitted_at = null; }
  if (toStatus === 'self_submitted') patch.manager_submitted_at = null;
  if (toStatus !== 'published') {
    patch.final_rating = null;
    patch.final_note = null;
    patch.published_by = null;
    patch.published_at = null;
  }
  const { data, error } = await supabase
    .from('evaluations')
    .update(patch)
    .eq('id', evaluationId)
    .select('id, status')
    .single();
  if (error) throw error;
  return data;
}

// ── RPCs ──────────────────────────────────────────────────────

// Admin bulk-assign: creates evaluations for active employees, snapshots their manager.
export async function assignEvaluations(cycleId, employeeIds) {
  const { data, error } = await supabase
    .rpc('create_cycle_evaluations', { p_cycle_id: cycleId, p_employee_ids: employeeIds });
  if (error) throw error;
  return data; // count of rows inserted
}

// KPI feed for an employee over a period. Returns one row:
// { working_days, days_with_entries, attendance_rate, total_hours, billable_hours, utilization_rate, project_hours }
export async function getEvaluationKpis(employeeId, periodStart, periodEnd) {
  const { data, error } = await supabase
    .rpc('get_evaluation_kpis', { p_employee_id: employeeId, p_start: periodStart, p_end: periodEnd });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
