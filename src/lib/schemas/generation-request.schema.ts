import { z } from "zod";

/**
 * Zod schema for validating generation request creation
 * Validates the input_text field according to API requirements
 */
export const CreateGenerationRequestSchema = z.object({
  input_text: z
    .string({
      required_error: "Input text is required",
      invalid_type_error: "Input text must be a string",
    })
    .min(1000, "Input text must be between 1000 and 10000 characters")
    .max(10000, "Input text must be between 1000 and 10000 characters"),
});

/**
 * Type inference from the schema
 */
export type CreateGenerationRequestInput = z.infer<typeof CreateGenerationRequestSchema>;
