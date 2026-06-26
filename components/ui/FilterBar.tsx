import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: FilterOption[];
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterOption[];
  showSolvedOnly: boolean;
  onToggleSolvedOnly: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  difficultyFilter: string;
  onDifficultyChange: (value: string) => void;
  difficultyOptions: FilterOption[];
}

const selectClass =
  'w-full px-3 py-2 bg-[#0e1522] border border-[#263248] rounded text-sm text-[#d2d7e3] focus:outline-none focus:border-[#3a4864] transition-colors';

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  sortOptions,
  showSolvedOnly,
  onToggleSolvedOnly,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onClearFilters,
  difficultyFilter,
  onDifficultyChange,
  difficultyOptions,
}) => {
  return (
    <div className="space-y-4">
      {/* Search + Filter toggle row */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#6e7a94] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#0e1522] border border-[#263248] rounded px-9 py-2.5 text-sm text-[#e2e8f6] placeholder:text-[#6e7a94] focus:outline-none focus:border-[#3a4864] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e7a94] hover:text-[#d2d7e3]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded border transition-all ${
            showFilters
              ? 'bg-[#00a859]/15 border-[#00a859]/40 text-[#00a859]'
              : 'bg-[#0e1522] border-[#263248] text-[#9aa5bf] hover:border-[#354562] hover:text-[#d2d7e3]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 bg-[#00a859] text-white rounded text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-[#263248] bg-[#121a2a] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#f3f6ff] tracking-wider uppercase">
              Filter & Sort
            </h3>
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-[#9aa5bf] hover:text-[#d2d7e3] px-2 py-1 rounded transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onToggleFilters}
                className="text-[#6e7a94] hover:text-[#d2d7e3] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8390ac] uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className={selectClass}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8390ac] uppercase tracking-wider mb-2">
                Difficulty
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => onDifficultyChange(e.target.value)}
                className={selectClass}
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8390ac] uppercase tracking-wider mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className={selectClass}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={onToggleSolvedOnly}
                className={`w-full py-2 text-sm rounded border transition-all ${
                  showSolvedOnly
                    ? 'bg-[#9fef00]/15 border-[#9fef00]/40 text-[#9fef00]'
                    : 'bg-[#0e1522] border-[#263248] text-[#9aa5bf] hover:border-[#354562]'
                }`}
              >
                {showSolvedOnly ? '✓ Unsolved Only' : 'Unsolved Only'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category quick-pills */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 7).map((category) => (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all ${
              selectedCategory === category.value
                ? 'bg-[#00a859]/15 border-[#00a859]/50 text-[#00a859]'
                : 'bg-[#0e1522] border-[#263248] text-[#9aa5bf] hover:border-[#354562] hover:text-[#d2d7e3]'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
