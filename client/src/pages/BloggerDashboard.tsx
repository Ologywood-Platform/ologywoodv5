import { useAuth } from '@/_core/hooks/useAuth';
import { ExternalLink, PenTool } from 'lucide-react';
import BlogAdmin from './BlogAdmin';

export default function BloggerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blogger Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <PenTool className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Blog Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Welcome back{user?.name ? `, ${user.name}` : ''}. Manage your blog posts here.
                </p>
              </div>
            </div>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-700 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Live Blog
            </a>
          </div>
        </div>
      </div>

      {/* Blog Management (reuses the existing BlogAdmin component) */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <BlogAdmin />
        </div>
      </div>
    </div>
  );
}
