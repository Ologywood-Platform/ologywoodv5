import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ologywood-professional-toolbelt-progress-v1";

const checklistItems = [
  { id: "rights", label: "I can identify the composition, master, publishing and performance rights in my project." },
  { id: "splits", label: "I have written split information for every writer, publisher and featured collaborator." },
  { id: "metadata", label: "I have gathered identifiers and release metadata, including ISRC and IPI/CAE details when available." },
  { id: "registrations", label: "I know which PRO, mechanical, neighboring-rights or rights-administration registrations fit my work." },
  { id: "opportunity", label: "I review territory, term, exclusivity, editing, advertising, AI/training and sublicensing language before opting in." },
  { id: "records", label: "I keep agreements, cue sheets, statements, licenses and version history in one secure place." },
];

export default function ProfessionalToolbeltChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

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

  return (
    <section className="mt-6 rounded-xl border border-purple-200 bg-white p-5" aria-labelledby="toolbelt-checklist-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 id="toolbelt-checklist-title" className="font-semibold text-gray-900">Track your Toolbelt progress</h4>
          <p className="mt-1 text-sm text-gray-600">Completed locally in this browser: {finished} of {checklistItems.length}</p>
        </div>
        <button type="button" onClick={reset} className="text-sm font-medium text-purple-700 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">Reset progress</button>
      </div>
      <div className="mt-4 space-y-3">
        {checklistItems.map(item => (
          <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-purple-50">
            <input type="checkbox" checked={Boolean(completed[item.id])} onChange={() => toggle(item.id)} className="mt-1 h-4 w-4 accent-purple-600" />
            <span className="text-sm leading-6 text-gray-700">{item.label}</span>
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-gray-500">Your checklist status is stored only in this browser. OlogyWood does not receive or verify these selections.</p>
    </section>
  );
}
