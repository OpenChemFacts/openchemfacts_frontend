import { API_BASE_URL } from "./config";

/**
 * Types d'erreurs API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fonction utilitaire pour effectuer des appels API avec gestion d'erreurs
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug log in development
  if (import.meta.env.DEV) {
    console.log(`[API] Fetching: ${url}`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      // Add credentials for CORS requests if necessary
      credentials: 'omit', // 'omit' by default, can be changed to 'include' if necessary
    });

    // HTTP error handling
    if (!response.ok) {
      let errorMessage = "An error occurred";
      
      switch (response.status) {
        case 404:
          errorMessage = "Resource not found";
          break;
        case 500:
          errorMessage = "Internal server error";
          break;
        case 503:
          errorMessage = "Service temporarily unavailable";
          break;
        case 400:
          errorMessage = "Invalid request";
          break;
        case 401:
          errorMessage = "Unauthorized";
          break;
        case 403:
          errorMessage = "Forbidden";
          break;
        default:
          errorMessage = `Error ${response.status}: ${response.statusText}`;
      }

      // Try to retrieve the error message from the server
      try {
        const errorData = await response.json();
        if (errorData.detail || errorData.message) {
          errorMessage = errorData.detail || errorData.message;
        }
      } catch {
        // If the response is not JSON, use the default message
      }

      if (import.meta.env.DEV) {
        console.error(`[API] Error ${response.status} on ${url}:`, errorMessage);
      }

      throw new ApiError(errorMessage, response.status, response.statusText);
    }

    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.log(`[API] Success on ${url}`);
    }
    
    return data;
  } catch (error) {
    // Network and CORS error handling
    if (error instanceof TypeError) {
      // Detect CORS errors specifically
      if (error.message.includes("Failed to fetch") || 
          error.message.includes("NetworkError") ||
          error.message.includes("fetch")) {
        
        const isCorsError = error.message.includes("CORS") || 
                          error.message.includes("Access-Control");
        
        if (import.meta.env.DEV) {
          console.error(`[API] Network error on ${url}:`, error.message);
          if (isCorsError) {
            console.error(`[API] CORS error detected. Check backend CORS configuration.`);
          }
        }
        
        throw new ApiError(
          isCorsError
            ? "CORS Error: The server does not allow requests from this origin. Check the server's CORS configuration."
            : `Unable to connect to server (${API_BASE_URL}). Check your network connection and ensure the server is running.`,
          0,
          "Network Error"
        );
      }
    }
    
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Unknown error
    if (import.meta.env.DEV) {
      console.error(`[API] Unknown error on ${url}:`, error);
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error",
      0,
      "Unknown Error"
    );
  }
}

