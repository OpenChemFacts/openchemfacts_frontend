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

interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

export const SearchBar = ({ onCasSelect }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: casListResponse, error } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await apiFetch<any>(API_ENDPOINTS.CAS_LIST);
      console.log("CAS List API Response:", response);
      // Handle both array and object responses
      if (response && typeof response === 'object' && response.cas_list) {
        return response.cas_list as CasItem[];
      }
      return [];
    },
  });

  const casList: CasItem[] = casListResponse || [];

  // Afficher une notification si erreur de chargement de la liste
  useEffect(() => {
    if (error) {
      toast.error("Impossible de charger la liste des produits chimiques");
    }
  }, [error]);

  const filteredCas = searchTerm
    ? casList.filter((item) =>
        item.cas_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.chemical_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      ).slice(0, 10)
    : [];

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a CAS number or chemical name");
      return;
    }
    
    // Try exact CAS match first
    const exactMatch = casList.find(item => item.cas_number === searchTerm);
    if (exactMatch) {
      onCasSelect(exactMatch.cas_number);
      setShowSuggestions(false);
      return;
    }
    
    // Try case-insensitive match on CAS or name
    const matchedItem = casList.find(item => 
      item.cas_number.toLowerCase() === searchTerm.toLowerCase() ||
      item.chemical_name?.toLowerCase() === searchTerm.toLowerCase()
    );
    
    if (matchedItem) {
      onCasSelect(matchedItem.cas_number);
      setShowSuggestions(false);
    } else {
      // Accept the input as-is and let API validate
      onCasSelect(searchTerm);
      setShowSuggestions(false);
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

      {showSuggestions && searchTerm && filteredCas.length > 0 && (
        <Card className="absolute w-full mt-2 p-2 shadow-elevated z-10 max-h-80 overflow-y-auto">
          {filteredCas.map((item) => (
            <button
              key={item.cas_number}
              className="w-full text-left px-4 py-2 hover:bg-muted rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm(item.cas_number);
                onCasSelect(item.cas_number);
                setShowSuggestions(false);
              }}
            >
              <div className="font-mono text-sm font-semibold">{item.cas_number}</div>
              {item.chemical_name && (
                <div className="text-xs text-muted-foreground">{item.chemical_name}</div>
              )}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
};
