import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";

interface SearchBarProps {
  onCasSelect: (cas: string) => void;
}

export const SearchBar = ({ onCasSelect }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: casList, error } = useQuery({
    queryKey: ["cas-list"],
    queryFn: () => apiFetch<string[]>(API_ENDPOINTS.CAS_LIST),
  });

  // Afficher une notification si erreur de chargement de la liste
  useEffect(() => {
    if (error) {
      toast.error("Impossible de charger la liste des produits chimiques");
    }
  }, [error]);

  const filteredCas = casList?.filter((cas) =>
    cas.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a CAS number or chemical name");
      return;
    }
    
    // Try exact CAS match first
    if (casList?.includes(searchTerm)) {
      onCasSelect(searchTerm);
      setShowSuggestions(false);
    } else {
      // Try case-insensitive partial match
      const matchedCas = casList?.find(cas => 
        cas.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchedCas) {
        onCasSelect(matchedCas);
        setShowSuggestions(false);
      } else {
        // Accept the input as-is (might be a chemical name)
        // The API will handle validation
        onCasSelect(searchTerm);
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
    <div className="relative max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by CAS number or chemical name (e.g., 42576-02-3)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={handleSearch} className="bg-gradient-primary">
          Search
        </Button>
      </div>

      {showSuggestions && searchTerm && filteredCas && filteredCas.length > 0 && (
        <Card className="absolute w-full mt-2 p-2 shadow-elevated z-10">
          {filteredCas.map((cas) => (
            <button
              key={cas}
              className="w-full text-left px-4 py-2 hover:bg-muted rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm(cas);
                onCasSelect(cas);
                setShowSuggestions(false);
              }}
            >
              {cas}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
};
