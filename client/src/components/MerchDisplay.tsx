import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingBag, ImageIcon } from 'lucide-react';

interface MerchDisplayProps {
  userId: number;
  userType: 'artist' | 'venue';
}

export function MerchDisplay({ userId, userType }: MerchDisplayProps) {
  const { data: items, isLoading } = trpc.merch.getPublicItems.useQuery(
    { userId, userType },
    { enabled: !!userId }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null; // Don't show section if no items
  }

  const label = userType === 'venue' ? 'Shop & Offers' : 'Merch';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold">{label}</h2>
        <Badge variant="secondary" className="text-xs">{items.length} items</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item: any) => (
          <Card
            key={item.id}
            className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.open(item.externalUrl, '_blank')}
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <img
                  src={item.imageUrls[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Button
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black hover:bg-white/90 gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  Buy
                </Button>
              </div>
            </div>

            {/* Info */}
            <CardContent className="p-3">
              <h3 className="font-medium text-sm truncate">{item.title}</h3>
              <p className="text-purple-600 font-bold text-sm mt-0.5">{item.priceDisplay}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
