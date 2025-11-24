import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { normalizeCas, compareCas } from "@/lib/cas-utils";

export interface ChemicalMetadata {
  cas: string;
  chemical_name?: string;
}

interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

type SearchResponse = {
  query: string;
  count: number;
  matches: Array<{ cas: string; name?: string }>;
};

interface SearchBarProps {
  onCasSelect: (metadata: ChemicalMetadata) => void;
  initialCas?: string;
}

const DEBOUNCE_DELAY = 300;
const MAX_SEARCH_LENGTH = 200; // Maximum length for search input to prevent DoS

export const SearchBar = ({ onCasSelect, initialCas }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(initialCas || "");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialCas || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const errorShownRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResponse, error, isLoading } = useQuery({
    queryKey: ["search", debouncedSearchTerm.trim()],
    queryFn: async (): Promise<SearchResponse | null> => {
      const trimmed = debouncedSearchTerm.trim();
      if (!trimmed) return null;
      
      const endpoint = `/search?query=${encodeURIComponent(trimmed)}`;
      return apiFetch<SearchResponse>(endpoint);
    },
    enabled: debouncedSearchTerm.trim().length > 0,
    staleTime: 30 * 1000,
    retry: false,
  });

  const searchResults: CasItem[] = useMemo(() => {
    if (!searchResponse?.matches || !Array.isArray(searchResponse.matches)) {
      return [];
    }
    return searchResponse.matches.map((item) => ({
      cas_number: item.cas,
      chemical_name: item.name,
    }));
  }, [searchResponse]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (error && !errorShownRef.current && debouncedSearchTerm.trim()) {
      const message = error instanceof ApiError ? error.message : "Unable to search substances";
      toast.error(message);
      errorShownRef.current = true;
    }
    if (!error) {
      errorShownRef.current = false;
    }
  }, [error, debouncedSearchTerm]);

  const selectCasItem = useCallback((item: CasItem) => {
    onCasSelect({
      cas: item.cas_number,
      chemical_name: item.chemical_name,
    });
    setSearchTerm(item.cas_number);
    setShowSuggestions(false);
  }, [onCasSelect]);

  const handleSearch = useCallback(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      toast.error("Please enter a CAS number or chemical name");
      return;
    }

    const normalized = normalizeCas(trimmed);

    // Try to find a match in search results
    if (searchResults.length > 0) {
      const match = searchResults.find(
        (item) =>
          compareCas(item.cas_number, normalized) ||
          item.chemical_name?.toLowerCase().trim() === trimmed.toLowerCase()
      );
      
      if (match) {
        selectCasItem(match);
        return;
      }
      
      // Fallback to first result
      selectCasItem(searchResults[0]);
      toast.info(`Substance selected: ${searchResults[0].cas_number}`);
    } else {
      // No results - still allow selection (will be validated by other API endpoints)
      onCasSelect({ cas: normalized, chemical_name: undefined });
      setShowSuggestions(false);
    }
  }, [searchTerm, searchResults, onCasSelect, selectCasItem]);

  useEffect(() => {
    if (initialCas) {
      setSearchTerm(initialCas);
      setDebouncedSearchTerm(initialCas);
    }
  }, [initialCas]);

  useEffect(() => {
    if (!showSuggestions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit input length to prevent DoS attacks and excessive API calls
    if (value.length <= MAX_SEARCH_LENGTH) {
      setSearchTerm(value);
      setShowSuggestions(true);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm) setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative max-w-3xl mx-auto">
      <div className="rounded-xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg p-6 animate-fade-in hover:shadow-xl transition-all duration-300">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search by CAS number or chemical name (e.g.: 42576-02-3)..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              className="pl-12 h-12 text-base border-2 focus:border-primary/50"
              aria-label="Search for CAS number or chemical name"
              aria-expanded={showSuggestions}
              aria-haspopup="listbox"
              autoComplete="off"
            />
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" 
              aria-hidden="true"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            size="lg" 
            className="h-12 px-6 font-semibold"
            disabled={isLoading}
            aria-label="Search"
          >
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </div>
      </div>

      {showSuggestions && debouncedSearchTerm && (
        <Card 
          className="absolute w-full mt-2 p-2 shadow-elevated z-10 max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center" role="status">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((item) => (
              <button
                key={item.cas_number}
                type="button"
                role="option"
                className="w-full text-left px-4 py-2 hover:bg-muted rounded-md transition-colors focus:bg-muted focus:outline-none"
                onClick={() => selectCasItem(item)}
                aria-label={`Select ${item.cas_number}${item.chemical_name ? ` - ${item.chemical_name}` : ''}`}
              >
                <div className="font-mono text-sm font-semibold">{item.cas_number}</div>
                {item.chemical_name && (
                  <div className="text-xs text-muted-foreground">{item.chemical_name}</div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center" role="status">
              No substance found for "{debouncedSearchTerm}"
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

