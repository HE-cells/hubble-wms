// api/tags.js

import { supabase } from '../config.js';

export async function getTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, color')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createTag({ name, color = '#8b97a2' }) {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, color })
    .select('id, name, color')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTag(id, { name, color }) {
  const payload = {};
  if (name  !== undefined) payload.name  = name;
  if (color !== undefined) payload.color = color;
  const { data, error } = await supabase
    .from('tags').update(payload).eq('id', id)
    .select('id, name, color').single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id) {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

/** Get usage count per tag (server-side GROUP BY via RPC). Returns { [tag_id]: count }. */
export async function getTagUsage() {
  const { data, error } = await supabase.rpc('get_tag_usage');
  if (error) throw error;
  const counts = {};
  for (const row of (data || [])) {
    counts[row.tag_id] = Number(row.usage_count) || 0;
  }
  return counts;
}
