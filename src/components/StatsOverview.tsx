import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, FlaskConical, Users, TestTubes, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";

interface SummaryData {
  rows: number;
  columns: number;
  columns_names: string[];
}

interface ByColumnData {
  column: string;
  unique_values: any[];
  count: number;
}

interface Stats {
  total_records: number;
  unique_chemicals: number;
  unique_species: number;
  unique_taxa: number;
}

export const StatsOverview = () => {
  // Get summary data
  const { data: summaryData, error: summaryError } = useQuery({
    queryKey: ["summary"],
    queryFn: () => apiFetch<SummaryData>(API_ENDPOINTS.SUMMARY),
  });

  // Get unique chemicals count from CAS list
  const { data: casListData, error: casListError } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await apiFetch<{
        count: number;
        cas_numbers: string[];
        cas_with_names: Array<{ cas_number: string; chemical_name?: string }>;
      }>(API_ENDPOINTS.CAS_LIST);
      return response;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Get unique species count
  const { data: speciesData } = useQuery({
    queryKey: ["by-column", "species_common_name"],
    queryFn: () => apiFetch<ByColumnData>(API_ENDPOINTS.BY_COLUMN("species_common_name")),
    enabled: !!summaryData,
  });

  // Get unique taxa count (using ecotox_group)
  const { data: taxaData } = useQuery({
    queryKey: ["by-column", "ecotox_group_unepsetacjrc2018"],
    queryFn: () => apiFetch<ByColumnData>(API_ENDPOINTS.BY_COLUMN("ecotox_group_unepsetacjrc2018")),
    enabled: !!summaryData,
  });

  // Combine all data
  const data: Stats | undefined = summaryData
    ? {
        total_records: summaryData.rows,
        unique_chemicals: casListData?.count || 0,
        unique_species: speciesData?.count || 0,
        unique_taxa: taxaData?.count || 0,
      }
    : undefined;

  const isLoading = !summaryData || !casListData;
  const error = summaryError || casListError;

  const statsCards = [
    {
      title: "Chemical Substances",
      value: data?.unique_chemicals,
      icon: FlaskConical,
      color: "text-primary",
    },
    {
      title: "Total Records",
      value: data?.total_records,
      icon: TestTubes,
      color: "text-accent",
    },
    {
      title: "Species Tested",
      value: data?.unique_species,
      icon: Users,
      color: "text-secondary",
    },
  ];

  if (error) {
    const errorMessage = error instanceof ApiError 
      ? error.message 
      : "Erreur lors du chargement des statistiques";
    
    return (
      <div className="mt-12">
        <Card className="shadow-card border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Erreur</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="text-center mb-8">
        <Database className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-bold mb-2">Database Statistics</h2>
        <p className="text-muted-foreground">
          Overview of available ecotoxicity data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="shadow-card hover:shadow-elevated transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <p className="text-4xl font-bold">{stat.value?.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 shadow-card bg-muted/50 border-muted">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">How to use OpenChemFacts</h3>
          <p className="text-muted-foreground leading-relaxed">
            Search for a chemical substance by its CAS number to visualize ecotoxicity data, 
            species sensitivity distributions (SSD), and EC10 equivalent values.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
