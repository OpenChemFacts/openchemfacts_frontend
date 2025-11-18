import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Info } from "lucide-react";
import { useCasList } from "@/hooks/useCasList";
import { normalizeCas } from "@/lib/cas-utils";

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
  
  // Utiliser le hook partagé pour obtenir la liste des CAS (fallback si pas de nom en props)
  const { getChemicalName, isLoading } = useCasList();
  
  // Priorité 1: Utiliser le nom passé en props (depuis SearchBar)
  // Priorité 2: Chercher dans la liste des CAS via le hook
  const chemicalName = propChemicalName || (normalizedCas ? getChemicalName(normalizedCas) : undefined);

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
        {chemicalName && (
          <p className="text-xl font-semibold text-foreground mt-2">
            {chemicalName}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">CAS Number</p>
            <p className="font-mono font-semibold text-lg">{data?.cas_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Name</p>
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : chemicalName ? (
              <p className="font-semibold text-base">{chemicalName}</p>
            ) : (
              <p className="font-semibold text-muted-foreground italic">Chargement...</p>
            )}
          </div>
        </div>

        {data && (
          <div className="flex gap-3 pt-2">
            <Badge variant="secondary" className="text-base py-1 px-4">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                CAS: {data.cas_number}
              </span>
            </Badge>
            {chemicalName && (
              <Badge variant="outline" className="text-base py-1 px-4">
                {chemicalName}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
