import { Beaker } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
      <div className="p-2.5 rounded-md bg-primary">
        <Beaker className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">OpenChemFacts</h1>
        <p className="text-sm text-muted-foreground">Ecotoxicity Data Platform</p>
      </div>
    </Link>
  );
};
