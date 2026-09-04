export const AI_DISCLOSURE_LEVEL_VALUES = ["ai_assisted", "primarily_ai_generated"] as const;

export const AI_DISCLOSURE_COMPONENT_VALUES = [
  "writing_lyrics_script",
  "composition_melody",
  "voice_vocals",
  "instruments_performance_sound",
  "production_arrangement",
  "editing_mixing_mastering",
  "artwork_graphics",
  "video_animation",
  "other",
] as const;

export const AI_DISCLOSURE_LEVELS = [
  {
    value: "ai_assisted",
    label: "AI-assisted",
    description: "AI contributed to selected parts of a substantially creator-led work.",
  },
  {
    value: "primarily_ai_generated",
    label: "Primarily AI-generated",
    description: "AI generated a substantial or primary portion of the disclosed components.",
  },
] as const;

export const AI_DISCLOSURE_COMPONENTS = [
  { value: "writing_lyrics_script", label: "Writing, lyrics, or script" },
  { value: "composition_melody", label: "Composition or melody" },
  { value: "voice_vocals", label: "Voice or vocals" },
  { value: "instruments_performance_sound", label: "Instruments, performance, or generated sound" },
  { value: "production_arrangement", label: "Production or arrangement" },
  { value: "editing_mixing_mastering", label: "Editing, mixing, or mastering" },
  { value: "artwork_graphics", label: "Artwork or graphics" },
  { value: "video_animation", label: "Video or animation" },
  { value: "other", label: "Other" },
] as const;

export type AiDisclosureLevel = (typeof AI_DISCLOSURE_LEVEL_VALUES)[number];
export type AiDisclosureComponent = (typeof AI_DISCLOSURE_COMPONENT_VALUES)[number];

export interface AiDisclosureFormValue {
  enabled: boolean;
  level: AiDisclosureLevel | "";
  components: AiDisclosureComponent[];
  tools: string;
  notes: string;
}

export interface AiDisclosureRecord {
  aiUseDisclosureEnabled?: boolean | null;
  aiUseLevel?: string | null;
  aiUseComponents?: string[] | null;
  aiUseTools?: string | null;
  aiUseNotes?: string | null;
}

export const EMPTY_AI_DISCLOSURE: AiDisclosureFormValue = {
  enabled: false,
  level: "",
  components: [],
  tools: "",
  notes: "",
};

export function getAiDisclosureLevelLabel(level: string | null | undefined) {
  return AI_DISCLOSURE_LEVELS.find((option) => option.value === level)?.label ?? "AI use disclosed";
}

export function getAiDisclosureComponentLabel(component: string) {
  return AI_DISCLOSURE_COMPONENTS.find((option) => option.value === component)?.label ?? component;
}

export function getAiDisclosureFormValue(record?: AiDisclosureRecord | null): AiDisclosureFormValue {
  const validLevel = AI_DISCLOSURE_LEVEL_VALUES.find((value) => value === record?.aiUseLevel) ?? "";
  const validComponents = (record?.aiUseComponents ?? []).filter((component): component is AiDisclosureComponent =>
    (AI_DISCLOSURE_COMPONENT_VALUES as readonly string[]).includes(component),
  );

  return {
    enabled: record?.aiUseDisclosureEnabled === true,
    level: validLevel,
    components: validComponents,
    tools: record?.aiUseTools ?? "",
    notes: record?.aiUseNotes ?? "",
  };
}
