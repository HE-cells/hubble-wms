// api/holidays.js — Public holidays CRUD

import { supabase } from '../config.js';
import { toISODate } from '../format.js';

const HOLIDAY_SELECT = `
  id, year, date, name, country_code, department_code, is_active, created_at,
  department:departments(code, label)
`;

// Fetch holidays overlapping the calendar year, bridging year boundaries so
// multi-day clusters spanning Dec/Jan appear complete in both adjacent years.
export async function getPublicHolidays(year) {
  const windowStart = `${year - 1}-12-01`;
  const windowEnd   = `${year + 1}-01-31`;
  const { data, error } = await supabase
    .from('public_holidays')
    .select(HOLIDAY_SELECT)
    .gte('date', windowStart)
    .lte('date', windowEnd)
    .eq('is_active', true)
    .order('date');
  if (error) throw error;
  return data || [];
}

// Create a contiguous range of holiday rows (one row per day, same name/dept).
// Max 60 days. Each row's year column = that date's calendar year.
export async function createPublicHolidayRange({ startDate, endDate, name, countryCode = 'TH', departmentCode = null }) {
  const start = new Date(startDate + 'T00:00:00');
  const end   = new Date(endDate   + 'T00:00:00');
  if (end < start) throw new Error('End date must be on or after start date');

  const rows = [];
  const cur  = new Date(start);
  while (cur <= end) {
    if (rows.length > 60) throw new Error('Holiday range may not exceed 60 days');
    const ds = toISODate(cur);
    rows.push({
      year:            parseInt(ds.slice(0, 4), 10),
      date:            ds,
      name,
      country_code:    countryCode,
      department_code: departmentCode || null,
    });
    cur.setDate(cur.getDate() + 1);
  }

  const { data, error } = await supabase
    .from('public_holidays')
    .insert(rows)
    .select(HOLIDAY_SELECT);
  if (error) throw error;
  return data || [];
}

// Delete multiple holiday rows by id (used for whole-cluster deletes and range edits).
export async function deletePublicHolidays(ids) {
  if (!ids || ids.length === 0) return;
  const { error } = await supabase
    .from('public_holidays')
    .delete()
    .in('id', ids);
  if (error) throw error;
}

// ── Legacy single-row helpers (kept for compatibility) ──────────

export async function createPublicHoliday({ year, date, name, countryCode = 'TH', departmentCode = null }) {
  const { data, error } = await supabase
    .from('public_holidays')
    .insert({ year, date, name, country_code: countryCode, department_code: departmentCode || null })
    .select(HOLIDAY_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function updatePublicHoliday(id, { date, name, countryCode, departmentCode, isActive }) {
  const patch = {};
  if (date           !== undefined) patch.date            = date;
  if (name           !== undefined) patch.name            = name;
  if (countryCode    !== undefined) patch.country_code    = countryCode;
  if (departmentCode !== undefined) patch.department_code = departmentCode || null;
  if (isActive       !== undefined) patch.is_active       = isActive;

  const { data, error } = await supabase
    .from('public_holidays')
    .update(patch)
    .eq('id', id)
    .select(HOLIDAY_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function deletePublicHoliday(id) {
  const { error } = await supabase.from('public_holidays').delete().eq('id', id);
  if (error) throw error;
}
