import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Search, Filter, X, MapPin, Music, DollarSign, Calendar as CalendarIcon } from 'lucide-react';

interface ArtistFiltersProps {
  onFilterChange: (filters: ArtistFilterValues) => void;
  isLoading?: boolean;
}

export interface ArtistFilterValues {
  searchQuery: string;
  genre: string[];
  location: string;
  minFee?: number;
  maxFee?: number;
  availableDate?: string;
}

const COMMON_GENRES = [
  'Hip-Hop', 'R&B', 'Jazz', 'Soul', 'Blues', 'Rock', 'Indie',
  'Electronic', 'Pop', 'Country', 'Reggae', 'Latin', 'Gospel',
  'Punk', 'Metal', 'Folk', 'Funk', 'Classical', 'DJ'
];

export default function ArtistFilters({ onFilterChange, isLoading }: ArtistFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [minFee, setMinFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [availableDate, setAvailableDate] = useState('');

  const hasActiveFilters = selectedGenres.length > 0 || location || minFee || maxFee || availableDate;

  const applyFilters = () => {
    onFilterChange({
      searchQuery,
      genre: selectedGenres,
      location,
      minFee: minFee ? parseInt(minFee) : undefined,
      maxFee: maxFee ? parseInt(maxFee) : undefined,
      availableDate: availableDate || undefined,
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setLocation('');
    setMinFee('');
    setMaxFee('');
    setAvailableDate('');
    onFilterChange({ searchQuery: '', genre: [], location: '' });
  };

  const toggleGenre = (genre: string) => {
    const updated = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(updated);
  };

  // Apply search immediately on typing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChange({
      searchQuery: value,
      genre: selectedGenres,
      location,
      minFee: minFee ? parseInt(minFee) : undefined,
      maxFee: maxFee ? parseInt(maxFee) : undefined,
      availableDate: availableDate || undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search Bar + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="artist-search"
            name="artist-search"
            placeholder="Search by name, genre, or location..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 shrink-0"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-1.5 py-0.5 rounded-full">
              {selectedGenres.length + (location ? 1 : 0) + (minFee || maxFee ? 1 : 0) + (availableDate ? 1 : 0)}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-700 shrink-0">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {/* Genre Filter */}
          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Music className="h-3.5 w-3.5" />
              Genre
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`
                    px-2.5 py-1 text-xs rounded-full border transition-colors
                    ${selectedGenres.includes(genre)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400'
                    }
                  `}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <Label htmlFor="location-filter" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </Label>
            <Input
              id="location-filter"
              name="location-filter"
              placeholder="e.g. Atlanta, GA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Fee Range */}
          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <DollarSign className="h-3.5 w-3.5" />
              Fee Range
            </Label>
            <div className="flex items-center gap-2 max-w-xs">
              <Input
                id="min-fee"
                name="min-fee"
                type="number"
                placeholder="Min"
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
                className="w-24"
              />
              <span className="text-gray-400">—</span>
              <Input
                id="max-fee"
                name="max-fee"
                type="number"
                placeholder="Max"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
                className="w-24"
              />
            </div>
          </div>

          {/* Available Date */}
          <div>
            <Label htmlFor="available-date" className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <CalendarIcon className="h-3.5 w-3.5" />
              Available On
            </Label>
            <Input
              id="available-date"
              name="available-date"
              type="date"
              value={availableDate}
              onChange={(e) => setAvailableDate(e.target.value)}
              className="max-w-xs"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Apply Button */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              size="sm"
              onClick={applyFilters}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
