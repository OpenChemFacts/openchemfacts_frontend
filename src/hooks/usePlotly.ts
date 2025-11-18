import { useState, useEffect } from "react";

const PLOTLY_SCRIPT_URL = "https://cdn.plot.ly/plotly-2.27.0.min.js";

/**
 * Hook to manage dynamic loading of Plotly
 * Prevents multiple loads and handles asynchronous loading cases
 */
export const usePlotly = () => {
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // First check if Plotly is already available
    if ((window as any).Plotly) {
      setPlotlyLoaded(true);
      return;
    }

    // Check if the script is already loading or already loaded
    const existingScript = document.querySelector(
      `script[src="${PLOTLY_SCRIPT_URL}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      // If the script exists, check if it's already loaded
      if ((window as any).Plotly) {
        setPlotlyLoaded(true);
        return;
      }

      // Check if the script is marked as loaded
      if (existingScript.getAttribute("data-loaded") === "true") {
        // Wait a bit in case Plotly loads right after
        const checkInterval = setInterval(() => {
          if ((window as any).Plotly) {
            setPlotlyLoaded(true);
            clearInterval(checkInterval);
          }
        }, 50);

        // Stop after 2 seconds if Plotly doesn't load
        const timeoutId = setTimeout(() => {
          clearInterval(checkInterval);
        }, 2000);

        return () => {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
        };
      }

      // The script is loading, wait for the load event
      const handleLoad = () => {
        existingScript.setAttribute("data-loaded", "true");
        setPlotlyLoaded(true);
      };

      existingScript.addEventListener("load", handleLoad);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    // Create and load the script if no script exists
    const script = document.createElement("script");
    script.src = PLOTLY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      setPlotlyLoaded(true);
    };
    script.onerror = () => {
      const loadError = new Error("Failed to load Plotly script");
      console.error("[usePlotly] Failed to load Plotly script");
      setError(loadError);
    };
    document.body.appendChild(script);

    return () => {
      // No script cleanup as it may be used by other components
    };
  }, []);

  return { plotlyLoaded, error, Plotly: (window as any).Plotly };
};

