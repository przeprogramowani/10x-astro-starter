import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  CardEntity,
  CardInsertEntity,
  CardsListResponseDTO,
  CreateCardCommand,
  GetCardsQueryParams,
} from "../../types";

/**
 * Card Service for managing flashcards
 * Handles CRUD operations on the cards table
 */

/**
 * Type for Supabase client with proper database types
 */
export type SupabaseClientType = SupabaseClient<Database>;

/**
 * Creates a single card in the database
 * @param cardData - Card data to insert (front, back)
 * @param userId - ID of the user creating the card
 * @param supabase - Supabase client instance
 * @returns The created card entity
 * @throws Error if database operation fails
 */
export async function createCard(
  cardData: CreateCardCommand,
  userId: string,
  supabase: SupabaseClientType
): Promise<CardEntity> {
  const insertData: CardInsertEntity = {
    user_id: userId,
    front: cardData.front,
    back: cardData.back,
    source: "manual",
    repetitions: 0,
  };

  const { data, error } = await supabase.from("cards").insert(insertData).select().single();

  if (error) {
    console.error("Failed to create card:", error);
    throw new Error(`Failed to create card: ${error.message}`);
  }

  if (!data) {
    throw new Error("Card created but no data returned");
  }

  return data;
}

/**
 * Creates multiple cards in the database (bulk insert)
 * @param cardsData - Array of card data to insert
 * @param userId - ID of the user creating the cards
 * @param supabase - Supabase client instance
 * @param source - Source of the cards ('manual' or 'ai'), defaults to 'manual'
 * @returns Array of created card entities
 * @throws Error if database operation fails
 */
export async function createCards(
  cardsData: CreateCardCommand[],
  userId: string,
  supabase: SupabaseClientType,
  source: "manual" | "ai" = "manual"
): Promise<CardEntity[]> {
  const insertData: CardInsertEntity[] = cardsData.map((card) => ({
    user_id: userId,
    front: card.front,
    back: card.back,
    source: source,
    repetitions: 0,
  }));

  const { data, error } = await supabase.from("cards").insert(insertData).select();

  if (error) {
    console.error("Failed to create cards:", error);
    throw new Error(`Failed to create cards: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Cards created but no data returned");
  }

  return data;
}

/**
 * Retrieves cards with pagination, filtering, and sorting
 * @param params - Query parameters (limit, offset, source, sort, order)
 * @param userId - ID of the user
 * @param supabase - Supabase client instance
 * @returns Cards list with pagination metadata
 * @throws Error if database operation fails
 */
export async function getCards(
  params: GetCardsQueryParams,
  userId: string,
  supabase: SupabaseClientType
): Promise<CardsListResponseDTO> {
  const { limit = 50, offset = 0, source, sort = "created_at", order = "desc" } = params;

  // Build query
  let query = supabase.from("cards").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply source filter if provided
  if (source) {
    query = query.eq("source", source);
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === "asc" });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to get cards:", error);
    throw new Error(`Failed to get cards: ${error.message}`);
  }

  // Calculate pagination metadata
  const total = count || 0;
  const hasMore = offset + limit < total;

  return {
    data: data || [],
    pagination: {
      total,
      limit,
      offset,
      has_more: hasMore,
    },
  };
}

/**
 * Retrieves a single card by ID
 * @param cardId - ID of the card to retrieve
 * @param userId - ID of the user (for ownership verification)
 * @param supabase - Supabase client instance
 * @returns The card entity or null if not found
 * @throws Error if database operation fails
 */
export async function getCardById(
  cardId: string,
  userId: string,
  supabase: SupabaseClientType
): Promise<CardEntity | null> {
  const { data, error } = await supabase.from("cards").select("*").eq("id", cardId).eq("user_id", userId).single();

  if (error) {
    // Not found is not an error, return null
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to get card:", error);
    throw new Error(`Failed to get card: ${error.message}`);
  }

  return data;
}

/**
 * Updates a card in the database
 * @param cardId - ID of the card to update
 * @param updateData - Fields to update
 * @param userId - ID of the user (for ownership verification)
 * @param supabase - Supabase client instance
 * @returns The updated card entity or null if not found
 * @throws Error if database operation fails
 */
export async function updateCard(
  cardId: string,
  updateData: Partial<Pick<CardEntity, "front" | "back" | "repetitions">>,
  userId: string,
  supabase: SupabaseClientType
): Promise<CardEntity | null> {
  const { data, error } = await supabase
    .from("cards")
    .update(updateData)
    .eq("id", cardId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    // Not found is not an error, return null
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to update card:", error);
    throw new Error(`Failed to update card: ${error.message}`);
  }

  return data;
}

/**
 * Deletes a card from the database
 * @param cardId - ID of the card to delete
 * @param userId - ID of the user (for ownership verification)
 * @param supabase - Supabase client instance
 * @returns The deleted card entity or null if not found
 * @throws Error if database operation fails
 */
export async function deleteCard(
  cardId: string,
  userId: string,
  supabase: SupabaseClientType
): Promise<CardEntity | null> {
  const { data, error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    // Not found is not an error, return null
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to delete card:", error);
    throw new Error(`Failed to delete card: ${error.message}`);
  }

  return data;
}
