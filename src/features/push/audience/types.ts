import { z } from "zod/v4";

export const AudienceDetectionSchema = z.object({
  developer: z
    .boolean()
    .describe("Affects APIs, integrations, tooling, build, or architecture."),

  implementor: z
    .boolean()
    .describe(
      "Affects admin, operations, configuration, or business workflows."
    ),

  user: z.boolean().describe("Affects end-user features, UX, or behavior."),
});

export type AudienceDetectionResult = z.infer<typeof AudienceDetectionSchema>;
