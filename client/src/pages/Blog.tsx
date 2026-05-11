/**
 * Blog — public listing page showing published blog posts.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Calendar, Tag, ChevronRight, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";
import Footer from '@/components/Footer';

const CATEGORIES = [
  { value: undefined, label: "All" },
  { value: "announcement" as const, label: "Announcements" },
  { value: "guide" as const, label: "Guides" },
  { value: "news" as const, label: "News" },
  { value: "update" as const, label: "Updates" },
  { value: "tutorial" as const, label: "Tutorials" },
];

const POSTS_PER_PAGE = 9;

export default function Blog() {
  const [category, setCategory] = useState<"announcement" | "guide" | "news" | "update" | "tutorial" | undefined>(undefined);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setMetaTags(pageMetaTags.blog);
  }, []);

  const { data, isLoading } = trpc.blog.list.useQuery({
    limit: POSTS_PER_PAGE,
    offset: page * POSTS_PER_PAGE,
    category,
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Blog</h1>
          <p className="text-lg text-purple-200">
            Announcements, guides, and news from the Ologywood team.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => { setCategory(cat.value); setPage(0); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <section className="max-w-5xl mx-auto px-4 py-8 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                >
                  {/* Cover Image */}
                  {post.coverImageUrl ? (
                    <div className="h-48 overflow-hidden bg-gray-900">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-purple-300" />
                    </div>
                  )}

                  <div className="p-5">
                    {/* Category + Date */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor(post.category)}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    {post.tags && (post.tags as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(post.tags as string[]).slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More */}
                    <div className="mt-3 text-sm font-medium text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read more <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      page === i
                        ? "bg-purple-600 text-white"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
          <Footer />
    </div>
  );
}
