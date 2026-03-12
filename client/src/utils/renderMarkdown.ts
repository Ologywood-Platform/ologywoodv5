/**
 * Minimal Markdown-to-HTML converter.
 * Handles headings, bold, italic, links, lists, code blocks, blockquotes,
 * images, tables, and paragraphs.
 *
 * Shared between BlogPost (public) and BlogAdmin (preview).
 */
export function renderMarkdown(md: string): string {
  // First, extract and convert Markdown tables to HTML
  const tableRegex = /^(\|.+\|\n)(\|[-: |]+\|\n)((?:\|.+\|\n?)+)/gm;
  let processed = md.replace(tableRegex, (_match, headerRow: string, _separatorRow: string, bodyRows: string) => {
    const parseRow = (row: string) =>
      row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c: string) => c.trim());
    const headers = parseRow(headerRow);
    const rows = bodyRows.trim().split('\n').map(parseRow);
    let table = '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border border-gray-200 text-sm">';
    table += '<thead><tr>';
    headers.forEach((h: string) => {
      table += `<th class="border border-gray-200 bg-gray-50 px-4 py-2.5 text-left font-semibold text-gray-900">${h}</th>`;
    });
    table += '</tr></thead><tbody>';
    rows.forEach((row: string[], i: number) => {
      const bg = i % 2 === 0 ? '' : ' bg-gray-50/50';
      table += `<tr class="${bg}">`;
      row.forEach((cell: string) => {
        table += `<td class="border border-gray-200 px-4 py-2 text-gray-700">${cell}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table></div>';
    return table;
  });

  let html = processed
    // Code blocks (fenced)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm my-4"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-purple-700">$1</code>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-4 max-w-full" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-600 underline hover:text-purple-800" target="_blank" rel="noopener noreferrer">$1</a>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-10 mb-4">$1</h1>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-4">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700">$1</li>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-4 space-y-1">$1</ul>');

  // Wrap remaining plain text lines in paragraphs
  html = html
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<img") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<thead") ||
        trimmed.startsWith("<tbody") ||
        trimmed.startsWith("<tr") ||
        trimmed.startsWith("<th") ||
        trimmed.startsWith("<td") ||
        trimmed.startsWith("</")
      ) {
        return trimmed;
      }
      return `<p class="text-gray-700 leading-relaxed mb-4">${trimmed}</p>`;
    })
    .join("\n");

  return html;
}
