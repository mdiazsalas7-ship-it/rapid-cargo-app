import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Ayuda para clases CSS (opcional pero buena práctica)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// FÓRMULA HAVERSINE: Calcula km entre dos coordenadas
export function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(1)); // Retorna 1 decimal (ej: 12.5 km)
}