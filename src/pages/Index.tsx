import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ChemicalInfo } from "@/components/ChemicalInfo";
import { PlotViewer } from "@/components/PlotViewer";
import { StatsOverview } from "@/components/StatsOverview";
import { Header } from "@/components/Header";
import { BenchmarkComparison } from "@/components/BenchmarkComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [selectedCas, setSelectedCas] = useState<string>("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-16 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
            OpenChemFacts
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Open data platform for ecotoxicity data visualization and scientific analysis
          </p>
        </div>

        <SearchBar onCasSelect={setSelectedCas} />

        <div className="mt-8 space-y-8">
          {selectedCas && (
            <>
              <ChemicalInfo cas={selectedCas} />
              
              <Tabs defaultValue="ssd" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="ssd">SSD Distribution</TabsTrigger>
                  <TabsTrigger value="ec10">EC10 Equivalent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ssd" className="mt-6">
                  <PlotViewer cas={selectedCas} type="ssd" />
                </TabsContent>
                
                <TabsContent value="ec10" className="mt-6">
                  <PlotViewer cas={selectedCas} type="ec10eq" />
                </TabsContent>
              </Tabs>
            </>
          )}

          {!selectedCas && <StatsOverview />}
          
          <BenchmarkComparison />
        </div>
      </main>
    </div>
  );
};

export default Index;
