import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";

interface SearchBarProps {
  onCasSelect: (cas: string) => void;
}

interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

// Fonction pour normaliser un numéro CAS (enlever les espaces, normaliser les tirets)
const normalizeCas = (cas: string): string => {
  return cas.trim().replace(/\s+/g, '').replace(/[–—]/g, '-'); // Remplace les espaces et normalise les tirets
};

// Fonction pour comparer deux numéros CAS (insensible à la casse et aux espaces)
const compareCas = (cas1: string, cas2: string): boolean => {
  return normalizeCas(cas1).toLowerCase() === normalizeCas(cas2).toLowerCase();
};

export const SearchBar = ({ onCasSelect }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorShown, setErrorShown] = useState(false);

  const { data: casListResponse, error } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await apiFetch<{
        count: number;
        cas_numbers: string[];
        cas_with_names: Record<string, string> | Array<{ cas_number: string; chemical_name?: string }>;
      }>(API_ENDPOINTS.CAS_LIST);
      
      // Backend returns cas_with_names as an object {cas_number: chemical_name}
      // Convert it to array format for frontend use
      if (response?.cas_with_names) {
        if (Array.isArray(response.cas_with_names)) {
          // If it's already an array (legacy format), use it directly
          return response.cas_with_names.map(item => ({
            cas_number: item.cas_number,
            chemical_name: item.chemical_name,
          })) as CasItem[];
        } else {
          // Convert object format {cas: name} to array format
          const casWithNames = response.cas_with_names as Record<string, string>;
          return Object.entries(casWithNames).map(([cas_number, chemical_name]) => ({
            cas_number,
            chemical_name: chemical_name || undefined,
          })) as CasItem[];
        }
      }
      
      // Fallback: if only cas_numbers is available
      if (response?.cas_numbers && Array.isArray(response.cas_numbers)) {
        return response.cas_numbers.map(cas => ({
          cas_number: cas,
        })) as CasItem[];
      }
      
      return [];
    },
    retry: false, // Ne pas réessayer automatiquement pour éviter les notifications répétées
  });

  const casList: CasItem[] = casListResponse || [];

  // Log debug: vérifier combien de substances ont un chemical_name
  useEffect(() => {
    if (casList.length > 0) {
      const withNames = casList.filter(item => item.chemical_name).length;
      console.log(`[SearchBar] ${casList.length} substances chargées, ${withNames} ont un nom chimique (${Math.round(withNames/casList.length*100)}%)`);
      
      // Afficher quelques exemples
      const examples = casList.filter(item => item.chemical_name).slice(0, 5);
      console.log('[SearchBar] Exemples de noms:', examples.map(item => `${item.cas_number}: ${item.chemical_name}`));
    }
  }, [casList]);

  // Afficher une notification si erreur de chargement de la liste (une seule fois)
  useEffect(() => {
    if (error && !errorShown) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : "Impossible de charger la liste des produits chimiques";
      toast.error(errorMessage);
      setErrorShown(true);
    }
    // Réinitialiser le flag si l'erreur disparaît (requête réussie)
    if (!error && errorShown) {
      setErrorShown(false);
    }
  }, [error, errorShown]);

  const filteredCas = searchTerm
    ? casList.filter((item) => {
        const normalizedSearch = normalizeCas(searchTerm).toLowerCase();
        const normalizedCas = normalizeCas(item.cas_number).toLowerCase();
        const normalizedName = item.chemical_name?.toLowerCase() || '';
        return normalizedCas.includes(normalizedSearch) || normalizedName.includes(normalizedSearch);
      }).slice(0, 10)
    : [];

  // Log debug: afficher les résultats du filtre
  useEffect(() => {
    if (searchTerm && filteredCas.length > 0) {
      console.log(`[SearchBar] "${searchTerm}" -> ${filteredCas.length} résultat(s)`);
    } else if (searchTerm && filteredCas.length === 0) {
      console.log(`[SearchBar] "${searchTerm}" -> aucun résultat`);
    }
  }, [searchTerm, filteredCas]);

  const handleSearch = () => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      toast.error("Veuillez entrer un numéro CAS ou un nom de produit chimique");
      return;
    }
    
    const normalizedSearch = normalizeCas(trimmedSearch);
    
    // Try exact CAS match first (normalisé)
    const exactMatch = casList.find(item => compareCas(item.cas_number, normalizedSearch));
    if (exactMatch) {
      onCasSelect(exactMatch.cas_number);
      setSearchTerm(exactMatch.cas_number);
      setShowSuggestions(false);
      return;
    }
    
    // Try case-insensitive match on CAS (normalisé) or name
    const matchedItem = casList.find(item => 
      compareCas(item.cas_number, normalizedSearch) ||
      item.chemical_name?.toLowerCase().trim() === trimmedSearch.toLowerCase()
    );
    
    if (matchedItem) {
      onCasSelect(matchedItem.cas_number);
      setSearchTerm(matchedItem.cas_number);
      setShowSuggestions(false);
    } else {
      // Si on a des suggestions filtrées, prendre la première
      if (filteredCas.length > 0) {
        onCasSelect(filteredCas[0].cas_number);
        setSearchTerm(filteredCas[0].cas_number);
        setShowSuggestions(false);
        toast.info(`Substance sélectionnée : ${filteredCas[0].cas_number}`);
      } else {
        // Accepter l'entrée normalisée et laisser l'API valider
        // Ne pas afficher d'erreur ici car la substance pourrait exister dans la base
        // même si elle n'est pas dans la liste locale (liste peut être incomplète)
        onCasSelect(normalizedSearch);
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
            placeholder="Rechercher par numéro CAS ou nom de produit chimique (ex: 42576-02-3)..."
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
        <Button onClick={handleSearch}>
          Rechercher
        </Button>
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
                  onCasSelect(item.cas_number);
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
              Aucune substance trouvée pour "{searchTerm}"
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

