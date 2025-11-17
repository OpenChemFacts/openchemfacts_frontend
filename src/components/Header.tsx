import { Beaker } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Beaker className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">OpenChemFacts</h1>
              <p className="text-sm text-muted-foreground">Données d'écotoxicité</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
