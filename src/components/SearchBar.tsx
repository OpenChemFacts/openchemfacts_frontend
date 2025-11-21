import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/config";
import { normalizeCas, compareCas } from "@/lib/cas-utils";

export interface ChemicalMetadata {
  cas: string;
  chemical_name?: string;
}

interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

type CasListResponse = Array<{ cas_number: string; name?: string }>;

interface SearchBarProps {
  onCasSelect: (metadata: ChemicalMetadata) => void;
}

const MAX_SUGGESTIONS = 10;
const DEBOUNCE_DELAY = 200; // ms

export const SearchBar = ({ onCasSelect }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const errorShownRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch CAS list directly from API endpoint
  const { data: casListResponse, error, isLoading } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await apiFetch<CasListResponse>(API_ENDPOINTS.CAS_LIST);
      return response;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: false,
  });

  // Convert API response to array format for easier use
  const casList: CasItem[] = useMemo(() => {
    if (!casListResponse) return [];
    return casListResponse.map((item) => ({
      cas_number: item.cas_number,
      chemical_name: item.name,
    }));
  }, [casListResponse]);

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debug log: check how many substances have a chemical_name (dev only)
  useEffect(() => {
    if (import.meta.env.DEV && casList.length > 0) {
      const withNames = casList.filter(item => item.chemical_name).length;
      console.log(`[SearchBar] ${casList.length} substances loaded, ${withNames} have a chemical name (${Math.round(withNames/casList.length*100)}%)`);
    }
  }, [casList]);

  // Show a notification if list loading error (only once)
  useEffect(() => {
    if (error && !errorShownRef.current) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : "Unable to load the chemical list";
      toast.error(errorMessage);
      errorShownRef.current = true;
    }
    // Reset the flag if the error disappears (successful request)
    if (!error && errorShownRef.current) {
      errorShownRef.current = false;
    }
  }, [error]);

  // Optimized filtered CAS list with memoization
  const filteredCas = useMemo(() => {
    if (!debouncedSearchTerm.trim() || casList.length === 0) return [];
    
    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    const normalizedCasSearch = normalizeCas(debouncedSearchTerm).toLowerCase();
    
    return casList
      .filter((item) => {
        const normalizedCas = normalizeCas(item.cas_number).toLowerCase();
        const normalizedName = item.chemical_name?.toLowerCase() || '';
        return normalizedCas.includes(normalizedCasSearch) || normalizedName.includes(searchLower);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [debouncedSearchTerm, casList]);

  // Helper function to select a CAS item
  const selectCasItem = useCallback((item: CasItem) => {
    const metadata = {
      cas: item.cas_number,
      chemical_name: item.chemical_name,
    };
    
    // Debug log in development
    if (import.meta.env.DEV) {
      console.log(`[SearchBar] CAS selected:`, metadata);
    }
    
    onCasSelect(metadata);
    setSearchTerm(item.cas_number);
    setShowSuggestions(false);
  }, [onCasSelect]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      toast.error("Please enter a CAS number or chemical name");
      return;
    }
    
    const normalizedSearch = normalizeCas(trimmedSearch);
    
    // Try exact CAS match first (normalized)
    const exactMatch = casList.find(item => compareCas(item.cas_number, normalizedSearch));
    if (exactMatch) {
      selectCasItem(exactMatch);
      return;
    }
    
    // Try case-insensitive match on CAS (normalized) or name
    const matchedItem = casList.find(item => 
      compareCas(item.cas_number, normalizedSearch) ||
      item.chemical_name?.toLowerCase().trim() === trimmedSearch.toLowerCase()
    );
    
    if (matchedItem) {
      selectCasItem(matchedItem);
    } else if (filteredCas.length > 0) {
      // If we have filtered suggestions, take the first one
      selectCasItem(filteredCas[0]);
      toast.info(`Substance selected: ${filteredCas[0].cas_number}`);
    } else {
      // Accept the normalized input and let the API validate
      // Don't display an error here as the substance might exist in the database
      // even if it's not in the local list (list may be incomplete)
      onCasSelect({
        cas: normalizedSearch,
        chemical_name: undefined,
      });
      setShowSuggestions(false);
    }
  }, [searchTerm, casList, filteredCas, onCasSelect, selectCasItem]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSuggestions]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  }, []);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (searchTerm) {
      setShowSuggestions(true);
    }
  }, [searchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }, [handleSearch]);

  // Handle suggestion item click
  const handleSuggestionClick = useCallback((item: CasItem) => {
    selectCasItem(item);
  }, [selectCasItem]);

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
          {filteredCas.length > 0 ? (
            filteredCas.map((item) => (
              <button
                key={item.cas_number}
                type="button"
                role="option"
                className="w-full text-left px-4 py-2 hover:bg-muted rounded-md transition-colors focus:bg-muted focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuggestionClick(item);
                }}
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

