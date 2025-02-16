import { supabase } from './supabase';
import type { DocumentInput } from './types';

export async function createDocument(document: DocumentInput) {
  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        ...document,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        status: 'draft'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function generateDocument(documentId: string, content: string) {
  const { data, error } = await supabase
    .from('documents')
    .update({ content, status: 'generated' })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}