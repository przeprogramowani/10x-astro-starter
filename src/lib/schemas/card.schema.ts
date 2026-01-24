import { z } from "zod";

/**
 * Schema for a single card in the create request
 */
const CardItemSchema = z.object({
  front: z
    .string({
      required_error: "Front is required",
      invalid_type_error: "Front must be a string",
    })
    .min(1, "Front must be between 1 and 200 characters")
    .max(200, "Front must be between 1 and 200 characters"),
  back: z
    .string({
      required_error: "Back is required",
      invalid_type_error: "Back must be a string",
    })
    .min(1, "Back must be between 1 and 500 characters")
    .max(500, "Back must be between 1 and 500 characters"),
});

/**
 * Schema for creating cards (accepts array of card objects)
 * Validates both single and multiple card creation
 */
export const CreateCardsSchema = z
  .array(CardItemSchema, {
    required_error: "Request body must be an array of cards",
    invalid_type_error: "Request body must be an array of cards",
  })
  .min(1, "At least one card must be provided")
  .max(50, "Maximum 50 cards can be created at once");

/**
 * Schema for updating a card (all fields optional, at least one required)
 */
export const UpdateCardSchema = z
  .object({
    front: z
      .string()
      .min(1, "Front must be between 1 and 200 characters")
      .max(200, "Front must be between 1 and 200 characters")
      .optional(),
    back: z
      .string()
      .min(1, "Back must be between 1 and 500 characters")
      .max(500, "Back must be between 1 and 500 characters")
      .optional(),
    repetitions: z.number().int().min(0, "Repetitions must be >= 0").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * Schema for GET /api/cards query parameters
 * Validates pagination, filtering, and sorting options
 */
export const GetCardsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  source: z.enum(["manual", "ai"]).optional(),
  sort: z.enum(["created_at", "updated_at", "repetitions"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Type inference from schemas
 */
export type CreateCardsInput = z.infer<typeof CreateCardsSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type GetCardsQueryInput = z.infer<typeof GetCardsQuerySchema>;
