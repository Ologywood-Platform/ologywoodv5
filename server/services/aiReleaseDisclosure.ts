import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AI_DISCLOSURE_COMPONENT_VALUES,
  AI_DISCLOSURE_LEVEL_VALUES,
  type AiDisclosureComponent,
  type AiDisclosureLevel,
  type AiDisclosureRecord,
} from "../../shared/aiDisclosure";

const aiUseLevelSchema = z.enum(AI_DISCLOSURE_LEVEL_VALUES);
const aiUseComponentSchema = z.enum(AI_DISCLOSURE_COMPONENT_VALUES);

export const aiDisclosureInputShape = {
  aiUseDisclosureEnabled: z.boolean().optional(),
  aiUseLevel: aiUseLevelSchema.nullable().optional(),
  aiUseComponents: z.array(aiUseComponentSchema).max(AI_DISCLOSURE_COMPONENT_VALUES.length).optional(),
  aiUseTools: z.string().trim().max(300).nullable().optional(),
  aiUseNotes: z.string().trim().max(1000).nullable().optional(),
} as const;

export interface NormalizedAiDisclosure {
  aiUseDisclosureEnabled: boolean;
  aiUseLevel: AiDisclosureLevel | null;
  aiUseComponents: AiDisclosureComponent[];
  aiUseTools: string | null;
  aiUseNotes: string | null;
}

export const EMPTY_AI_DISCLOSURE_DB: NormalizedAiDisclosure = {
  aiUseDisclosureEnabled: false,
  aiUseLevel: null,
  aiUseComponents: [],
  aiUseTools: null,
  aiUseNotes: null,
};

type AiDisclosureInput = {
  aiUseDisclosureEnabled?: boolean;
  aiUseLevel?: AiDisclosureLevel | null;
  aiUseComponents?: AiDisclosureComponent[];
  aiUseTools?: string | null;
  aiUseNotes?: string | null;
};

const AI_INPUT_KEYS: (keyof AiDisclosureInput)[] = [
  "aiUseDisclosureEnabled",
  "aiUseLevel",
  "aiUseComponents",
  "aiUseTools",
  "aiUseNotes",
];

function cleanOptionalText(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export function normalizeAiDisclosure(
  input: AiDisclosureInput,
  existing?: AiDisclosureRecord | null,
): NormalizedAiDisclosure | null {
  const touched = AI_INPUT_KEYS.some((key) => input[key] !== undefined);
  if (!touched) return null;

  const enabled = input.aiUseDisclosureEnabled ?? existing?.aiUseDisclosureEnabled === true;
  if (!enabled) return { ...EMPTY_AI_DISCLOSURE_DB };

  const level = input.aiUseLevel ?? existing?.aiUseLevel ?? null;
  if (!level || !(AI_DISCLOSURE_LEVEL_VALUES as readonly string[]).includes(level)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Choose whether the release is AI-assisted or primarily AI-generated.",
    });
  }

  const componentSource = input.aiUseComponents ?? existing?.aiUseComponents ?? [];
  const components = Array.from(new Set(componentSource)).filter((component): component is AiDisclosureComponent =>
    (AI_DISCLOSURE_COMPONENT_VALUES as readonly string[]).includes(component),
  );
  if (components.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Select at least one component that involved AI.",
    });
  }

  return {
    aiUseDisclosureEnabled: true,
    aiUseLevel: level as AiDisclosureLevel,
    aiUseComponents: components,
    aiUseTools: cleanOptionalText(input.aiUseTools ?? existing?.aiUseTools),
    aiUseNotes: cleanOptionalText(input.aiUseNotes ?? existing?.aiUseNotes),
  };
}
