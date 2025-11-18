import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useCasList, type CasItem } from "@/hooks/useCasList";
import { normalizeCas, compareCas } from "@/lib/cas-utils";

export interface ChemicalMetadata {
  cas: string;
  chemical_name?: string;
}

interface SearchBarProps {
  onCasSelect: (metadata: ChemicalMetadata) => void;
}

export const SearchBar = ({ onCasSelect }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorShown, setErrorShown] = useState(false);

  const { casList, error } = useCasList();

  // Debug log: check how many substances have a chemical_name
  useEffect(() => {
    if (casList.length > 0) {
      const withNames = casList.filter(item => item.chemical_name).length;
      console.log(`[SearchBar] ${casList.length} substances loaded, ${withNames} have a chemical name (${Math.round(withNames/casList.length*100)}%)`);
      
      // Display some examples
      const examples = casList.filter(item => item.chemical_name).slice(0, 5);
      console.log('[SearchBar] Name examples:', examples.map(item => `${item.cas_number}: ${item.chemical_name}`));
    }
  }, [casList]);

  // Show a notification if list loading error (only once)
  useEffect(() => {
    if (error && !errorShown) {
      toast.error(error.message || "Unable to load the chemical list");
      setErrorShown(true);
    }
    // Reset the flag if the error disappears (successful request)
    if (!error && errorShown) {
      setErrorShown(false);
    }
  }, [error, errorShown]);

  const filteredCas = searchTerm
    ? casList.filter((item) => {
        const searchLower = searchTerm.toLowerCase().trim();
        const normalizedCasSearch = normalizeCas(searchTerm).toLowerCase();
        const normalizedCas = normalizeCas(item.cas_number).toLowerCase();
        const normalizedName = item.chemical_name?.toLowerCase() || '';
        return normalizedCas.includes(normalizedCasSearch) || normalizedName.includes(searchLower);
      }).slice(0, 10)
    : [];

  // Debug log: display filter results
  useEffect(() => {
    if (searchTerm && filteredCas.length > 0) {
      console.log(`[SearchBar] "${searchTerm}" -> ${filteredCas.length} result(s)`);
    } else if (searchTerm && filteredCas.length === 0) {
      console.log(`[SearchBar] "${searchTerm}" -> no result`);
    }
  }, [searchTerm, filteredCas]);

  const handleSearch = () => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      toast.error("Please enter a CAS number or chemical name");
      return;
    }
    
    const normalizedSearch = normalizeCas(trimmedSearch);
    
    // Try exact CAS match first (normalized)
    const exactMatch = casList.find(item => compareCas(item.cas_number, normalizedSearch));
    if (exactMatch) {
      onCasSelect({
        cas: exactMatch.cas_number,
        chemical_name: exactMatch.chemical_name,
      });
      setSearchTerm(exactMatch.cas_number);
      setShowSuggestions(false);
      return;
    }
    
    // Try case-insensitive match on CAS (normalized) or name
    const matchedItem = casList.find(item => 
      compareCas(item.cas_number, normalizedSearch) ||
      item.chemical_name?.toLowerCase().trim() === trimmedSearch.toLowerCase()
    );
    
    if (matchedItem) {
      onCasSelect({
        cas: matchedItem.cas_number,
        chemical_name: matchedItem.chemical_name,
      });
      setSearchTerm(matchedItem.cas_number);
      setShowSuggestions(false);
    } else {
      // If we have filtered suggestions, take the first one
      if (filteredCas.length > 0) {
        onCasSelect({
          cas: filteredCas[0].cas_number,
          chemical_name: filteredCas[0].chemical_name,
        });
        setSearchTerm(filteredCas[0].cas_number);
        setShowSuggestions(false);
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
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    if (showSuggestions) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="rounded-xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg p-6 animate-fade-in hover:shadow-xl transition-all duration-300">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search by CAS number or chemical name (e.g.: 42576-02-3)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 h-12 text-base border-2 focus:border-primary/50"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
          </div>
          <Button onClick={handleSearch} size="lg" className="h-12 px-6 font-semibold">
            Search
          </Button>
        </div>
      </div>

      {showSuggestions && searchTerm && (
        <Card className="absolute w-full mt-2 p-2 shadow-elevated z-10 max-h-80 overflow-y-auto">
          {filteredCas.length > 0 ? (
            filteredCas.map((item) => (
              <button
                key={item.cas_number}
                className="w-full text-left px-4 py-2 hover:bg-muted rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm(item.cas_number);
                  onCasSelect({
                    cas: item.cas_number,
                    chemical_name: item.chemical_name,
                  });
                  setShowSuggestions(false);
                }}
              >
                <div className="font-mono text-sm font-semibold">{item.cas_number}</div>
                {item.chemical_name && (
                  <div className="text-xs text-muted-foreground">{item.chemical_name}</div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No substance found for "{searchTerm}"
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

