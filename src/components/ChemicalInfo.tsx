import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";
import { useCasList } from "@/hooks/useCasList";
import { normalizeCas, compareCas } from "@/lib/cas-utils";

interface ChemicalInfoProps {
  cas: string;
  chemical_name?: string;
}

interface ChemicalData {
  cas_number: string;
  chemical_name?: string;
  n_species?: number;
  n_trophic_level?: number;
  n_results?: number;
  [key: string]: any;
}

export const ChemicalInfo = ({ cas, chemical_name: propChemicalName }: ChemicalInfoProps) => {
  const normalizedCas = cas ? normalizeCas(cas) : '';
  const [chemicalName, setChemicalName] = useState<string | undefined>(propChemicalName);
  
  // Utiliser le hook partagé pour obtenir la liste des CAS
  const { getChemicalName, isLoading, casList } = useCasList();
  
  // Récupérer systématiquement le nom chimique si pas déjà fourni en props
  useEffect(() => {
    if (propChemicalName) {
      // Si un nom est fourni en props, l'utiliser
      setChemicalName(propChemicalName);
    } else if (normalizedCas && casList.length > 0) {
      // Chercher le nom dans la liste des CAS en utilisant compareCas
      const item = casList.find((item) => compareCas(item.cas_number, normalizedCas));
      if (item?.chemical_name) {
        setChemicalName(item.chemical_name);
      }
    }
  }, [normalizedCas, propChemicalName, casList]);

  // For now, we'll use the data from props or CAS list
  // In the future, we could add stats via /api/by_column if needed
  const data: ChemicalData | undefined = normalizedCas
    ? {
        cas_number: normalizedCas,
        chemical_name: chemicalName,
      }
    : undefined;

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Chemical Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">CAS Number</p>
            <p className="font-mono font-semibold text-lg">{data?.cas_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Name</p>
            {isLoading || (normalizedCas && !chemicalName && casList.length === 0) ? (
              <Skeleton className="h-6 w-48" />
            ) : chemicalName ? (
              <p className="font-semibold text-lg">{chemicalName}</p>
            ) : (
              <p className="font-semibold text-muted-foreground italic">Nom non disponible</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
