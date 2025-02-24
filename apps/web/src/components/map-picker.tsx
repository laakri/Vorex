import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  initialPosition?: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function MapPicker({ 
  initialPosition = [36.8065, 10.1815], // Default to Tunisia
  onLocationSelect 
}: MapPickerProps) {
  // Use ref instead of state for the marker to ensure immediate updates
  const markerRef = useRef<L.Marker | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Create map instance
    const mapInstance = L.map('map', {
      center: initialPosition,
      zoom: 13,
      zoomControl: true,
    });

    // Store map instance in ref
    mapRef.current = mapInstance;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    // Enhanced custom icon with better styling
    const customIcon = L.divIcon({
      html: `
        <div class="marker-pin">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff4444" stroke="#cc0000" stroke-width="1">
            <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"/>
          </svg>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Handle click events
    mapInstance.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Remove existing marker if it exists
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      // Create and add new marker
      const newMarker = L.marker([lat, lng], { 
        icon: customIcon,
        riseOnHover: true // Marker will rise above others on hover
      }).addTo(mapInstance);
      markerRef.current = newMarker;
      
      // Log coordinates and call the callback
      console.log('Selected Location:', {
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`
      });
      
      onLocationSelect(lat, lng);
    });

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      mapInstance.remove();
    };
  }, []); // Empty dependency array since we don't need to recreate the map

  return (
    <div id="map" className="h-[300px] relative rounded-md overflow-hidden border" />
  );
} 