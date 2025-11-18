import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

interface ErrorDisplayProps {
  error: Error | ApiError | unknown;
  title?: string;
  defaultMessage?: string;
  className?: string;
}

/**
 * Composant réutilisable pour afficher les erreurs API
 */
export const ErrorDisplay = ({
  error,
  title,
  defaultMessage = "Erreur lors du chargement",
  className = "",
}: ErrorDisplayProps) => {
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
      ? error.message
      : defaultMessage;

  const isNotFound = error instanceof ApiError && error.status === 404;
  const displayTitle = title || (isNotFound ? "Ressource non trouvée" : "Erreur");

  return (
    <Card className={`shadow-card border-destructive ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">{displayTitle}</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

