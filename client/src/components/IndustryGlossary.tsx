import { HelpCircle } from "lucide-react";

const terms = [
  ["Sync / synch", "A license for music used with visual media such as film, television, games, advertising or social video."],
  ["Royalties", "Payments collected for an authorized use of music. The collection path depends on the right, use and agreement involved."],
  ["Master", "The specific sound recording. It is separate from the underlying composition and lyrics."],
  ["PRO", "Performing rights organization. A PRO such as ASCAP licenses and tracks public performances of musical works."],
];

export default function IndustryGlossary() {
  return (
    <aside className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4" aria-labelledby="industry-glossary-title">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-purple-700" aria-hidden="true" />
        <h4 id="industry-glossary-title" className="font-semibold text-gray-900">Quick glossary</h4>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {terms.map(([term, definition]) => (
          <span key={term} className="group relative">
            <button type="button" className="rounded-full border border-purple-300 bg-white px-3 py-1.5 text-sm font-medium text-purple-800 underline decoration-dotted underline-offset-2 focus:outline-none focus:ring-2 focus:ring-purple-500" aria-describedby={`glossary-${term}`}>
              {term}
            </button>
            <span id={`glossary-${term}`} role="tooltip" className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-left text-xs leading-5 text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {definition}
            </span>
          </span>
        ))}
      </div>
    </aside>
  );
}
