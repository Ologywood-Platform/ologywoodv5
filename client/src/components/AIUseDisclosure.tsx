import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_DISCLOSURE_COMPONENTS,
  AI_DISCLOSURE_LEVELS,
  getAiDisclosureComponentLabel,
  getAiDisclosureLevelLabel,
  type AiDisclosureComponent,
  type AiDisclosureFormValue,
  type AiDisclosureRecord,
} from "@shared/aiDisclosure";
import { ChevronDown, Sparkles } from "lucide-react";

interface AiUseDisclosureFieldsProps {
  value: AiDisclosureFormValue;
  onChange: (value: AiDisclosureFormValue) => void;
  error?: string;
  idPrefix: string;
}

export function AIUseDisclosureFields({ value, onChange, error, idPrefix }: AiUseDisclosureFieldsProps) {
  const update = (changes: Partial<AiDisclosureFormValue>) => onChange({ ...value, ...changes });
  const toggleComponent = (component: AiDisclosureComponent, checked: boolean) => {
    const components = checked
      ? Array.from(new Set([...value.components, component]))
      : value.components.filter((item) => item !== component);
    update({ components });
  };

  return (
    <section className={`rounded-lg border p-4 ${error ? "border-destructive" : "border-border"}`} aria-labelledby={`${idPrefix}-heading`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`${idPrefix}-heading`} className="font-semibold">AI Use Disclosure</h3>
            <Badge variant="outline" className="text-[10px]">Optional transparency</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Turn this on only if you want to publicly describe how AI contributed. Leaving it off means no disclosure was provided—not that OlogyWood verified the release as AI-free.
          </p>
        </div>
        <Switch
          id={`${idPrefix}-enabled`}
          checked={value.enabled}
          onCheckedChange={(enabled) => update({ enabled })}
          aria-label="Disclose AI use on this release"
        />
      </div>

      {value.enabled && (
        <div className="mt-5 space-y-5 border-t pt-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">How much of the release used AI? *</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {AI_DISCLOSURE_LEVELS.map((option) => {
                const id = `${idPrefix}-level-${option.value}`;
                return (
                  <label key={option.value} htmlFor={id} className={`cursor-pointer rounded-md border p-3 ${value.level === option.value ? "border-primary bg-primary/5" : "border-border"}`}>
                    <span className="flex items-start gap-2">
                      <input
                        id={id}
                        type="radio"
                        name={`${idPrefix}-level`}
                        value={option.value}
                        checked={value.level === option.value}
                        onChange={() => update({ level: option.value })}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="block text-xs text-muted-foreground">{option.description}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Which components involved AI? *</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {AI_DISCLOSURE_COMPONENTS.map((component) => {
                const id = `${idPrefix}-component-${component.value}`;
                return (
                  <label key={component.value} htmlFor={id} className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 text-sm">
                    <Checkbox
                      id={id}
                      checked={value.components.includes(component.value)}
                      onCheckedChange={(checked) => toggleComponent(component.value, checked === true)}
                      className="mt-0.5"
                    />
                    <span>{component.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-tools`}>AI tools or providers (optional)</Label>
            <Input
              id={`${idPrefix}-tools`}
              value={value.tools}
              onChange={(event) => update({ tools: event.target.value })}
              maxLength={300}
              placeholder="e.g., tool names used in the creative process"
            />
            <p className="text-right text-xs text-muted-foreground">{value.tools.length}/300</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-notes`}>Creator explanation (optional)</Label>
            <Textarea
              id={`${idPrefix}-notes`}
              value={value.notes}
              onChange={(event) => update({ notes: event.target.value })}
              maxLength={1000}
              rows={3}
              placeholder="Share any context you want fans to know about your creative process."
            />
            <p className="text-right text-xs text-muted-foreground">{value.notes.length}/1000</p>
          </div>

          <p className="text-xs text-muted-foreground">
            This disclosure does not replace rights certification. You remain responsible for copyright, consent, licensing, and permissions.
          </p>
          {error && <p className="text-xs font-medium text-destructive" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}

interface AiUseDisclosureTagProps {
  disclosure: AiDisclosureRecord;
  className?: string;
}

export function AIUseDisclosureTag({ disclosure, className = "" }: AiUseDisclosureTagProps) {
  if (!disclosure.aiUseDisclosureEnabled) return null;

  const components = disclosure.aiUseComponents ?? [];
  const label = getAiDisclosureLevelLabel(disclosure.aiUseLevel);

  return (
    <details className={`group ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Badge className="gap-1 bg-violet-100 text-violet-900 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-100">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {label}
          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true" />
        </Badge>
      </summary>
      <div className="mt-2 space-y-2 rounded-md border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-950 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-50">
        <p className="font-medium">Creator-provided AI use disclosure</p>
        {components.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {components.map((component) => (
              <span key={component} className="rounded-full border border-violet-300 px-2 py-0.5 dark:border-violet-700">
                {getAiDisclosureComponentLabel(component)}
              </span>
            ))}
          </div>
        )}
        {disclosure.aiUseTools && <p><span className="font-medium">Tools/providers:</span> {disclosure.aiUseTools}</p>}
        {disclosure.aiUseNotes && <p className="whitespace-pre-wrap"><span className="font-medium">Creator note:</span> {disclosure.aiUseNotes}</p>}
        <p className="text-[10px] opacity-80">Creator-provided disclosure. OlogyWood does not independently verify AI use, ownership, or rights.</p>
      </div>
    </details>
  );
}
