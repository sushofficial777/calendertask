'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskCategory } from '@/app/lib/types';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: Set<TaskCategory>;
  onCategoryToggle: (category: TaskCategory) => void;
  timeFilter: number | null; // null = all, 1/2/3 = weeks
  onTimeFilterChange: (weeks: number | null) => void;
}

export default function FilterPanel({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoryToggle,
  timeFilter,
  onTimeFilterChange,
}: FilterPanelProps) {
  const categories: TaskCategory[] = ['To Do', 'In Progress', 'Review', 'Completed'];
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  const selectedCount = selectedCategories.size;
  const displayText = selectedCount === categories.length 
    ? 'All Categories' 
    : selectedCount === 0 
    ? 'No Categories' 
    : `${selectedCount} Selected`;

  return (
    <div className="flex items-center gap-2">
      {/* Search Input */}
      <div className="">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-black dark:text-white" />
          <Input
            id="search"
            type="text"
            placeholder="Search by task name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 text-[13px] rounded-full bg-white shadow-none dark:bg-gray-800 border border-violet-100/80 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Category Multi-Select Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
          className="h-10 min-w-42 rounded-full bg-white dark:bg-gray-800 border border-violet-100/80 dark:border-gray-700 text-[13px] px-4 flex items-center gap-2"
        > 
          <span className="text-gray-700 dark:text-gray-300">{displayText}</span>
          <ChevronDown className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* Dropdown Menu */}
        {isCategoryDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2 space-y-1">
              {categories.map((category) => {
                const isSelected = selectedCategories.has(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className="w-full flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Call toggle function
                      onCategoryToggle(category);
                      // Don't close dropdown - allow multiple selections
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent dropdown from closing
                    }}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-violet-600 border-violet-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

