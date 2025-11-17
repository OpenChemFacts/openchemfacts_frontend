import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://openchemfacts-production.up.railway.app";

interface PlotViewerProps {
  cas: string;
  type: "ssd" | "ec10eq";
}

export const PlotViewer = ({ cas, type }: PlotViewerProps) => {
  const plotRef = useRef<HTMLDivElement>(null);

  const endpoint = type === "ssd" ? "ssd-plot" : "ec10eq-plot";
  const title = type === "ssd" 
    ? "Species Sensitivity Distribution (SSD)" 
    : "EC10 Equivalent";

  const { data, isLoading, error } = useQuery({
    queryKey: ["plot", cas, type],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${cas}`);
      if (!response.ok) throw new Error("Failed to fetch plot");
      return response.json();
    },
    enabled: !!cas,
  });

  useEffect(() => {
    if (data && plotRef.current && (window as any).Plotly) {
      (window as any).Plotly.newPlot(plotRef.current, data.data, data.layout, {
        responsive: true,
        displayModeBar: true,
      });
    }
  }, [data]);

  // Load Plotly dynamically
  useEffect(() => {
    if (!(window as any).Plotly) {
      const script = document.createElement("script");
      script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-card border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading plot</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={plotRef} className="w-full min-h-[400px]" />
      </CardContent>
    </Card>
  );
};
