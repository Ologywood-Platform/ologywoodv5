import { toSlug } from '@/lib/slugify';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search, MapPin, Music, ArrowRight } from 'lucide-react';
import { ClearableInput } from '@/components/ui/clearable-input';
import { LazyImage } from '@/components/LazyImage';
import { trpc } from '@/lib/trpc';

interface ArtistSearchDropdownProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  maxResults?: number;
}

export function ArtistSearchDropdown({
  className = '',
  inputClassName = '',
  placeholder = 'Search by artist name or location...',
  maxResults = 5,
}: ArtistSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: artists } = trpc.artist.search.useQuery({});

  const filtered = query.trim().length > 0
    ? (artists || []).filter((artist) => {
        const q = query.toLowerCase();
        return (
          artist.artistName.toLowerCase().includes(q) ||
          (artist.location?.toLowerCase().includes(q)) ||
          (Array.isArray(artist.genre) && artist.genre.some((g: string) => g.toLowerCase().includes(q)))
        );
      }).slice(0, maxResults)
    : [];

  const hasResults = filtered.length > 0;
  const showDropdown = isOpen && query.trim().length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  const navigateToBrowse = useCallback(() => {
    setIsOpen(false);
    navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
  }, [navigate, query]);

  const navigateToArtist = useCallback((artistId: number, artistName: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/artist/${toSlug(artistName)}`);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Enter' && query.trim()) {
        navigateToBrowse();
      }
      return;
    }

    const totalItems = hasResults ? filtered.length + 1 : 0; // +1 for "See all results"

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          navigateToArtist(filtered[highlightedIndex].id, filtered[highlightedIndex].artistName);
        } else {
          navigateToBrowse();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <ClearableInput
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onClear={() => {
          setQuery('');
          setIsOpen(false);
        }}
        onFocus={() => {
          if (query.trim().length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        leftIcon={<Search className="h-4 sm:h-5 w-4 sm:w-5" />}
        className={inputClassName}
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        role="combobox"
      />

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
        >
          {hasResults ? (
            <>
              {filtered.map((artist, index) => (
                <button
                  key={artist.id}
                  type="button"
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    highlightedIndex === index
                      ? 'bg-primary/5'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => navigateToArtist(artist.id, artist.artistName)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {/* Artist photo */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    {artist.profilePhotoUrl ? (
                      <LazyImage
                        src={artist.profilePhotoUrl}
                        alt={artist.artistName}
                        containerClassName="w-full h-full"
                        imageClassName="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Artist info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {artist.artistName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {Array.isArray(artist.genre) && artist.genre.length > 0 && (
                        <span className="truncate">{artist.genre.slice(0, 2).join(', ')}</span>
                      )}
                      {artist.location && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {artist.location}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {/* "See all results" link */}
              <button
                type="button"
                role="option"
                aria-selected={highlightedIndex === filtered.length}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-t transition-colors ${
                  highlightedIndex === filtered.length
                    ? 'bg-primary/5 text-primary'
                    : 'text-primary hover:bg-slate-50'
                }`}
                onClick={navigateToBrowse}
                onMouseEnter={() => setHighlightedIndex(filtered.length)}
              >
                See all results for "{query}"
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <Music className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No artists found for "{query}"</p>
              <button
                type="button"
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                onClick={navigateToBrowse}
              >
                Search on Browse page
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
