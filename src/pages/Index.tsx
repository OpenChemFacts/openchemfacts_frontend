import { useEffect, useState } from "react";
import { SearchBar, type ChemicalMetadata } from "@/components/SearchBar";
import { ChemicalInfo } from "@/components/ChemicalInfo";
import { EffectFactors } from "@/components/EffectFactors";
import { PlotViewer } from "@/components/PlotViewer";
import { StatsOverview } from "@/components/StatsOverview";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BenchmarkComparison } from "@/components/BenchmarkComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCasList } from "@/hooks/useCasList";

const DEFAULT_CAS = "50-00-0";

const Index = () => {
  const [selectedChemical, setSelectedChemical] = useState<ChemicalMetadata>({
    cas: DEFAULT_CAS,
  });
  const [activeTab, setActiveTab] = useState<"ssd" | "ec10">("ssd");

  // Get chemical name helper from useCasList
  const { getChemicalName } = useCasList();

  // Populate default chemical name when CAS list is available
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

  // Handler to reset to default CAS when logo is clicked
  const handleLogoClick = () => {
    setSelectedChemical({
      cas: DEFAULT_CAS,
      chemical_name: undefined,
    });
    setActiveTab("ssd");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onLogoClick={handleLogoClick} />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-16 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
            OpenChemFacts
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
          Accelerating hazard and risk assessment through open data
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
              
              <Tabs
                value={activeTab}
                onValueChange={value => setActiveTab(value as "ssd" | "ec10")}
                className="w-full"
              >
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="ssd">SSD Distribution</TabsTrigger>
                  <TabsTrigger value="ec10">EC10 Equivalent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ssd" className="mt-6">
                  <PlotViewer 
                    cas={selectedChemical.cas} 
                    type="ssd" 
                    isActive={activeTab === "ssd"} 
                  />
                </TabsContent>
                
                <TabsContent value="ec10" className="mt-6">
                  <PlotViewer 
                    cas={selectedChemical.cas} 
                    type="ec10eq" 
                    isActive={activeTab === "ec10"} 
                  />
                </TabsContent>
              </Tabs>
            </>
          )}

          {!selectedChemical?.cas && <StatsOverview />}
          
          <BenchmarkComparison />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
