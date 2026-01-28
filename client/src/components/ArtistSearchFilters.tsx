import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface FilterState {
  searchQuery: string;
  genres: string[];
  location: string;
  minPrice: number;
  maxPrice: number;
  availableFrom: string;
  availableTo: string;
}

interface ArtistSearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  genres: string[];
}

export function ArtistSearchFilters({ onFilterChange, genres }: ArtistSearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    genres: [],
    location: "",
    minPrice: 0,
    maxPrice: 10000,
    availableFrom: "",
    availableTo: "",
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, searchQuery: e.target.value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleGenreToggle = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    const newFilters = { ...filters, genres: newGenres };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, location: e.target.value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (type: "min" | "max", value: number) => {
    const newFilters = {
      ...filters,
      [type === "min" ? "minPrice" : "maxPrice"]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (type: "from" | "to", value: string) => {
    const newFilters = {
      ...filters,
      [type === "from" ? "availableFrom" : "availableTo"]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      searchQuery: "",
      genres: [],
      location: "",
      minPrice: 0,
      maxPrice: 10000,
      availableFrom: "",
      availableTo: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount = [
    filters.searchQuery,
    filters.genres.length > 0,
    filters.location,
    filters.minPrice > 0 || filters.maxPrice < 10000,
    filters.availableFrom,
    filters.availableTo,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by artist name or keyword..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Genre Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Genres</label>
          <div className="space-y-2">
            {genres.map((genre) => (
              <label key={genre} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.genres.includes(genre)}
                  onChange={() => handleGenreToggle(genre)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">{genre}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Location</label>
          <input
            type="text"
            placeholder="City or region..."
            value={filters.location}
            onChange={handleLocationChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Price Range</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handlePriceChange("min", parseInt(e.target.value) || 0)}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handlePriceChange("max", parseInt(e.target.value) || 10000)}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div className="text-xs text-gray-600">
              ${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Available From</label>
          <input
            type="date"
            value={filters.availableFrom}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Available To</label>
          <input
            type="date"
            value={filters.availableTo}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.searchQuery && (
                <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  Search: {filters.searchQuery}
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, searchQuery: "" };
                      setFilters(newFilters);
                      onFilterChange(newFilters);
                    }}
                    className="hover:text-purple-900"
                  >
                    <X size={16} />
                  </button>
                </span>
              )}
              {filters.genres.length > 0 && (
                <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  Genres: {filters.genres.join(", ")}
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, genres: [] };
                      setFilters(newFilters);
                      onFilterChange(newFilters);
                    }}
                    className="hover:text-purple-900"
                  >
                    <X size={16} />
                  </button>
                </span>
              )}
              {filters.location && (
                <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  Location: {filters.location}
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, location: "" };
                      setFilters(newFilters);
                      onFilterChange(newFilters);
                    }}
                    className="hover:text-purple-900"
                  >
                    <X size={16} />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
