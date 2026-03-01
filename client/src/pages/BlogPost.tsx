/**
 * BlogPost — renders a single published blog post by slug.
 * Content is stored as Markdown and rendered with a simple parser.
 */
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { Calendar, Tag, ArrowLeft, User, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import { setMetaTags } from "@/utils/seoMeta";
import { JsonLd, buildBreadcrumbJsonLd } from "@/components/JsonLd";

/**
 * Minimal Markdown-to-HTML converter.
 * Handles headings, bold, italic, links, lists, code blocks, blockquotes, images, and paragraphs.
 */
function renderMarkdown(md: string): string {
  let html = md
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
        trimmed.startsWith("</")
      ) {
        return trimmed;
      }
      return `<p class="text-gray-700 leading-relaxed mb-4">${trimmed}</p>`;
    })
    .join("\n");

  return html;
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: post, isLoading } = trpc.blog.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  useEffect(() => {
    if (post) {
      setMetaTags({
        title: `${post.title} - Ologywood Blog`,
        description: post.excerpt,
        keywords: (post.tags as string[] || []).join(", "),
        ogUrl: `${window.location.origin}/blog/${post.slug}`,
      });
    }
  }, [post]);

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      announcement: "bg-purple-100 text-purple-700",
      guide: "bg-blue-100 text-blue-700",
      news: "bg-green-100 text-green-700",
      update: "bg-amber-100 text-amber-700",
      tutorial: "bg-cyan-100 text-cyan-700",
    };
    return colors[cat] || "bg-gray-100 text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-4 py-16 w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
            <p className="text-gray-500 mb-6">This blog post doesn't exist or has been removed.</p>
            <Link href="/blog" className="text-purple-600 font-medium hover:underline">
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <JsonLd
        id={`blog-${post.slug}`}
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />

      {/* Cover Image */}
      {post.coverImageUrl && (
        <div className="w-full h-64 sm:h-80 overflow-hidden">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 py-10 w-full">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryColor(post.category)}`}>
            {post.category}
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {post.authorName}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        {/* Tags */}
        {post.tags && (post.tags as string[]).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t">
            {(post.tags as string[]).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to get started?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Join Ologywood and connect with artists and venues today.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </article>
    </div>
  );
}
