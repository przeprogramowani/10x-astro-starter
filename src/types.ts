import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Types
// ============================================================================
// Extract base entity types from the database schema for reuse

export type CardEntity = Database["public"]["Tables"]["cards"]["Row"];
export type CardInsertEntity = Database["public"]["Tables"]["cards"]["Insert"];
export type CardUpdateEntity = Database["public"]["Tables"]["cards"]["Update"];

export type GenerationRequestEntity = Database["public"]["Tables"]["generation_requests"]["Row"];
export type GenerationRequestInsertEntity = Database["public"]["Tables"]["generation_requests"]["Insert"];

export type EventEntity = Database["public"]["Tables"]["events"]["Row"];
export type EventInsertEntity = Database["public"]["Tables"]["events"]["Insert"];

// ============================================================================
// Card DTOs and Commands
// ============================================================================

/**
 * DTO for card responses
 * Maps directly to the cards table Row type
 * Used in: GET /api/cards, GET /api/cards/:id
 */
export type CardDTO = CardEntity;

/**
 * Command for creating a new card manually
 * Derived from CardInsertEntity, but only includes user-provided fields
 * System fields (id, user_id, source, repetitions, timestamps) are set by the API
 * Used in: POST /api/cards (array of CreateCardCommand)
 */
export type CreateCardCommand = Pick<CardInsertEntity, "front" | "back">;

/**
 * Command for updating an existing card
 * All fields are optional - at least one must be provided
 * Derived from CardUpdateEntity with only user-modifiable fields
 * Used in: PATCH /api/cards/:id
 */
export type UpdateCardCommand = Pick<CardUpdateEntity, "front" | "back" | "repetitions">;

/**
 * Response DTO for listing cards with pagination
 * Used in: GET /api/cards
 */
export interface CardsListResponseDTO {
  data: CardDTO[];
  pagination: PaginationMetadataDTO;
}

/**
 * Response DTO for deleting a card
 * Used in: DELETE /api/cards/:id
 */
export interface DeleteCardResponseDTO {
  message: string;
  deleted_id: string;
}

// ============================================================================
// Generation Request DTOs and Commands
// ============================================================================

/**
 * DTO for generation request responses
 * Maps directly to the generation_requests table Row type
 * Used in: GET /api/generation-requests, GET /api/generation-requests/:id
 */
export type GenerationRequestDTO = GenerationRequestEntity;

/**
 * Command for creating a new AI generation request
 * Only includes the input text; other fields are calculated by the API
 * Used in: POST /api/generation-requests
 */
export interface CreateGenerationRequestCommand {
  input_text: string;
}

/**
 * DTO for AI-suggested flashcard (not yet saved to database)
 * Used as part of GenerationRequestResponseDTO
 */
export interface SuggestedCardDTO {
  front: string;
  back: string;
}

/**
 * Response DTO for AI generation request
 * Returns the generation request metadata along with suggested cards
 * Used in: POST /api/generation-requests (response)
 */
export interface GenerationRequestResponseDTO {
  generation_request_id: string;
  generated_count: number;
  suggested_cards: SuggestedCardDTO[];
  created_at: string;
}

/**
 * Response DTO for listing generation requests with pagination
 * Used in: GET /api/generation-requests
 */
export interface GenerationRequestsListResponseDTO {
  data: GenerationRequestDTO[];
  pagination: PaginationMetadataDTO;
}

// ============================================================================
// Statistics DTOs
// ============================================================================

/**
 * DTO for card statistics
 * Calculated from cards table aggregations
 * Used in: GET /api/stats/cards
 */
export interface CardStatsDTO {
  total_cards: number;
  manual_cards: number;
  ai_cards: number;
  ai_acceptance_rate: number;
  total_repetitions: number;
  average_repetitions_per_card: number;
  cards_by_source: {
    manual: number;
    ai: number;
  };
  recent_activity: {
    cards_created_last_7_days: number;
    cards_created_last_30_days: number;
  };
}

/**
 * DTO for generation statistics
 * Calculated from generation_requests and cards tables
 * Used in: GET /api/stats/generation
 */
export interface GenerationStatsDTO {
  total_requests: number;
  total_generated: number;
  total_accepted: number;
  acceptance_rate: number;
  average_generated_per_request: number;
  recent_activity: {
    requests_last_7_days: number;
    requests_last_30_days: number;
  };
}

// ============================================================================
// User Management DTOs
// ============================================================================

/**
 * Response DTO for user account deletion
 * Used in: DELETE /api/users/me
 */
export interface DeleteUserResponseDTO {
  message: string;
}

// ============================================================================
// Common DTOs
// ============================================================================

/**
 * Common pagination metadata structure
 * Used across all paginated list endpoints
 */
export interface PaginationMetadataDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Individual validation error detail
 * Part of ValidationErrorResponseDTO
 */
export interface ValidationErrorDetailDTO {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Response DTO for validation errors (400 Bad Request)
 * Used when request validation fails
 */
export interface ValidationErrorResponseDTO {
  error: string;
  details: ValidationErrorDetailDTO[];
}

/**
 * Generic error response DTO
 * Used for various error responses (401, 404, 500, etc.)
 */
export interface ErrorResponseDTO {
  error: string;
  message: string;
}

/**
 * Rate limit error response DTO
 * Extended error response with rate limit details
 * Used in: POST /api/generation-requests (429 Too Many Requests)
 */
export interface RateLimitErrorResponseDTO extends ErrorResponseDTO {
  retry_after: number;
  limit?: number;
  remaining?: number;
  reset_at?: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Valid event type values
 * Based on the event_type field requirements from the API plan
 */
export type EventType =
  | "login"
  | "ai_generation"
  | "card_accepted"
  | "card_rejected"
  | "card_edited"
  | "card_deleted"
  | "card_created_manual";

/**
 * DTO for event responses (if needed)
 * Maps directly to the events table Row type
 */
export type EventDTO = EventEntity;

/**
 * Command for creating an event
 * Derived from EventInsertEntity with required fields
 */
export type CreateEventCommand = Pick<EventInsertEntity, "event_type" | "card_id" | "metadata">;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Query parameters for listing cards
 * Used in: GET /api/cards
 */
export interface GetCardsQueryParams {
  limit?: number;
  offset?: number;
  source?: "manual" | "ai";
  sort?: "created_at" | "updated_at" | "repetitions";
  order?: "asc" | "desc";
}

/**
 * Query parameters for listing generation requests
 * Used in: GET /api/generation-requests
 */
export interface GetGenerationRequestsQueryParams {
  limit?: number;
  offset?: number;
}
