'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchCities, CitySearchResult } from '../../lib/api';

interface CityAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CityAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  className,
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDropdown = isOpen && (suggestions.length > 0 || isLoading || (value.trim().length >= 2 && !isLoading && suggestions.length === 0));

  // Resolve ISO country codes to full names
  const countryNames = useRef(
    typeof window !== 'undefined'
      ? new Intl.DisplayNames(['en'], { type: 'region' })
      : null
  );

  function formatCountry(code: string): string {
    if (!code) return '';
    try {
      return countryNames.current?.of(code) || code;
    } catch {
      return code;
    }
  }

  // Title-case city names from Amadeus (returned in ALL CAPS)
  function titleCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase());
  }

  // Debounced API search
  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(query.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const selectCity = useCallback((city: CitySearchResult) => {
    onChange(titleCase(city.name));
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
  }, [onChange]);

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

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          selectCity(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }

  // Highlight matching text in the city name
  function highlightMatch(text: string) {
    const query = value.trim().toLowerCase();
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-purple-600">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => {
          if (value.trim().length >= 2) {
            setIsOpen(true);
            fetchSuggestions(value);
          }
        }}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
        }
      />
      {showDropdown && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
        >
          {isLoading && (
            <li className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Searching…
            </li>
          )}
          {!isLoading && suggestions.length === 0 && value.trim().length >= 2 && (
            <li className="px-4 py-3 text-sm text-gray-400">No results found</li>
          )}
          {!isLoading && suggestions.map((city, index) => (
            <li
              key={`${city.iataCode}-${index}`}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`px-4 py-2.5 cursor-pointer text-sm transition-colors flex items-start gap-2.5 ${
                index === highlightedIndex
                  ? 'bg-purple-50 text-purple-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectCity(city);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <svg
                className="w-4 h-4 mt-0.5 shrink-0 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              <div className="min-w-0">
                <div>
                  {highlightMatch(titleCase(city.name))}{' '}
                  <span className="text-gray-400">({city.iataCode})</span>
                </div>
                {city.country && (
                  <div className="text-xs text-gray-400">{formatCountry(city.country)}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
