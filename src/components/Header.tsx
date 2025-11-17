import { Beaker, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-md bg-primary">
              <Beaker className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">OpenChemFacts</h1>
              <p className="text-sm text-muted-foreground">Ecotoxicity Data Platform</p>
            </div>
          </div>
          
          <a 
            href="https://app.gitbook.com/invite/dQydSEllS3T0vyzF2UXh/DBlIC7FjfdDHgkLJZTTh"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2 font-medium">
              <BookOpen className="h-4 w-4" />
              Documentation
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
};
