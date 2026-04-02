import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = window.SUPABASE_URL || '';
const supabaseAnonKey = window.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getResources(filters = {}) {
  let query = supabase
    .from('resources')
    .select(`
      *,
      category:categories(id, name, slug, icon),
      resource_tags(tag:tags(id, name, slug))
    `);

  if (filters.featured) {
    query = query.eq('featured', true);
  }

  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getResourceById(id) {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      category:categories(id, name, slug, icon),
      resource_tags(tag:tags(id, name, slug))
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRepositories(filters = {}) {
  let query = supabase
    .from('repositories')
    .select(`
      *,
      category:categories(id, name, slug, icon)
    `);

  if (filters.language) {
    query = query.eq('language', filters.language);
  }

  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  query = query.order('stars', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function incrementViewCount(resourceId) {
  const { error } = await supabase.rpc('increment_view_count', {
    resource_id: resourceId
  });

  if (error) console.error('Error incrementing view count:', error);
}
