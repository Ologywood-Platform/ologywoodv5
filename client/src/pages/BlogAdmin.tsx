import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { renderMarkdown } from '@/utils/renderMarkdown';
import {
  BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, Archive, Upload,
  ImageIcon, X, Search, ArrowLeft, ExternalLink, FileText, LayoutGrid,
  List, Bold, Italic, Heading2, Link2, ListOrdered, Quote, Code, Minus,
  Table, Image as ImageIconLucide, Save, ChevronLeft, RotateCcw
} from 'lucide-react';
import { AIChatTrigger } from '@/components/AIChatWidget';

type PostStatus = 'draft' | 'published' | 'archived';
type Category = 'announcement' | 'guide' | 'news' | 'update' | 'tutorial';
type ViewMode = 'list' | 'create' | 'edit';

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: Category;
  tags: string;
  status: 'draft' | 'published';
}

const EMPTY_FORM: BlogForm = {
  title: '', slug: '', excerpt: '', content: '', coverImageUrl: '',
  category: 'announcement', tags: '', status: 'draft',
};

const CATEGORY_COLORS: Record<Category, string> = {
  announcement: 'bg-blue-100 text-blue-700',
  guide: 'bg-emerald-100 text-emerald-700',
  news: 'bg-purple-100 text-purple-700',
  update: 'bg-amber-100 text-amber-700',
  tutorial: 'bg-rose-100 text-rose-700',
};

const STATUS_COLORS: Record<PostStatus, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
};

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(text: string): string {
  const words = wordCount(text);
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

// ─── Toast Notification ──────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? '✓' : '✕'} {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
    </div>
  );
}

// ─── Confirmation Dialog ─────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger }: {
  title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Markdown Toolbar ────────────────────────────────────────────
function MarkdownToolbar({ textareaRef, content, setContent }: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (val: string) => void;
}) {
  const insertAtCursor = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const text = selected || placeholder;
    const newContent = content.substring(0, start) + before + text + after + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      const newPos = start + before.length + text.length + after.length;
      ta.setSelectionRange(start + before.length, start + before.length + text.length);
    }, 0);
  }, [content, setContent, textareaRef]);

  const tools = [
    { icon: <Bold className="w-4 h-4" />, label: 'Bold', action: () => insertAtCursor('**', '**', 'bold text') },
    { icon: <Italic className="w-4 h-4" />, label: 'Italic', action: () => insertAtCursor('*', '*', 'italic text') },
    { icon: <Heading2 className="w-4 h-4" />, label: 'Heading', action: () => insertAtCursor('\n## ', '\n', 'Heading') },
    { icon: <Link2 className="w-4 h-4" />, label: 'Link', action: () => insertAtCursor('[', '](https://)', 'link text') },
    { icon: <ImageIconLucide className="w-4 h-4" />, label: 'Image', action: () => insertAtCursor('![', '](https://image-url)', 'alt text') },
    { icon: <ListOrdered className="w-4 h-4" />, label: 'List', action: () => insertAtCursor('\n1. ', '\n', 'List item') },
    { icon: <Quote className="w-4 h-4" />, label: 'Quote', action: () => insertAtCursor('\n> ', '\n', 'Quote text') },
    { icon: <Code className="w-4 h-4" />, label: 'Code', action: () => insertAtCursor('`', '`', 'code') },
    { icon: <Minus className="w-4 h-4" />, label: 'Divider', action: () => insertAtCursor('\n\n---\n\n', '') },
    { icon: <Table className="w-4 h-4" />, label: 'Table', action: () => insertAtCursor('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n', '') },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-x-auto">
      {tools.map((tool, i) => (
        <button
          key={i}
          type="button"
          onClick={tool.action}
          title={tool.label}
          className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

// ─── Main Blog Admin Component ───────────────────────────────────
export default function BlogAdmin() {
  const [view, setView] = useState<ViewMode>('list');
  const [editId, setEditId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [listView, setListView] = useState<'table' | 'grid'>('table');
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<BlogForm>({ ...EMPTY_FORM });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; confirmLabel: string;
    onConfirm: () => void; danger?: boolean;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();
  const postsQuery = trpc.blog.adminList.useQuery({ limit: 100, status: statusFilter });
  const editPostQuery = trpc.blog.adminGetById.useQuery(
    { id: editId! },
    { enabled: !!editId && view === 'edit' }
  );

  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      void utils.blog.adminList.invalidate();
      void utils.blog.list.invalidate();
      setView('list');
      resetForm();
      setToast({ message: 'Blog post created successfully', type: 'success' });
    },
    onError: (err) => setToast({ message: err.message, type: 'error' }),
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      void utils.blog.adminList.invalidate();
      void utils.blog.list.invalidate();
      setView('list');
      setEditId(null);
      resetForm();
      setToast({ message: 'Blog post updated successfully', type: 'success' });
    },
    onError: (err) => setToast({ message: err.message, type: 'error' }),
  });

  const setStatusMutation = trpc.blog.setStatus.useMutation({
    onSuccess: (_data, vars) => {
      void utils.blog.adminList.invalidate();
      void utils.blog.list.invalidate();
      setToast({ message: `Post ${vars.status === 'published' ? 'published' : vars.status === 'archived' ? 'archived' : 'unpublished'} successfully`, type: 'success' });
    },
    onError: (err) => setToast({ message: err.message, type: 'error' }),
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      void utils.blog.adminList.invalidate();
      void utils.blog.list.invalidate();
      setToast({ message: 'Blog post deleted', type: 'success' });
    },
    onError: (err) => setToast({ message: err.message, type: 'error' }),
  });

  const uploadCoverMutation = trpc.blog.uploadCoverImage.useMutation({
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, coverImageUrl: data.url }));
      setIsUploadingCover(false);
      setToast({ message: 'Cover image uploaded', type: 'success' });
    },
    onError: () => {
      setIsUploadingCover(false);
      setToast({ message: 'Failed to upload cover image', type: 'error' });
    },
  });

  // Load edit post data into form
  useEffect(() => {
    if (editPostQuery.data && view === 'edit') {
      const post = editPostQuery.data;
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl || '',
        category: post.category as Category,
        tags: (post.tags as string[] || []).join(', '),
        status: post.status === 'published' ? 'published' : 'draft',
      });
      setCoverPreview(null);
      setHasUnsavedChanges(false);
    }
  }, [editPostQuery.data, view]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setCoverPreview(null);
    setShowPreview(false);
    setHasUnsavedChanges(false);
  };

  const updateForm = (updates: Partial<BlogForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleCoverImageSelect = async (file: File, postId?: number) => {
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image must be under 5MB', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCoverPreview(base64);
      if (postId) {
        setIsUploadingCover(true);
        uploadCoverMutation.mutate({ postId, fileData: base64, fileName: file.name, mimeType: file.type });
      } else {
        updateForm({ coverImageUrl: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverPreview(null);
    updateForm({ coverImageUrl: '' });
  };

  const handleCreate = () => {
    if (!form.title || !form.slug || !form.excerpt || !form.content) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }
    createMutation.mutate({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editId) return;
    if (!form.title || !form.slug || !form.excerpt || !form.content) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }
    updateMutation.mutate({
      id: editId,
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl || undefined,
    });
  };

  const startEdit = (post: any) => {
    setEditId(post.id);
    setView('edit');
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setConfirmDialog({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to go back?',
        confirmLabel: 'Discard Changes',
        danger: true,
        onConfirm: () => {
          setView('list');
          setEditId(null);
          resetForm();
          setConfirmDialog(null);
        },
      });
    } else {
      setView('list');
      setEditId(null);
      resetForm();
    }
  };

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    const posts = postsQuery.data?.posts || [];
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter((p: any) =>
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  }, [postsQuery.data?.posts, searchQuery]);

  const previewHtml = useMemo(() => {
    if (!form.content) return '<p class="text-gray-400 italic">Start writing to see a preview...</p>';
    return renderMarkdown(form.content);
  }, [form.content]);

  const stats = useMemo(() => {
    const words = wordCount(form.content);
    return { words, chars: form.content.length, reading: readingTime(form.content) };
  }, [form.content]);

  // ─── Editor View ─────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    const isLoading = view === 'edit' && editPostQuery.isLoading;

    return (
      <div className="min-h-screen bg-gray-50">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {confirmDialog && (
          <ConfirmDialog
            {...confirmDialog}
            onCancel={() => setConfirmDialog(null)}
          />
        )}

        {/* Editor Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button onClick={handleBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex-shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {view === 'create' ? 'New Blog Post' : 'Edit Blog Post'}
                  </h1>
                  <p className="text-xs text-gray-500 truncate">
                    {stats.words} words · {stats.chars} chars · {stats.reading}
                    {hasUnsavedChanges && <span className="ml-1 text-amber-600 font-medium">· Unsaved</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showPreview ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="w-4 h-4" /> {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <div className="hidden sm:flex items-center gap-2 border-l border-gray-200 pl-3">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio" name="editorStatus" checked={form.status === 'draft'}
                      onChange={() => updateForm({ status: 'draft' })}
                      className="text-blue-600"
                    />
                    <span className="text-gray-600">Draft</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio" name="editorStatus" checked={form.status === 'published'}
                      onChange={() => updateForm({ status: 'published' })}
                      className="text-blue-600"
                    />
                    <span className="text-gray-600">Publish</span>
                  </label>
                </div>
                <button
                  onClick={view === 'create' ? handleCreate : handleUpdate}
                  disabled={!form.title || !form.slug || !form.excerpt || !form.content || createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 px-3 sm:px-5 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : view === 'create' ? 'Create Post' : 'Save Changes'}</span>
                  <span className="sm:hidden">{(createMutation.isPending || updateMutation.isPending) ? '...' : 'Save'}</span>
                </button>
              </div>
            </div>
            {/* Mobile-only status & preview row */}
            <div className="flex sm:hidden items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio" name="editorStatusMobile" checked={form.status === 'draft'}
                    onChange={() => updateForm({ status: 'draft' })}
                    className="text-blue-600"
                  />
                  <span className="text-gray-600">Draft</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio" name="editorStatusMobile" checked={form.status === 'published'}
                    onChange={() => updateForm({ status: 'published' })}
                    className="text-blue-600"
                  />
                  <span className="text-gray-600">Publish</span>
                </label>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                  showPreview ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Hide' : 'Preview'}
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className={`grid gap-4 sm:gap-6 ${showPreview ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-3xl'}`}>
              {/* Left: Editor */}
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      updateForm({
                        title,
                        slug: view === 'create' ? generateSlug(title) : form.slug,
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter post title..."
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL Slug <span className="text-red-500">*</span>
                    {form.slug && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">/blog/{form.slug}</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => updateForm({ slug: e.target.value })}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder="url-friendly-slug"
                    />
                    <button
                      type="button"
                      onClick={() => updateForm({ slug: generateSlug(form.title) })}
                      className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      title="Regenerate slug from title"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category & Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => updateForm({ category: e.target.value as Category })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="guide">Guide</option>
                      <option value="news">News</option>
                      <option value="update">Update</option>
                      <option value="tutorial">Tutorial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => updateForm({ tags: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="booking, events, guide"
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
                  {(coverPreview || form.coverImageUrl) ? (
                    <div className="relative group">
                      <img
                        src={coverPreview || form.coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <label className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-100 shadow-sm">
                            <Upload className="w-3.5 h-3.5 inline mr-1" /> Replace
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCoverImageSelect(file, editId || undefined);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={removeCoverImage}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 shadow-sm"
                          >
                            <X className="w-3.5 h-3.5 inline mr-1" /> Remove
                          </button>
                        </div>
                      </div>
                      {isUploadingCover && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-lg animate-pulse">
                          Uploading...
                        </div>
                      )}
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleCoverImageSelect(file, editId || undefined);
                      }}
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click or drag an image to upload</span>
                      <span className="text-xs text-gray-400 mt-1">JPEG, PNG, or WebP · Max 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverImageSelect(file, editId || undefined);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Excerpt <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-gray-400 font-normal">{form.excerpt.length}/1000</span>
                  </label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => updateForm({ excerpt: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    maxLength={1000}
                    placeholder="Short summary shown on the blog listing page..."
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Content <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-gray-400 font-normal">Markdown supported</span>
                  </label>
                  <div className="border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <MarkdownToolbar textareaRef={textareaRef} content={form.content} setContent={(val) => updateForm({ content: val })} />
                    <textarea
                      ref={textareaRef}
                      value={form.content}
                      onChange={(e) => updateForm({ content: e.target.value })}
                      className="w-full px-4 py-3 text-sm font-mono leading-relaxed resize-y border-0 rounded-b-lg focus:ring-0 focus:outline-none"
                      rows={showPreview ? 30 : 24}
                      placeholder="Write your blog post in Markdown..."
                    />
                  </div>
                </div>
              </div>

              {/* Right: Live Preview */}
              {showPreview && (
                <div className="border border-gray-200 rounded-lg bg-white overflow-hidden sticky top-20 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                  </div>
                  <div className="p-6">
                    {form.coverImageUrl && (
                      <img
                        src={coverPreview || form.coverImageUrl}
                        alt="Cover"
                        className="w-full h-48 object-cover rounded-lg mb-6"
                      />
                    )}
                    {form.title && (
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
                    )}
                    {form.excerpt && (
                      <p className="text-sm text-gray-500 mb-4 italic">{form.excerpt}</p>
                    )}
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────
  const posts = filteredPosts;
  const counts = postsQuery.data?.counts;
  const countSummary = postsQuery.isLoading
    ? 'Loading blog post counts…'
    : postsQuery.isError
      ? 'Blog post counts are temporarily unavailable'
      : `${counts?.total ?? 0} total posts · ${counts?.published ?? 0} published · ${counts?.drafts ?? 0} drafts`;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-1">
                <a href="/admin" className="hover:text-gray-700 whitespace-nowrap">Admin Dashboard</a>
                <span>/</span>
                <span className="text-gray-900 font-medium whitespace-nowrap">Blog Management</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" /> Blog Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {countSummary}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <AIChatTrigger />
              <button
                onClick={() => { resetForm(); setView('create'); }}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Post</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Filters & Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
              {([undefined, 'draft', 'published', 'archived'] as const).map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => setStatusFilter(s as any)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Posts'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setListView('table')}
                  className={`p-2 ${listView === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setListView('grid')}
                  className={`p-2 ${listView === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {postsQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : postsQuery.isError ? (
          <div className="bg-white rounded-lg border border-red-200 p-10 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Blog posts could not be loaded</h3>
            <p className="text-sm text-gray-600 mb-5">
              {postsQuery.error.message || 'Check your Blog management access and try again.'}
            </p>
            <button
              type="button"
              onClick={() => void postsQuery.refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchQuery
                ? 'No posts match your search'
                : statusFilter
                  ? `No ${statusFilter} posts`
                  : 'No blog posts yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? 'Try a different search term.'
                : statusFilter
                  ? `There are currently no posts with ${statusFilter} status.`
                  : 'Create your first blog post to get started.'}
            </p>
            {!searchQuery && !statusFilter && (
              <button
                onClick={() => { resetForm(); setView('create'); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Create First Post
              </button>
            )}
          </div>
        ) : listView === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Post</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Words</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Published</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {post.coverImageUrl ? (
                          <img src={post.coverImageUrl} alt="" className="w-12 h-8 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-gray-900 font-medium truncate max-w-xs">{post.title}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">/blog/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category as Category] || 'bg-gray-100 text-gray-600'}`}>
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[post.status as PostStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {wordCount(post.content || '')} words
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {post.status === 'published' && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View live post"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => startEdit(post)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {post.status === 'draft' && (
                          <button
                            onClick={() => setStatusMutation.mutate({ id: post.id, status: 'published' })}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            title="Publish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {post.status === 'published' && (
                          <button
                            onClick={() => setStatusMutation.mutate({ id: post.id, status: 'draft' })}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                            title="Unpublish"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        {post.status !== 'archived' && (
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                title: 'Archive Post',
                                message: `Are you sure you want to archive "${post.title}"? It will no longer be visible on the blog.`,
                                confirmLabel: 'Archive',
                                onConfirm: () => {
                                  setStatusMutation.mutate({ id: post.id, status: 'archived' });
                                  setConfirmDialog(null);
                                },
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        {post.status === 'archived' && (
                          <button
                            onClick={() => setStatusMutation.mutate({ id: post.id, status: 'draft' })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Restore to draft"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              title: 'Delete Post',
                              message: `Are you sure you want to permanently delete "${post.title}"? This action cannot be undone.`,
                              confirmLabel: 'Delete Permanently',
                              danger: true,
                              onConfirm: () => {
                                deleteMutation.mutate({ id: post.id });
                                setConfirmDialog(null);
                              },
                            });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post: any) => (
              <div key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category as Category] || 'bg-gray-100 text-gray-600'}`}>
                      {post.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[post.status as PostStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {post.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{post.title}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Draft'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(post)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {post.status === 'published' && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="View"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            title: 'Delete Post',
                            message: `Are you sure you want to permanently delete "${post.title}"?`,
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: () => {
                              deleteMutation.mutate({ id: post.id });
                              setConfirmDialog(null);
                            },
                          });
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
