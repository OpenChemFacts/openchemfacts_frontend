import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
      <div className="p-2.5 rounded-md bg-primary flex items-center justify-center">
        <span className="text-2xl">🧪</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">OpenChemFacts</h1>
        <p className="text-sm text-muted-foreground">Ecotoxicity Data Platform</p>
      </div>
    </Link>
  );
};
