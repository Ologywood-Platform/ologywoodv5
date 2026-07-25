import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * City autocomplete input that suggests cities from existing artist/venue profiles.
 * Prevents typos and ensures consistent city names across all profiles.
 */
export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'e.g. Atlanta',
  className = '',
  id,
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all cities from the backend
  const { data: cities } = trpc.artist.getCities.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter suggestions based on current input
  const suggestions = value.trim().length > 0
    ? (cities || []).filter((city) =>
        city.toLowerCase().startsWith(value.toLowerCase().trim())
      ).slice(0, 8)
    : [];

  const showDropdown = isOpen && suggestions.length > 0 && value.trim().length > 0;

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

  // Reset highlight when value changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  const selectCity = useCallback((city: string) => {
    onChange(city);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectCity(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="city-suggestions"
        className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-input focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <ul
          id="city-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto"
        >
          {suggestions.map((city, index) => (
            <li
              key={city}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before click
                selectCity(city);
              }}
            >
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span>{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
