import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const STORAGE_KEY = "ologywood-professional-toolbelt-progress-v2";

const checklistItems = [
  { id: "rights", guide: "toolbelt-know-your-rights", label: "Know Your Rights: I can identify the composition, master, publishing and performance rights in my project." },
  { id: "money", guide: "toolbelt-royalty-map", label: "Follow the Money: I know which royalty and rights-administration paths may apply to my work." },
  { id: "sync", guide: "toolbelt-sync-ready", label: "Get Sync Ready: I have the rights documents, instrumental, stems and contacts needed for a licensing conversation." },
  { id: "radio", guide: "toolbelt-radio-streaming", label: "Radio, Streaming & Distribution: my credits, identifiers and delivery records are organized." },
  { id: "deal", guide: "toolbelt-review-opportunity", label: "Understand the Deal: I review territory, term, exclusivity, editing, advertising, AI/training and sublicensing language." },
  { id: "toolkit", guide: "toolbelt-release-checklist", label: "Build Your Professional Toolkit: I keep agreements, cue sheets, statements, licenses and version history together." },
];

function checklistText(completed: Record<string, boolean>) {
  return [
    "OlogyWood Professional Toolbelt — Creator Readiness Checklist",
    "",
    ...checklistItems.map((item, index) => `${completed[item.id] ? "[x]" : "[ ]"} ${index + 1}. ${item.label}`),
    "",
    "This is a learning checklist, not a certification, legal compliance assessment or legal advice.",
  ].join("\n");
}

export default function ProfessionalToolbeltChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(JSON.parse(saved) as Record<string, boolean>);
    } catch {
      // Progress remains usable for the current session if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // Do not block guide reading when browser storage is unavailable.
    }
  }, [completed]);

  const finished = useMemo(() => checklistItems.filter(item => completed[item.id]).length, [completed]);
  const toggle = (id: string) => setCompleted(previous => ({ ...previous, [id]: !previous[id] }));
  const reset = () => setCompleted({});
  const copyChecklist = async () => {
    try {
      await navigator.clipboard.writeText(checklistText(completed));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    window.setTimeout(() => setCopyStatus("idle"), 3000);
  };

  return (
    <section className="mt-6 rounded-xl border border-purple-200 bg-white p-5" aria-labelledby="toolbelt-checklist-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 id="toolbelt-checklist-title" className="font-semibold text-gray-900">Creator Readiness Checklist</h4>
          <p className="mt-1 text-sm text-gray-600">Completed locally in this browser: {finished} of {checklistItems.length}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-medium">
          <button type="button" onClick={copyChecklist} className="text-purple-700 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">Copy My Checklist</button>
          <button type="button" onClick={() => window.print()} className="text-purple-700 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">Print</button>
          <button type="button" onClick={reset} className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">Reset</button>
        </div>
      </div>
      {copyStatus !== "idle" && <p className="mt-2 text-sm text-gray-600" role="status">{copyStatus === "copied" ? "Checklist copied to your clipboard." : "Copy was unavailable. Use Print or select the checklist text manually."}</p>}
      <div className="mt-4 space-y-3">
        {checklistItems.map(item => (
          <div key={item.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-purple-50">
            <input id={`toolbelt-check-${item.id}`} type="checkbox" checked={Boolean(completed[item.id])} onChange={() => toggle(item.id)} className="mt-1 h-4 w-4 accent-purple-600" />
            <label htmlFor={`toolbelt-check-${item.id}`} className="flex-1 cursor-pointer text-sm leading-6 text-gray-700">{item.label}</label>
            <Link href={`/help?article=${item.guide}`} className="shrink-0 text-xs font-semibold text-purple-700 underline underline-offset-2 hover:text-purple-900">Guide</Link>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-gray-500">Your progress is stored only in this browser. OlogyWood does not receive or verify these selections. This is a learning checklist, not a certification or legal compliance assessment.</p>
    </section>
  );
}
