import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { GenerationRequestEntity, GenerationRequestInsertEntity } from '../../types';

/**
 * Generation Request Service for managing AI generation requests
 * Handles CRUD operations on the generation_requests table
 */

/**
 * Type for Supabase client with proper database types
 */
export type SupabaseClientType = SupabaseClient<Database>;

/**
 * Creates a new generation request in the database
 * @param data - Generation request data to insert
 * @param supabase - Supabase client instance
 * @returns The created generation request entity with id and created_at
 * @throws Error if database operation fails
 */
export async function createGenerationRequest(
  data: GenerationRequestInsertEntity,
  supabase: SupabaseClientType
): Promise<GenerationRequestEntity> {
  const { data: generationRequest, error } = await supabase
    .from('generation_requests')
    .insert({
      user_id: data.user_id,
      input_text: data.input_text,
      generated_count: data.generated_count,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create generation request:', error);
    throw new Error(`Failed to create generation request: ${error.message}`);
  }

  if (!generationRequest) {
    throw new Error('Generation request created but no data returned');
  }

  return generationRequest;
}
