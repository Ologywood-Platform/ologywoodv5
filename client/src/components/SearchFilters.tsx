import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Search } from 'lucide-react';
import { ClearableInput } from '@/components/ui/clearable-input';

interface SearchFiltersProps {
  filterType?: 'artists' | 'events';
  onFilterChange: (filters: {
    genre?: string[];
    location?: string;
    minFee?: number;
    maxFee?: number;
    availableFrom?: string;
    availableTo?: string;
    eventType?: string[];
    minCapacity?: number;
    maxCapacity?: number;
    minRate?: number;
    maxRate?: number;
  }) => void;
}

const GENRES = [
  'Blues', 'Classical', 'Country', 'Electronic', 'Folk', 'Gospel', 'Hip-Hop',
  'Indie', 'Jazz', 'Latin', 'Pop', 'R&B', 'Reggae', 'Rock', 'Soul'
];

const EVENT_TYPES = [
  'Wedding', 'Corporate', 'Birthday', 'Festival', 'Club', 'Bar',
  'Restaurant', 'Private Party', 'Conference', 'Gala', 'Concert', 'Other'
];


export function SearchFilters({ filterType = 'artists', onFilterChange }: SearchFiltersProps) {
  const isArtistFilter = filterType === 'artists';
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [capacityRange, setCapacityRange] = useState([1, 1000]);
  const [rateRange, setRateRange] = useState([0, 5000]);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');

  const handleGenreToggle = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(newGenres);
  };

  const handleEventTypeToggle = (eventType: string) => {
    const newTypes = selectedEventTypes.includes(eventType)
      ? selectedEventTypes.filter(t => t !== eventType)
      : [...selectedEventTypes, eventType];
    setSelectedEventTypes(newTypes);
  };

  const handleApplyFilters = () => {
    onFilterChange({
      genre: selectedGenres.length > 0 ? selectedGenres : undefined,
      eventType: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
      location: location || undefined,
      minFee: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxFee: priceRange[1] < 10000 ? priceRange[1] : undefined,
      minCapacity: capacityRange[0] > 1 ? capacityRange[0] : undefined,
      maxCapacity: capacityRange[1] < 1000 ? capacityRange[1] : undefined,
      minRate: rateRange[0] > 0 ? rateRange[0] : undefined,
      maxRate: rateRange[1] < 5000 ? rateRange[1] : undefined,
      availableFrom: availableFrom || undefined,
      availableTo: availableTo || undefined,
    });
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSelectedEventTypes([]);
    setLocation('');
    setPriceRange([0, 10000]);
    setCapacityRange([1, 1000]);
    setRateRange([0, 5000]);
    setAvailableFrom('');
    setAvailableTo('');
    onFilterChange({});
  };

  const activeFilterCount = [
    selectedGenres.length > 0,
    selectedEventTypes.length > 0,
    location,
    priceRange[0] > 0 || priceRange[1] < 10000,
    capacityRange[0] > 1 || capacityRange[1] < 1000,
    rateRange[0] > 0 || rateRange[1] < 5000,
    availableFrom,
    availableTo,
  ].filter(Boolean).length;

  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Filters
          {activeFilterCount > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {activeFilterCount} active
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Genre Filter (Artists Only) */}
        {isArtistFilter && (
        <div className="space-y-3">
          <Label>Genres</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GENRES.map(genre => (
              <label key={genre} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre)}
                  onChange={() => handleGenreToggle(genre)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-foreground">{genre}</span>
              </label>
            ))}
          </div>
          {selectedGenres.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedGenres.map(genre => (
                <span
                  key={genre}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                >
                  {genre}
                  <button
                    onClick={() => handleGenreToggle(genre)}
                    className="hover:text-primary/70"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Event Type Filter (Events Only) */}
        {!isArtistFilter && (
        <div className="space-y-3">
          <Label>Event Types</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EVENT_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEventTypes.includes(type)}
                  onChange={() => handleEventTypeToggle(type)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-foreground">{type}</span>
              </label>
            ))}
          </div>
          {selectedEventTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedEventTypes.map(type => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                >
                  {type}
                  <button
                    onClick={() => handleEventTypeToggle(type)}
                    className="hover:text-primary/70"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <ClearableInput
            id="location"
            placeholder="Enter city or region..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onClear={() => setLocation('')}
          />
        </div>

        {/* Price Range Slider (Artists Only) */}
        {isArtistFilter && (
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
        )}

        {/* Event Capacity Range (Events Only) */}
        {!isArtistFilter && (
        <div className="space-y-4">
          <Label>Venue Capacity</Label>
          <div className="px-2">
            <Slider
              value={capacityRange}
              onValueChange={setCapacityRange}
              min={1}
              max={1000}
              step={10}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{capacityRange[0]} people</span>
            <span>{capacityRange[1]} people</span>
          </div>
        </div>
        )}

        {/* Event Rate Range (Events Only) */}
        {!isArtistFilter && (
        <div className="space-y-4">
          <Label>Artist Rate (per event)</Label>
          <div className="px-2">
            <Slider
              value={rateRange}
              onValueChange={setRateRange}
              min={0}
              max={5000}
              step={100}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${rateRange[0].toLocaleString()}</span>
            <span>${rateRange[1].toLocaleString()}</span>
          </div>
        </div>
        )}

        {/* Event Date Range (Events Only) */}
        {!isArtistFilter && (
        <div className="space-y-4">
          <Label>Event Dates</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="event-date-from"
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="event-date-to"
                type="date"
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                min={availableFrom}
              />
            </div>
          </div>
        </div>
        )}

        {/* Availability Date Range (Artists Only) */}
        {isArtistFilter && (
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
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleApplyFilters} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          {activeFilterCount > 0 && (
            <Button onClick={handleReset} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

