import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ChemicalInfo } from "@/components/ChemicalInfo";
import { PlotViewer } from "@/components/PlotViewer";
import { StatsOverview } from "@/components/StatsOverview";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [selectedCas, setSelectedCas] = useState<string>("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            OpenChemFacts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Open data platform for ecotoxicity data visualization and analysis
          </p>
        </div>

        <SearchBar onCasSelect={setSelectedCas} />

        {selectedCas ? (
          <div className="mt-8 space-y-8">
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
          </div>
        ) : (
          <StatsOverview />
        )}
      </main>
    </div>
  );
};

export default Index;
