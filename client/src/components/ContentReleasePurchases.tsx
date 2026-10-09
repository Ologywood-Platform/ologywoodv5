import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { ContentReleaseArtwork } from './ContentReleaseCoverArt';
export function ContentReleasePurchases(){
 const query=trpc.contentRelease.myPurchases.useQuery();
 const utils=trpc.useUtils();const [opening,setOpening]=useState<number|null>(null);
 const open=async(id:number)=>{
  setOpening(id);
  try{
   const access=await utils.contentRelease.checkAccess.fetch({releaseId:id});
   if(access.hasAccess&&access.contentUrl)window.location.assign(access.contentUrl);
   else toast.error('Access is unavailable. Please refresh or contact the creator.');
  }catch{toast.error('Could not open the release. Please retry.');}finally{setOpening(null);}
 };
 return <Card className="mt-6"><CardHeader><CardTitle>Hosted content purchases</CardTitle></CardHeader><CardContent>
  <p className="text-sm text-muted-foreground mb-4">Your purchased access to releases on YouTube and other distribution channels. Downloadable tracks remain in your Music library.</p>
  {query.isLoading?<Loader2 className="h-5 w-5 animate-spin"/>:query.isError?<p role="alert">Could not load your hosted content purchases.</p>:!query.data?.length?<p className="text-sm text-muted-foreground">No hosted content purchases yet.</p>:<div className="space-y-3">{query.data.map(item=><div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3"><ContentReleaseArtwork url={item.thumbnailUrl} title={item.title} className="w-12 h-12"/><div className="flex-1 min-w-0"><h3 className="font-medium break-words">{item.title}</h3><p className="text-xs text-muted-foreground">${Number(item.amountPaid).toFixed(2)} · {new Date(item.createdAt).toLocaleDateString()} · {item.hostingPlatform}</p></div><Button size="sm" disabled={!item.isPublished||opening===item.releaseId} onClick={()=>open(item.releaseId)}>{opening===item.releaseId?<Loader2 className="h-4 w-4 animate-spin mr-1"/>:<ExternalLink className="h-4 w-4 mr-1"/>}Watch / Listen</Button></div>)}</div>}
  <Button className="mt-4" variant="outline" size="sm" onClick={()=>query.refetch()}>Refresh purchases</Button>
 </CardContent></Card>;
}
