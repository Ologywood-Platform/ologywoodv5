import { Link, useParams } from 'wouter';
import { ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import SiteHeader from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SandboxPostShareDialog } from '@/components/SandboxPostShareDialog';
import { setMetaTags } from '@/utils/seoMeta';

export default function SandboxPostPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [shareOpen, setShareOpen] = useState(false);
  const { data: post, isLoading } = trpc.sandboxPost.getPublicBySlug.useQuery({ slug }, { enabled: Boolean(slug) });

  useEffect(() => {
    if (post) setMetaTags({ title: `${post.artistName}'s Sandbox Post | OlogyWood`, description: post.content.slice(0, 180), ogImage: post.mediaThumbnailUrl || post.mediaUrl || post.profilePhotoUrl || undefined });
  }, [post]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {isLoading ? (
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        ) : post ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3"><Link href={`/artist/${slug}`}><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to profile</Button></Link><Button variant="outline" className="gap-2" onClick={() => setShareOpen(true)}><Share2 className="h-4 w-4" />Share</Button></div>
            <Card className="overflow-hidden border-purple-200 dark:border-purple-900"><div className="h-2 bg-gradient-to-r from-purple-700 via-fuchsia-500 to-cyan-400" /><CardHeader><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300">One post at a time</p><CardTitle className="flex items-center gap-2 text-2xl"><Sparkles className="h-6 w-6 text-fuchsia-500" />{post.artistName}'s Sandbox Post</CardTitle></CardHeader><CardContent className="space-y-5"><p className="whitespace-pre-wrap text-lg leading-relaxed">{post.content}</p>{post.mediaType === 'image' && post.mediaUrl && <img src={post.mediaUrl} alt={`Sandbox Post by ${post.artistName}`} className="max-h-[640px] w-full rounded-xl bg-muted object-contain" />}{post.mediaType === 'video' && post.mediaUrl && <video src={post.mediaUrl} poster={post.mediaThumbnailUrl || undefined} controls playsInline preload="metadata" className="max-h-[640px] w-full rounded-xl bg-black" />}<div className="border-t pt-4 text-sm text-muted-foreground"><p>Posted {new Date(post.createdAt).toLocaleString()}</p><p className="mt-1">Sandbox Posts are temporary profile updates. A new post permanently replaces the previous one.</p></div></CardContent></Card>
            <SandboxPostShareDialog open={shareOpen} onOpenChange={setShareOpen} post={post} />
          </>
        ) : (
          <Card><CardHeader><CardTitle>Sandbox Post unavailable</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">This post may have been replaced or permanently deleted. Visit the talent's profile to see what is current.</p><Link href={`/artist/${slug}`}><Button>View talent profile</Button></Link></CardContent></Card>
        )}
      </main>
    </div>
  );
}
