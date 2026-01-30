import React, { useState } from 'react';
import { Search, Filter, Save, X } from 'lucide-react';

interface AdvancedSearchFiltersProps {
  onSearch: (filters: any) => void;
  onSaveSearch: (name: string, filters: any) => void;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  onSearch,
  onSaveSearch,
}) => {
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(50);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchName, setSearchName] = useState('');

  const genreOptions = [
    'Rock',
    'Jazz',
    'Hip-Hop',
    'Electronic',
    'Classical',
    'Pop',
    'Country',
    'R&B',
  ];

  const handleGenreToggle = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSearch = () => {
    const filters = {
      query,
      genres,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      location,
      radius,
      minRating,
      sortBy,
    };
    onSearch(filters);
  };

  const handleSaveSearch = () => {
    if (searchName) {
      const filters = {
        query,
        genres,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        location,
        radius,
        minRating,
        sortBy,
      };
      onSaveSearch(searchName, filters);
      setShowSaveSearch(false);
      setSearchName('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Search size={32} className="text-blue-600" />
          Advanced Search
        </h1>
      </div>

      {/* Main Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by artist name, venue, or skill..."
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute right-4 top-4 text-gray-400" size={24} />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genres */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">Genres</label>
          <div className="space-y-2">
            {genreOptions.map((genre) => (
              <label key={genre} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genres.includes(genre)}
                  onChange={() => handleGenreToggle(genre)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-700">{genre}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">Price Range</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600">Min: ${priceRange.min}</label>
              <input
                type="range"
                min="0"
                max="5000"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Max: ${priceRange.max}</label>
              <input
                type="range"
                min="0"
                max="5000"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or zip code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Radius: {radius} miles
          </label>
          <input
            type="range"
            min="1"
            max="500"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Minimum Rating */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">Minimum Rating</label>
          <div className="flex gap-2">
            {[0, 3, 4, 4.5].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(rating)}
                className={`px-4 py-2 rounded-lg transition ${
                  minRating === rating
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating === 0 ? 'Any' : `${rating}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="price">Price (Low to High)</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="popularity">Popularity</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSearch}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold flex items-center justify-center gap-2"
        >
          <Search size={18} />
          Search
        </button>
        <button
          onClick={() => setShowSaveSearch(true)}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-2"
        >
          <Save size={18} />
          Save Search
        </button>
        <button
          onClick={() => {
            setQuery('');
            setGenres([]);
            setPriceRange({ min: 0, max: 5000 });
            setLocation('');
            setRadius(50);
            setMinRating(0);
            setSortBy('relevance');
          }}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-2"
        >
          <X size={18} />
          Clear
        </button>
      </div>

      {/* Save Search Modal */}
      {showSaveSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Save This Search</h2>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Give this search a name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveSearch}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveSearch(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilters;
