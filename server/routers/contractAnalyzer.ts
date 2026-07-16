import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const ANALYZER_SYSTEM_PROMPT = `You are a contract compliance analyzer specializing in NIL (Name, Image, Likeness) agreements for college athletes. Your role is to review contract text and identify compliance issues based on standard NCAA requirements.

IMPORTANT:
- You are NOT providing legal advice. You are providing an educational compliance checklist.
- Analyze the contract for common NCAA NIL compliance requirements.
- Be specific about what is present, what is missing, and what may be problematic.
- Focus on these key areas:

1. PARTIES & IDENTIFICATION: Are all parties clearly identified? Is the athlete's school/conference mentioned?
2. COMPENSATION: Is compensation clearly defined? Are payment terms specific?
3. TERM & DURATION: Is the agreement duration clearly stated? Are renewal terms defined?
4. MEDIA RIGHTS: Are likeness usage rights clearly scoped? Is there a time limit?
5. NCAA COMPLIANCE: Does it mention NCAA rules? School disclosure requirements? Conflicting brands?
6. SCHOOL APPROVAL: Does it require or reference school/compliance office approval?
7. CANCELLATION: Are termination rights clearly defined for both parties?
8. EXCLUSIVITY: Are exclusivity restrictions reasonable and clearly defined?
9. CONTENT APPROVAL: Does the athlete retain approval rights over their likeness usage?
10. DISCLOSURE: Does it address required disclosure of the NIL relationship?

For each area, provide:
- status: "pass" (clearly addressed), "warning" (partially addressed or potentially problematic), or "fail" (missing or non-compliant)
- finding: A brief explanation of what you found or what's missing
- recommendation: If warning or fail, what should be added or changed`;

const analysisSchema = {
  type: "object" as const,
  properties: {
    overallScore: {
      type: "number" as const,
      description: "Overall compliance score from 0-100",
    },
    overallAssessment: {
      type: "string" as const,
      description: "Brief 1-2 sentence overall assessment",
    },
    areas: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const, description: "Area name" },
          status: { type: "string" as const, description: "pass, warning, or fail" },
          finding: { type: "string" as const, description: "What was found" },
          recommendation: { type: "string" as const, description: "What to improve, empty if pass" },
        },
        required: ["name", "status", "finding", "recommendation"] as const,
        additionalProperties: false as const,
      },
    },
    missingClauses: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "List of important clauses that are completely missing",
    },
    redFlags: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Any potentially problematic terms that could harm the athlete",
    },
  },
  required: ["overallScore", "overallAssessment", "areas", "missingClauses", "redFlags"] as const,
  additionalProperties: false as const,
};

export const contractAnalyzerRouter = router({
  analyzeContract: protectedProcedure
    .input(
      z.object({
        contractText: z.string().min(50, "Contract text must be at least 50 characters").max(50000, "Contract text is too long (max 50,000 characters)"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: ANALYZER_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Please analyze the following NIL contract/agreement for NCAA compliance:\n\n---\n${input.contractText}\n---\n\nProvide your analysis in the structured format.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "contract_analysis",
              strict: true,
              schema: analysisSchema,
            },
          },
        });

        const content = result.choices?.[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("No analysis returned");
        }

        const analysis = JSON.parse(content);
        return {
          success: true,
          analysis,
          disclaimer:
            "This analysis is for educational purposes only and does not constitute legal advice. Always consult with a qualified attorney and your school's compliance office before signing any NIL agreement.",
        };
      } catch (error: any) {
        console.error("[ContractAnalyzer] Error:", error);
        return {
          success: false,
          analysis: null,
          disclaimer:
            "This analysis is for educational purposes only and does not constitute legal advice.",
          error: "Unable to analyze the contract at this time. Please try again.",
        };
      }
    }),
});
