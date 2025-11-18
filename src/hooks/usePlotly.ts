import { useState, useEffect } from "react";

const PLOTLY_SCRIPT_URL = "https://cdn.plot.ly/plotly-2.27.0.min.js";

/**
 * Hook pour gérer le chargement dynamique de Plotly
 * Évite les chargements multiples et gère les cas de chargement asynchrone
 */
export const usePlotly = () => {
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Vérifier d'abord si Plotly est déjà disponible
    if ((window as any).Plotly) {
      setPlotlyLoaded(true);
      return;
    }

    // Vérifier si le script est déjà en cours de chargement ou déjà chargé
    const existingScript = document.querySelector(
      `script[src="${PLOTLY_SCRIPT_URL}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      // Si le script existe, vérifier s'il est déjà chargé
      if ((window as any).Plotly) {
        setPlotlyLoaded(true);
        return;
      }

      // Vérifier si le script est marqué comme chargé
      if (existingScript.getAttribute("data-loaded") === "true") {
        // Attendre un peu au cas où Plotly se charge juste après
        const checkInterval = setInterval(() => {
          if ((window as any).Plotly) {
            setPlotlyLoaded(true);
            clearInterval(checkInterval);
          }
        }, 50);

        // Arrêter après 2 secondes si Plotly ne se charge pas
        const timeoutId = setTimeout(() => {
          clearInterval(checkInterval);
        }, 2000);

        return () => {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
        };
      }

      // Le script est en cours de chargement, attendre l'événement load
      const handleLoad = () => {
        existingScript.setAttribute("data-loaded", "true");
        setPlotlyLoaded(true);
      };

      existingScript.addEventListener("load", handleLoad);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    // Créer et charger le script si aucun script n'existe
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
      // Pas de nettoyage du script car il peut être utilisé par d'autres composants
    };
  }, []);

  return { plotlyLoaded, error, Plotly: (window as any).Plotly };
};

