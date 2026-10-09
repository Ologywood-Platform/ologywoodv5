/** Published externally hosted content: pricing is visible; paid access follows Stripe confirmation. */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Film, Music, Mic, BookOpen, Video, Play, ExternalLink, ShoppingCart, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import { AIUseDisclosureTag } from '@/components/AIUseDisclosure';
import { getContentReleaseTypeLabel } from '@shared/contentReleaseTypes';
import { contentReleasePriceCents } from '@shared/contentReleaseCommerce';
import { ContentReleaseArtwork } from '@/components/ContentReleaseCoverArt';
import { ContentReleasePublicPreview } from '@/components/ContentReleasePreview';
import { QuickSignupModal } from '@/components/QuickSignupModal';
function getReleaseTypeIcon(type:string){
 if(['movie','documentary','short_film','web_series'].includes(type))return <Film className="h-5 w-5"/>;
 if(['concert','livestream'].includes(type))return <Video className="h-5 w-5"/>;
 if(['podcast_episode','interview'].includes(type))return <Mic className="h-5 w-5"/>;
 if(['single','album','music_video'].includes(type))return <Music className="h-5 w-5"/>;
 if(['course','masterclass'].includes(type))return <BookOpen className="h-5 w-5"/>;
 return <Play className="h-5 w-5"/>;
}
function getPlatformLabel(platform:string){const map:Record<string,string>={youtube:'YouTube',vimeo:'Vimeo',twitch:'Twitch',spotify:'Spotify',apple_podcasts:'Apple Podcasts',soundcloud:'SoundCloud',personal_website:'Personal Website',other:'Other'};return map[platform]||platform;}
function ReleaseCard({release}:{release:any}){
 const {user}=useAuth();const [,navigate]=useLocation();const utils=trpc.useUtils();
 const minimum=contentReleasePriceCents(release),price=(minimum/100).toFixed(2);
 const [amount,setAmount]=useState(price);
 const [loginOpen,setLoginOpen]=useState(false);
 const access=trpc.contentRelease.checkAccess.useQuery({releaseId:release.id},{enabled:!!user&&release.accessModel!=='free'});
 const purchase=trpc.contentRelease.purchase.useMutation({
  onSuccess:async result=>{
   if('checkoutUrl' in result&&result.checkoutUrl){window.location.assign(result.checkoutUrl);return;}
   await utils.contentRelease.checkAccess.invalidate({releaseId:release.id});
   await utils.contentRelease.myPurchases.invalidate();
   toast.success(result.alreadyPurchased?'You already have access.':'Access granted.');
  },onError:error=>toast.error(error.message),
 });
 const isFree=release.accessModel==='free',pwyw=release.accessModel==='pay_what_you_want',fanClub=release.accessModel==='fan_club_only';
 const owner=access.data?.reason==='owner';const hasAccess=isFree||access.data?.hasAccess;
 const url=access.data?.contentUrl||release.contentUrl;
 const chosen=Number(amount),validAmount=Number.isFinite(chosen)&&chosen>=minimum/100&&Math.abs(chosen*100-Math.round(chosen*100))<1e-7;
 const buy=()=>{
  if(!user){setLoginOpen(true);return;}
  if(pwyw&&!validAmount){toast.error(`Choose at least $${price}, using up to two decimal places.`);return;}
  purchase.mutate({releaseId:release.id,amount:pwyw?chosen:minimum/100});
 };
 return <div className="min-w-0 [overflow-wrap:anywhere] flex flex-col gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors md:flex-row md:items-start">
  <div className="flex items-start gap-4 flex-1 min-w-0">
   <ContentReleaseArtwork url={release.thumbnailUrl} title={release.title} className="w-16 h-16 text-primary" fallback={getReleaseTypeIcon(release.releaseType)}/>
   <div className="flex-1 min-w-0"><h4 className="font-semibold text-sm [overflow-wrap:anywhere]">{release.title}</h4>
    {release.description&&<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{release.description}</p>}
    <div className="flex flex-wrap items-center gap-2 mt-2 [&_span]:max-w-full [&_span]:whitespace-normal"><Badge variant="outline" className="text-[10px]">{getContentReleaseTypeLabel(release.releaseType)}</Badge><Badge variant="outline" className="text-[10px]">{getPlatformLabel(release.hostingPlatform)}</Badge>{release.genre&&<Badge variant="secondary" className="text-[10px]">{release.genre}</Badge>}{release.duration&&<span className="text-[10px] text-muted-foreground">{release.duration}</span>}</div>
    <AIUseDisclosureTag disclosure={release} className="mt-2"/>
    {release.includesLiveQA&&<span className="text-[10px] text-muted-foreground block mt-1">Includes Live Q&amp;A</span>}
    {release.includesBonusContent&&<span className="text-[10px] text-muted-foreground block">Bonus Content</span>}
    <p className="text-xs text-muted-foreground mt-2">{isFree?'Free access':fanClub?'Fan Club members only':pwyw?`Pay What You Want · minimum $${price}`:`Buy access · $${price}`}</p>
    <p className="text-[10px] text-muted-foreground mt-1">Hosted on {getPlatformLabel(release.hostingPlatform)} · access purchase, not an audio-file download.</p>
    <ContentReleasePublicPreview releaseId={release.id} hasPreview={release.hasPreview === true} title={release.title}/>
   </div>
  </div>
  <div className="flex flex-col gap-2 md:w-44 shrink-0 min-w-0 [&_button]:whitespace-normal [&_button]:h-auto [&_button]:min-h-9 [&_button]:py-2">
   {owner&&<p className="text-xs text-muted-foreground">Your release. Fans see the purchase controls.</p>}
   {hasAccess?<Button size="sm" className="gap-1 text-xs" disabled={!url} onClick={()=>window.open(url,'_blank','noopener,noreferrer')}><ExternalLink className="h-3 w-3"/>{owner?'Open full release':'Watch / Listen'}</Button>
    :fanClub?<Button size="sm" variant="outline" onClick={()=>navigate('/fan-club-discovery')}>Join Fan Club</Button>
    :<>
      {pwyw&&<div><label className="text-xs font-medium" htmlFor={`release-price-${release.id}`}>Your price (USD)</label><Input id={`release-price-${release.id}`} type="number" inputMode="decimal" min={minimum/100} step="0.01" value={amount} onChange={event=>setAmount(event.target.value)} className="mt-1 h-9"/></div>}
      <Button size="sm" className="gap-1 text-xs" disabled={purchase.isPending||access.isLoading||(pwyw&&!!user&&!validAmount)} onClick={buy}>{purchase.isPending?<Loader2 className="h-3 w-3 animate-spin"/>:<ShoppingCart className="h-3 w-3"/>}{!user?'Sign in to buy':pwyw?chosen===0?'Get access':`Buy for $${(validAmount?chosen:minimum/100).toFixed(2)}`:`Buy access $${price}`}</Button>
      <span className="text-[10px] text-muted-foreground">Secure Stripe checkout. Access after payment.</span>
    </>}
  </div>
  <QuickSignupModal isOpen={loginOpen} onClose={()=>setLoginOpen(false)} defaultTab="login" actionType="general" />
 </div>;
}
export function ContentReleasesDisplay({artistProfileId}:{artistProfileId:number}){
 const query=trpc.contentRelease.getByArtist.useQuery({artistProfileId});
 if(query.isLoading)return <p className="text-sm text-muted-foreground p-4">Loading content releases…</p>;
 if(query.isError)return <Card><CardContent className="p-4"><p role="alert" className="text-sm">Content releases could not be loaded. Please retry.</p><Button variant="outline" size="sm" onClick={()=>query.refetch()}>Retry content releases</Button></CardContent></Card>;
 if(!query.data?.length)return null;
 return <Card id="profile-releases" className="min-w-0"><CardHeader><CardTitle className="flex items-center gap-2"><Film className="h-5 w-5 text-primary shrink-0"/>Content Releases ({query.data.length})</CardTitle><CardDescription>Watch or listen on the creator’s chosen platform. Paid purchases unlock hosted access, not a downloadable music file.</CardDescription></CardHeader><CardContent className="space-y-2">{query.data.map(release=><ReleaseCard key={release.id} release={release}/>)}</CardContent></Card>;
}
