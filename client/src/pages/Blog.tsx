import React from 'react';
import { Link } from 'wouter';
import { Calendar, User, ArrowRight } from 'lucide-react';

const Blog = () => {
  const posts = [
    {
      id: 1,
      title: '10 Tips for Artists to Maximize Their Bookings',
      excerpt: 'Learn proven strategies to increase your visibility and book more gigs on Ologywood.',
      author: 'Sarah Johnson',
      date: 'February 3, 2026',
      category: 'Artist Tips',
      image: '🎵',
    },
    {
      id: 2,
      title: 'How Venues Can Find the Perfect Artist',
      excerpt: 'A comprehensive guide to searching and booking the right talent for your events.',
      author: 'Mike Chen',
      date: 'January 28, 2026',
      category: 'Venue Guide',
      image: '🎭',
    },
    {
      id: 3,
      title: 'The Future of Live Entertainment',
      excerpt: 'Exploring trends and innovations shaping the live music industry in 2026.',
      author: 'Emma Davis',
      date: 'January 20, 2026',
      category: 'Industry News',
      image: '🚀',
    },
    {
      id: 4,
      title: 'Building Your Artist Brand on Social Media',
      excerpt: 'Social media strategies to grow your fanbase and attract more booking opportunities.',
      author: 'Alex Rodriguez',
      date: 'January 15, 2026',
      category: 'Marketing',
      image: '📱',
    },
    {
      id: 5,
      title: 'Pricing Your Services: A Comprehensive Guide',
      excerpt: 'How to set competitive rates that reflect your experience and market value.',
      author: 'Lisa Wong',
      date: 'January 10, 2026',
      category: 'Business',
      image: '💰',
    },
    {
      id: 6,
      title: 'Success Story: From Local to National Artist',
      excerpt: 'How one artist used Ologywood to grow from local gigs to national tours.',
      author: 'James Miller',
      date: 'January 5, 2026',
      category: 'Success Stories',
      image: '⭐',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-purple-100 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Ologywood Blog</h1>
          <p className="text-lg text-purple-100">
            Tips, insights, and stories from the live entertainment industry
          </p>
        </div>
      </div>

      {/* Featured Post */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-8 border border-purple-200">
          <div className="text-4xl mb-4">{posts[0].image}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{posts[0].title}</h2>
          <p className="text-gray-600 mb-6">{posts[0].excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {posts[0].author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {posts[0].date}
            </div>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2">
            Read Article <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">Latest Articles</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(1).map((post) => (
            <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-8 text-center">
                <div className="text-5xl">{post.image}</div>
              </div>
              
              <div className="p-6">
                <div className="text-sm font-semibold text-purple-600 mb-2">{post.category}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </div>
                </div>
                
                <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-2">
                  Read More <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-gray-600 mb-8">
            Get the latest tips, industry insights, and success stories delivered to your inbox.
          </p>
          
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-600"
            />
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-lg transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="bg-white border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog;
