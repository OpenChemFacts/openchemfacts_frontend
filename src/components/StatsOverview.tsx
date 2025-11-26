import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, FlaskConical, Users, TestTubes } from "lucide-react";
import { useCasList } from "@/hooks/useCasList";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSummary, useByColumn } from "@/hooks/api-hooks";

interface Stats {
  total_records: number;
  unique_chemicals: number;
  unique_species: number;
  unique_taxa: number;
}

export const StatsOverview = () => {
  // Get summary data using centralized hook
  const { data: summaryData, error: summaryError } = useSummary();

  // Use the shared hook for CAS list
  const { count, error: casListError } = useCasList();

  // Get unique species count using centralized hook
  const { data: speciesData } = useByColumn("species_common_name", {
    enabled: !!summaryData,
  });

  // Get unique taxa count (using ecotox_group) using centralized hook
  const { data: taxaData } = useByColumn("ecotox_group_unepsetacjrc2018", {
    enabled: !!summaryData,
  });

  // Combine all data
  const data: Stats | undefined = summaryData
    ? {
        total_records: summaryData.rows,
        unique_chemicals: count || 0,
        unique_species: speciesData?.count || 0,
        unique_taxa: taxaData?.count || 0,
      }
    : undefined;

  const isLoading = !summaryData || count === undefined;
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
    return (
      <div className="mt-12">
        <ErrorDisplay 
          error={error} 
          title="Error loading statistics"
        />
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
