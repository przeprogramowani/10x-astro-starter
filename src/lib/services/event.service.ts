import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateEventCommand, EventEntity } from "../../types";

/**
 * Event Service for logging user actions and system events
 * Handles creation of events in the events table
 */

/**
 * Type for Supabase client with proper database types
 */
export type SupabaseClientType = SupabaseClient<Database>;

/**
 * Creates a new event in the events table
 * @param eventData - Event data including type, card_id, and metadata
 * @param userId - ID of the user who triggered the event
 * @param supabase - Supabase client instance
 * @returns The created event entity
 * @throws Error if database operation fails
 */
export async function createEvent(
  eventData: CreateEventCommand,
  userId: string,
  supabase: SupabaseClientType
): Promise<EventEntity> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      event_type: eventData.event_type,
      card_id: eventData.card_id || null,
      metadata: eventData.metadata || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create event:", error);
    throw new Error(`Failed to create event: ${error.message}`);
  }

  if (!data) {
    throw new Error("Event created but no data returned");
  }

  return data;
}

/**
 * Creates an AI generation event
 * Helper function for logging AI flashcard generation events
 * @param generationRequestId - ID of the generation request
 * @param generatedCount - Number of flashcards generated
 * @param inputTextLength - Length of the input text
 * @param userId - ID of the user
 * @param supabase - Supabase client instance
 * @returns The created event entity
 */
export async function createAIGenerationEvent(
  generationRequestId: string,
  generatedCount: number,
  inputTextLength: number,
  userId: string,
  supabase: SupabaseClientType
): Promise<EventEntity> {
  return createEvent(
    {
      event_type: "ai_generation",
      card_id: null,
      metadata: {
        generation_request_id: generationRequestId,
        generated_count: generatedCount,
        input_text_length: inputTextLength,
      },
    },
    userId,
    supabase
  );
}

/**
 * Creates a card created manually event
 * Helper function for logging manual card creation
 * @param cardId - ID of the created card
 * @param userId - ID of the user
 * @param supabase - Supabase client instance
 * @returns The created event entity
 */
export async function createCardCreatedManualEvent(
  cardId: string,
  userId: string,
  supabase: SupabaseClientType
): Promise<EventEntity> {
  return createEvent(
    {
      event_type: "card_created_manual",
      card_id: cardId,
      metadata: null,
    },
    userId,
    supabase
  );
}

/**
 * Creates a card edited event
 * Helper function for logging card edits
 * @param cardId - ID of the edited card
 * @param userId - ID of the user
 * @param supabase - Supabase client instance
 * @returns The created event entity
 */
export async function createCardEditedEvent(
  cardId: string,
  userId: string,
  supabase: SupabaseClientType
): Promise<EventEntity> {
  return createEvent(
    {
      event_type: "card_edited",
      card_id: cardId,
      metadata: null,
    },
    userId,
    supabase
  );
}

/**
 * Creates a card deleted event
 * Helper function for logging card deletions
 * @param cardId - ID of the deleted card
 * @param userId - ID of the user
 * @param supabase - Supabase client instance
 * @returns The created event entity
 */
export async function createCardDeletedEvent(
  cardId: string,
  userId: string,
  supabase: SupabaseClientType
): Promise<EventEntity> {
  return createEvent(
    {
      event_type: "card_deleted",
      card_id: cardId,
      metadata: null,
    },
    userId,
    supabase
  );
}
