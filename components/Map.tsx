'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { calcularDistancia } from '@/lib/utils'; // Importamos la matemática

const ORIGEN: [number, number] = [8.9824, -79.5199];

const iconOrigen = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iconDestino = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Componente que detecta el clic y avisa hacia afuera
function ClickHandler({ onLocationSelect }: { onLocationSelect: (km: number) => void }) {
  useMapEvents({
    click(e) {
      // 1. Calculamos distancia inmediata
      const dist = calcularDistancia(ORIGEN[0], ORIGEN[1], e.latlng.lat, e.latlng.lng);
      // 2. Avisamos al componente padre
      onLocationSelect(dist, e.latlng); 
    },
  });
  return null;
}

// Definimos qué recibe este componente
interface MapProps {
  setDistancia: (km: number) => void;
}

export default function MapComponent({ setDistancia }: MapProps) {
  const [destino, setDestino] = useState<L.LatLng | null>(null);

  useEffect(() => {
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 500);
  }, []);

  return (
    <MapContainer center={ORIGEN} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      
      <Marker position={ORIGEN} icon={iconOrigen} />
      
      {destino && (
        <>
          <Marker position={destino} icon={iconDestino} />
          <Polyline positions={[ORIGEN, [destino.lat, destino.lng]]} color="#F59E0B" weight={4} dashArray="10, 10" />
        </>
      )}

      {/* Pasamos la función especial que actualiza todo */}
      <ClickHandler onLocationSelect={(km, latlng) => {
        setDistancia(km);
        setDestino(latlng);
      }} />
    </MapContainer>
  );
}