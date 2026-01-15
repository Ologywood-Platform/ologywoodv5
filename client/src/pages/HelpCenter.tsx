import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  BookOpen,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  categoryId: number;
  tags?: string[];
  views: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [votedArticles, setVotedArticles] = useState<Set<number>>(new Set());

  const { data: categories = [] } = trpc.support.getCategories.useQuery();

  const { data: articles = [], isLoading: articlesLoading } = trpc.support.getArticles.useQuery({
    categoryId: selectedCategoryId && selectedCategoryId !== "all" ? parseInt(selectedCategoryId) : undefined,
    search: searchQuery || undefined,
    limit: 50,
  });

  const { data: faqs = [] } = trpc.support.getFAQs.useQuery({
    categoryId: selectedCategoryId && selectedCategoryId !== "all" ? parseInt(selectedCategoryId) : undefined,
    limit: 10,
  });

  const voteArticleMutation = trpc.support.voteArticle.useMutation({
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
    },
    onError: () => {
      toast.error("Failed to submit feedback");
    },
  });

  const handleVote = (articleId: number, helpful: boolean) => {
    if (votedArticles.has(articleId)) {
      toast.info("You've already voted on this article");
      return;
    }

    voteArticleMutation.mutate({ articleId, helpful });
    setVotedArticles((prev) => {
      const newSet = new Set(prev);
      newSet.add(articleId);
      return newSet;
    });
  };

  const filteredArticles = articles.filter((article: any) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
            <p className="text-sm text-slate-600">Find answers to common questions</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Articles List */}
          <div className="lg:col-span-2">
            {selectedArticle ? (
              <Card>
                <CardHeader>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedArticle(null)}
                    className="mb-4 -ml-2"
                  >
                    ← Back to Articles
                  </Button>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedArticle.title}</h2>
                  <div className="flex gap-2 mt-2">
                    {selectedArticle.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose prose-sm max-w-none">
                    <div className="text-slate-700 whitespace-pre-wrap">
                      {selectedArticle.content}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="border-t border-slate-200 pt-6">
                    <p className="text-sm font-semibold text-slate-900 mb-3">
                      Was this article helpful?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote(selectedArticle.id, true)}
                        disabled={votedArticles.has(selectedArticle.id)}
                        className="gap-2"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Yes ({selectedArticle.helpfulVotes})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote(selectedArticle.id, false)}
                        disabled={votedArticles.has(selectedArticle.id)}
                        className="gap-2"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        No ({selectedArticle.unhelpfulVotes})
                      </Button>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 mb-3">
                      Still need help? Create a support ticket and our team will assist you.
                    </p>
                    <Link href="/support/create">
                      <Button size="sm">Create Support Ticket</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {articlesLoading ? (
                  <Card>
                    <CardContent className="py-12">
                      <p className="text-center text-slate-600">Loading articles...</p>
                    </CardContent>
                  </Card>
                ) : filteredArticles.length > 0 ? (
                  filteredArticles.map((article: any) => (
                    <Card
                      key={article.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 text-lg mb-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                              {article.content}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {article.views} views
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {article.helpfulVotes} helpful
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline">Read</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No articles found</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* FAQ Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {faqs.length > 0 ? (
                  faqs.map((faq: any) => (
                    <div key={faq.id} className="pb-3 border-b border-slate-200 last:border-0">
                      <p className="font-semibold text-sm text-slate-900 mb-1">
                        {faq.question}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2">{faq.answer}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">No FAQs available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/support">
                  <Button variant="ghost" className="w-full justify-start">
                    View Support Tickets
                  </Button>
                </Link>
                <Link href="/support/create">
                  <Button variant="ghost" className="w-full justify-start">
                    Create New Ticket
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
