"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  submitTo?: string;
}

export default function SearchForm({ submitTo = "/search" }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const searchQuery = params.get("query") || "";
  const currentStatus = params.get("status") || "active";
  const sortBy = params.get("sortBy") || "total_raised";
  const sortOrder = params.get("sortOrder") || "desc";

  const [query, setQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryInUrl();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);

    if (newValue.trim() === "" && searchQuery) {
      clearQueryFromUrl();
    }
  };

  const clearQueryFromUrl = () => {
    const urlParams = new URLSearchParams();

    if (currentStatus) {
      urlParams.set("status", currentStatus);
    }

    if (sortBy !== "total_raised") {
      urlParams.set("sortBy", sortBy);
    }

    if (sortOrder !== "desc") {
      urlParams.set("sortOrder", sortOrder);
    }

    const queryString = urlParams.toString();

    if (queryString) {
      router.push(`${submitTo}?${queryString}`);
    } else {
      router.push("/campaigns");
    }
  };

  const updateQueryInUrl = () => {
    const urlParams = new URLSearchParams();

    if (query.trim()) {
      urlParams.set("query", query.trim());
    }

    if (currentStatus) {
      urlParams.set("status", currentStatus);
    }

    if (sortBy !== "total_raised") {
      urlParams.set("sortBy", sortBy);
    }

    if (sortOrder !== "desc") {
      urlParams.set("sortOrder", sortOrder);
    }

    const queryString = urlParams.toString();

    if (!queryString) {
      router.push("/campaigns");
    } else {
      router.push(`${submitTo}?${queryString}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    clearQueryFromUrl();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-full mx-auto">
      <div
        className={`
          relative flex items-center overflow-hidden rounded-full
          border border-blueColorDull/20 bg-white shadow-lg transition-all duration-300
          ${isFocused ? "ring-2 ring-blueColor/30 shadow-lightBlueColor" : ""}`}
      >
        <input
          type="text"
          placeholder="Search campaigns..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="
            w-full py-2 px-6 text-textPrimary outline-none bg-transparent
            placeholder:text-textMuted text-base font-medium
          "
          aria-label="Search by campaign title"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 h-full px-2 flex items-center justify-center text-textMuted dark:text-textPrimary hover:text-textPrimary "
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}

        <button
          type="submit"
          className="
            absolute right-0 h-full px-4 flex items-center justify-center
            bg-gradient-to-r from-lightBlueColor to-blueColor/80 text-white
            hover:from-lightBlueColor/40 hover:to-blueColor transition-all outline-none focus:border-transparent border-transparent focus:ring-0
          "
          aria-label="Submit search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </form>
  );
}
