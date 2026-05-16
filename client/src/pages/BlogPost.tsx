/**
 * BlogPost — renders a single published blog post by slug.
 * Content is stored as Markdown and rendered with a simple parser.
 */
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { Calendar, Tag, ArrowLeft, User, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SocialShareButtons from "@/components/SocialShareButtons";
import { setMetaTags } from "@/utils/seoMeta";
import { JsonLd, buildBreadcrumbJsonLd } from "@/components/JsonLd";
import { renderMarkdown } from "@/utils/renderMarkdown";

// renderMarkdown is now imported from @/utils/renderMarkdown

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
        ogImage: post.coverImageUrl || undefined,
        ogType: 'article',
        twitterCard: 'summary_large_image',
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
        <div className="w-full h-64 sm:h-80 overflow-hidden bg-gray-900 rounded-lg">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-contain"
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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Social Sharing */}
        <div className="mb-6">
          <SocialShareButtons
            title={post.title}
            description={post.excerpt}
            url={`${window.location.origin}/blog/${post.slug}`}
          />
        </div>

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

        {/* Bottom Share Bar */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-500">Enjoyed this article? Share it with your network.</p>
          <SocialShareButtons
            title={post.title}
            description={post.excerpt}
            url={`${window.location.origin}/blog/${post.slug}`}
          />
        </div>

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
