import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Info } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://openchemfacts-production.up.railway.app";

interface ChemicalInfoProps {
  cas: string;
}

interface ChemicalData {
  cas_number: string;
  chemical_name?: string;
  number_of_tests: number;
  species_tested: number;
  [key: string]: any;
}

export const ChemicalInfo = ({ cas }: ChemicalInfoProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["chemical-info", cas],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/chemical-info/${cas}`);
      if (!response.ok) throw new Error("Failed to fetch chemical info");
      return response.json() as Promise<ChemicalData>;
    },
    enabled: !!cas,
  });

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

  if (error) {
    return (
      <Card className="shadow-card border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Erreur lors du chargement des informations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Informations sur la substance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Numéro CAS</p>
            <p className="font-mono font-semibold text-lg">{data?.cas_number}</p>
          </div>
          {data?.chemical_name && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nom chimique</p>
              <p className="font-semibold">{data.chemical_name}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Badge variant="secondary" className="text-base py-1 px-4">
            <Info className="h-4 w-4 mr-2" />
            {data?.number_of_tests} tests
          </Badge>
          <Badge variant="outline" className="text-base py-1 px-4">
            {data?.species_tested} espèces
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
