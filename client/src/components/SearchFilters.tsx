import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Search } from 'lucide-react';

interface SearchFiltersProps {
  onFilterChange: (filters: {
    location?: string;
    minFee?: number;
    maxFee?: number;
    availableFrom?: string;
    availableTo?: string;
  }) => void;
}

export function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      location: location || undefined,
      minFee: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxFee: priceRange[1] < 10000 ? priceRange[1] : undefined,
      availableFrom: availableFrom || undefined,
      availableTo: availableTo || undefined,
    });
  };

  const handleReset = () => {
    setLocation('');
    setPriceRange([0, 10000]);
    setAvailableFrom('');
    setAvailableTo('');
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Enter city or region..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Price Range Slider */}
        <div className="space-y-4">
          <Label>Price Range (per event)</Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={10000}
              step={100}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}</span>
          </div>
        </div>

        {/* Availability Date Range */}
        <div className="space-y-4">
          <Label>Availability Dates</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                min={availableFrom}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleApplyFilters} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button onClick={handleReset} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
