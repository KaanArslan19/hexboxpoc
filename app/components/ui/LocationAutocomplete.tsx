"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";
import { inputClass } from "@/app/utils/formClasses";

interface LocationSuggestion {
  formatted: string;
  address_line1: string;
  address_line2: string;
  city?: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
}

interface LocationAutocompleteProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function LocationAutocomplete({
  name,
  value,
  onChange,
  placeholder = "Search for a location...",
  className,
  disabled = false,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(!!value); // Track if current value is from dropdown

  const abortControllerRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false); // Track if user is currently clicking a dropdown item

  // Sync external value changes to local input
  useEffect(() => {
    setInputValue(value);
    // If there's an external value, consider it valid (e.g., when editing existing data)
    if (value) {
      setIsValidSelection(true);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search function
  const searchLocations = React.useMemo(
    () =>
      debounce(async (searchText: string, signal: AbortSignal) => {
        // Early return for short queries (< 3 chars)
        if (searchText.trim().length < 3) {
          setSuggestions([]);
          setIsLoading(false);
          setShowDropdown(false);
          return;
        }

        try {
          setIsLoading(true);
          setError(null);

          const response = await fetch(
            `/api/geoapify?text=${encodeURIComponent(searchText)}`,
            { signal }
          );

          // Check if request was aborted
          if (signal.aborted) {
            return;
          }

          // Error 429 detection (if limit reached)
          if (response.status === 429) {
            const data = await response.json();
            setLimitReached(true);
            setError(
              data.error ||
                "Daily search limit reached. Please try again tomorrow."
            );
            setSuggestions([]);
            setShowDropdown(false);
            setIsLoading(false);
            return;
          }

          if (!response.ok) {
            throw new Error("Failed to fetch location suggestions");
          }

          const data = await response.json();

          if (data.success && data.results) {
            setSuggestions(data.results);
            setShowDropdown(data.results.length > 0);
          } else {
            setSuggestions([]);
            setShowDropdown(false);
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            // Request was cancelled, this is expected behavior
            return;
          }
          console.error("Error fetching location suggestions:", err);
          setError("Failed to fetch location suggestions");
          setSuggestions([]);
          setShowDropdown(false);
        } finally {
          setIsLoading(false);
        }
      }, 500), // 500ms debounce delay (saves credits)
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Mark as invalid since user is typing (not selecting from dropdown)
    setIsValidSelection(false);
    // Clear the parent value until a valid selection is made
    onChange("");
    setError(null);

    // Clean abort on re-typing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if limit is reached
    if (limitReached) {
      return;
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    if (newValue.trim().length >= 3) {
      searchLocations(newValue, abortControllerRef.current.signal);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    isSelectingRef.current = true; // Mark that we're selecting from dropdown
    const locationText = suggestion.formatted || suggestion.address_line1;
    setInputValue(locationText);
    onChange(locationText);
    setIsValidSelection(true); // Mark as valid selection
    setError(null);
    setSuggestions([]);
    setShowDropdown(false);

    // Reset the selecting flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 300);
  };

  const handleBlur = () => {
    // Small delay to allow click on dropdown to register
    setTimeout(() => {
      // Don't show error if user is currently selecting from dropdown
      if (isSelectingRef.current) {
        return;
      }

      // Check if input has value but no valid selection was made
      if (!isValidSelection && inputValue.trim().length > 0) {
        setError("Please select a location from the dropdown");
      }
    }, 200);
  };

  const handleInputFocus = () => {
    // Clear error when user focuses to try again
    setError(null);

    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || limitReached}
          className={`${className || inputClass} ${
            !isValidSelection && inputValue.trim().length > 0
              ? "border-orangeColor dark:border-orangeColorDull"
              : ""
          }`}
          autoComplete="off"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blueColor border-t-transparent"></div>
          </div>
        )}

        {/* Valid selection indicator */}
        {isValidSelection && inputValue.trim().length > 0 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-1 text-sm text-redColor dark:text-redColorDull">
          {error}
        </div>
      )}

      {/* Validation warning for incomplete input */}
      {!isValidSelection &&
        inputValue.trim().length > 0 &&
        !error &&
        !isLoading && (
          <div className="mt-1 text-sm text-orangeColor dark:text-orangeColorDull">
            Please select a location from the dropdown suggestions
          </div>
        )}

      {/* Limit reached warning */}
      {limitReached && (
        <div className="mt-1 text-xs text-orangeColor dark:text-orangeColorDull">
          Daily search limit reached. Please type your location and select from
          suggestions when available.
        </div>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && !limitReached && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-dark-surfaceHover border-b border-gray-200 dark:border-dark-border last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-dark-text">
                {suggestion.address_line1 || suggestion.formatted}
              </div>
              {suggestion.address_line2 && (
                <div className="text-sm text-dark-border dark:text-dark-textMuted mt-1">
                  {suggestion.address_line2}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {!limitReached && inputValue.length > 0 && inputValue.length < 3 && (
        <div className="mt-1 text-xs text-dark-border dark:text-dark-textMuted">
          Type at least 3 characters to search
        </div>
      )}
    </div>
  );
}
