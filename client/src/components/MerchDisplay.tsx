import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ImageIcon, ShoppingBag } from 'lucide-react';
import { merchUrl } from '@/lib/slugify';
import { useLocation } from 'wouter';

interface MerchDisplayProps {
  userId: number;
  userType: 'artist' | 'venue' | 'athlete';
  talentType?: string;
}

export function MerchDisplay({ userId, userType, talentType }: MerchDisplayProps) {
  const [, navigate] = useLocation();
  const queryUserType = userType === 'athlete' ? 'artist' : userType;
  const { data: items, isLoading } = trpc.merch.getPublicItems.useQuery(
    { userId, userType: queryUserType as 'artist' | 'venue' },
    { enabled: !!userId },
  );

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((index) => <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>;
  if (!items?.length) return null;

  const isAthlete = userType === 'athlete' || talentType === 'athlete';
  const label = userType === 'venue' ? 'Shop & Offers' : isAthlete ? 'Official Merch' : 'Merch';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-purple-600" /><h2 className="text-lg font-semibold">{label}</h2><Badge variant="secondary" className="text-xs">{items.length} items</Badge></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item: any) => {
          const soldOut = item.sellingMethod === 'ologywood' && item.trackInventory && (item.inventoryQuantity ?? 0) <= 0;
          return (
            <Card key={item.id} className="overflow-hidden group transition-shadow cursor-pointer hover:shadow-md" onClick={() => navigate(merchUrl(item.title, item.id))}>
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-10 w-10 text-gray-300" /></div>}
                <Badge className={`absolute top-2 left-2 text-[10px] ${item.sellingMethod === 'ologywood' ? 'bg-purple-700' : 'bg-slate-800'}`}>{item.sellingMethod === 'ologywood' ? 'Buy on OlogyWood' : 'External store'}</Badge>
                {soldOut && <div className="absolute inset-0 bg-black/55 flex items-center justify-center"><Badge className="bg-white text-black">Sold out</Badge></div>}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"><Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black hover:bg-white/90 gap-1.5 text-xs"><Eye className="h-3 w-3" />View item</Button></div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                <p className="text-purple-600 font-bold text-sm mt-0.5">{item.priceDisplay}</p>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                {item.sellingMethod === 'ologywood' && <p className="text-[11px] text-muted-foreground mt-2">{item.shippingAvailable && item.pickupAvailable ? 'Shipping or pickup' : item.shippingAvailable ? 'Shipping available' : 'Local pickup'}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
