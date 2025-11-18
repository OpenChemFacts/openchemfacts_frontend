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
      toast.error(error.message || "Impossible de charger la liste des produits chimiques");
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
      onCasSelect({
        cas: exactMatch.cas_number,
        chemical_name: exactMatch.chemical_name,
      });
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
      onCasSelect({
        cas: matchedItem.cas_number,
        chemical_name: matchedItem.chemical_name,
      });
      setSearchTerm(matchedItem.cas_number);
      setShowSuggestions(false);
    } else {
      // Si on a des suggestions filtrées, prendre la première
      if (filteredCas.length > 0) {
        onCasSelect({
          cas: filteredCas[0].cas_number,
          chemical_name: filteredCas[0].chemical_name,
        });
        setSearchTerm(filteredCas[0].cas_number);
        setShowSuggestions(false);
        toast.info(`Substance sélectionnée : ${filteredCas[0].cas_number}`);
      } else {
        // Accepter l'entrée normalisée et laisser l'API valider
        // Ne pas afficher d'erreur ici car la substance pourrait exister dans la base
        // même si elle n'est pas dans la liste locale (liste peut être incomplète)
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
              Aucune substance trouvée pour "{searchTerm}"
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

