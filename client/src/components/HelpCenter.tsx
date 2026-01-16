import React, { useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  keywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  views: number;
  helpful: number;
  unhelpful: number;
}

interface HelpCenterProps {
  onArticleSelect?: (article: HelpArticle) => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onArticleSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'views' | 'helpful'>('relevance');

  // Fetch help articles from TRPC
  const { data: articles = [], isLoading } = trpc.helpCenter.getArticles.useQuery();
  const { data: categories = [] } = trpc.helpCenter.getCategories.useQuery();

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.keywords.some((k) => k.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((article) => article.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      filtered = filtered.filter((article) => article.difficulty === selectedDifficulty);
    }

    // Sort
    if (sortBy === 'views') {
      filtered = filtered.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'helpful') {
      filtered = filtered.sort((a, b) => {
        const aRatio = a.helpful / (a.helpful + a.unhelpful || 1);
        const bRatio = b.helpful / (b.helpful + b.unhelpful || 1);
        return bRatio - aRatio;
      });
    }

    return filtered;
  }, [articles, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const handleArticleSelect = (article: HelpArticle) => {
    setSelectedArticle(article);
    onArticleSelect?.(article);
  };

  const handleHelpful = async (articleId: string, helpful: boolean) => {
    try {
      await trpc.helpCenter.recordFeedback.mutate({
        articleId,
        helpful,
      });
      // Optionally refresh articles
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  if (selectedArticle) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {/* Back button */}
        <button
          onClick={() => setSelectedArticle(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#7c3aed',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '20px',
            padding: '0',
          }}
        >
          ← Back to Help Center
        </button>

        {/* Article header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#1f2937' }}>
            {selectedArticle.title}
          </h1>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#6b7280' }}>
            <span>Category: {selectedArticle.category}</span>
            <span>Difficulty: {selectedArticle.difficulty}</span>
            <span>Read time: {selectedArticle.estimatedReadTime} min</span>
          </div>
        </div>

        {/* Article content */}
        <div
          style={{
            lineHeight: '1.6',
            color: '#374151',
            marginBottom: '40px',
            fontSize: '16px',
          }}
          dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
        />

        {/* Feedback section */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '20px',
            marginTop: '40px',
          }}
        >
          <p style={{ marginBottom: '15px', color: '#6b7280' }}>Was this article helpful?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleHelpful(selectedArticle.id, true)}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#f3f4f6';
              }}
            >
              👍 Yes, helpful
            </button>
            <button
              onClick={() => handleHelpful(selectedArticle.id, false)}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#f3f4f6';
              }}
            >
              👎 Not helpful
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#1f2937' }}>
          Help Center
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Find answers and learn how to use Ologywood's contract management system.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px',
        }}
      >
        {/* Category filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Category
          </label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Difficulty
          </label>
          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value || null)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="relevance">Relevance</option>
            <option value="views">Most Viewed</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
        {isLoading ? (
          <span>Loading articles...</span>
        ) : (
          <span>
            Showing {filteredArticles.length} of {articles.length} articles
          </span>
        )}
      </div>

      {/* Articles list */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredArticles.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: '8px',
              color: '#6b7280',
            }}
          >
            <p>No articles found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleSelect(article)}
              style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: '#fff',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 4px 12px rgba(0, 0, 0, 0.1)';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#7c3aed';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1f2937' }}>
                    {article.title}
                  </h3>
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
                    {article.summary}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#9ca3af' }}>
                    <span>📁 {article.category}</span>
                    <span>📊 {article.difficulty}</span>
                    <span>⏱️ {article.estimatedReadTime} min read</span>
                    <span>👁️ {article.views} views</span>
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: '20px',
                    fontSize: '24px',
                    color: '#d1d5db',
                  }}
                >
                  →
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HelpCenter;
