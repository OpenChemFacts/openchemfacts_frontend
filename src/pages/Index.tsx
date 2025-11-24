import { useState, useEffect } from "react";
import { SearchBar, type ChemicalMetadata } from "@/components/SearchBar";
import { ChemicalInfo } from "@/components/ChemicalInfo";
import { EffectFactors } from "@/components/EffectFactors";
import { PlotViewer } from "@/components/PlotViewer";
import { StatsOverview } from "@/components/StatsOverview";
import { Header } from "@/components/Header";
import { BenchmarkComparison } from "@/components/BenchmarkComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCasList } from "@/hooks/useCasList";

const DEFAULT_CAS = "50-00-0";

const Index = () => {
  const [selectedChemical, setSelectedChemical] = useState<ChemicalMetadata>({
    cas: DEFAULT_CAS,
  });

  // Get chemical name helper from useCasList
  const { getChemicalName } = useCasList();

  // Load chemical name for default CAS when list is available
  useEffect(() => {
    if (selectedChemical.cas === DEFAULT_CAS && !selectedChemical.chemical_name) {
      const chemicalName = getChemicalName(DEFAULT_CAS);
      if (chemicalName) {
        setSelectedChemical(prev => ({
          ...prev,
          chemical_name: chemicalName,
        }));
      }
    }
  }, [getChemicalName, selectedChemical.cas, selectedChemical.chemical_name]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-16 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
            OpenChemFacts
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
          Accelerating chemical safety through open data
          </p>
        </div>

        <div className="mb-8 max-w-2xl mx-auto">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center">
            <p className="text-sm font-medium text-foreground">
              🚧 Platform under development • Currently integrating a first dataset: Ecotox (US EPA)
            </p>
            <p className="text-sm font-medium text-foreground mt-1">
              (
              <a 
                href="https://openchemfacts.gitbook.io/openchemfacts-docs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                cf. Documentation
              </a>
              {" "}for more info about Ecotox data-treatment)
            </p>
          </div>
        </div>

        <SearchBar onCasSelect={setSelectedChemical} initialCas={selectedChemical.cas} />

        <div className="mt-8 space-y-8">
          {selectedChemical?.cas && (
            <>
              <ChemicalInfo 
                cas={selectedChemical.cas} 
                chemical_name={selectedChemical.chemical_name}
              />
              
              <EffectFactors cas={selectedChemical.cas} />
              
              <Tabs defaultValue="ssd" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="ssd">SSD Distribution</TabsTrigger>
                  <TabsTrigger value="ec10">EC10 Equivalent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ssd" className="mt-6">
                  <PlotViewer cas={selectedChemical.cas} type="ssd" />
                </TabsContent>
                
                <TabsContent value="ec10" className="mt-6">
                  <PlotViewer cas={selectedChemical.cas} type="ec10eq" />
                </TabsContent>
              </Tabs>
            </>
          )}

          {!selectedChemical?.cas && <StatsOverview />}
          
          <BenchmarkComparison />
        </div>
      </main>
    </div>
  );
};

export default Index;
