'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DeliveryTracking } from '@/types/delivery';

// Fix for default Leaflet icon paths in Next.js
const createCustomIcon = (color: string, label: string, isVehicle: boolean = false) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: ${isVehicle ? '38px' : '28px'};
        height: ${isVehicle ? '38px' : '28px'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: ${isVehicle ? '16px' : '11px'};
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        position: relative;
      ">
        ${label}
        ${isVehicle ? '<div style="position:absolute; width:100%; height:100%; border-radius:50%; border:2px solid ' + color + '; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>' : ''}
      </div>
    `,
    iconSize: [isVehicle ? 38 : 28, isVehicle ? 38 : 28],
    iconAnchor: [isVehicle ? 19 : 14, isVehicle ? 19 : 14],
  });
};

function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface LiveTrackingMapProps {
  trip: DeliveryTracking;
  showTelemetryPopup?: boolean;
}

export default function LiveTrackingMap({ trip, showTelemetryPopup = true }: LiveTrackingMapProps) {
  const vehiclePosition = trip.currentCoordinates || trip.pickupCoordinates;
  const pickupPosition = trip.pickupCoordinates;
  const destinationPosition = trip.destinationCoordinates;

  const vehicleIcon = createCustomIcon('#10b981', '🚚', true);
  const pickupIcon = createCustomIcon('#0284c7', 'P');
  const destinationIcon = createCustomIcon('#ef4444', 'D');
  const waypointIcon = createCustomIcon('#64748b', '•');

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner z-0">
      <MapContainer
        center={vehiclePosition}
        zoom={11}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[380px]"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <ChangeMapView center={vehiclePosition} />

        {/* Route Line */}
        {trip.routeCoordinates && trip.routeCoordinates.length > 0 && (
          <Polyline
            positions={trip.routeCoordinates}
            color="#10b981"
            weight={5}
            opacity={0.8}
            dashArray="2, 6"
          />
        )}

        {/* Pickup Marker */}
        <Marker position={pickupPosition} icon={pickupIcon}>
          <Popup>
            <div className="p-1 font-sans text-xs">
              <strong className="block text-slate-900 font-bold">📍 Farm Pickup Point</strong>
              <span className="text-slate-600 text-[11px]">{trip.pickupLocation}</span>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={destinationPosition} icon={destinationIcon}>
          <Popup>
            <div className="p-1 font-sans text-xs">
              <strong className="block text-slate-900 font-bold">🎯 Destination Hub</strong>
              <span className="text-slate-600 text-[11px]">{trip.destinationLocation}</span>
            </div>
          </Popup>
        </Marker>

        {/* Intermediate Waypoints */}
        {trip.waypoints?.map((wp, idx) => (
          <Marker key={wp.id || idx} position={wp.coordinates} icon={waypointIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <strong className="block text-slate-900 font-bold">{wp.title}</strong>
                <span className="text-slate-600 text-[11px]">{wp.location}</span>
                <span className="block text-[10px] text-emerald-600 mt-0.5">{wp.timestamp}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live Moving Vehicle Marker */}
        <Marker position={vehiclePosition} icon={vehicleIcon}>
          <Popup>
            <div className="p-1.5 font-sans text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-black text-emerald-700">
                <span>🚚 {trip.vehicleType}</span>
              </div>
              <p className="text-[11px] text-slate-700 font-mono font-bold">
                {trip.vehicleNumber}
              </p>
              <p className="text-[11px] text-slate-600">
                Driver: <strong>{trip.driverName}</strong>
              </p>
              <p className="text-[11px] text-slate-600">
                Speed: <strong>52 km/h</strong> • Status: <strong>{trip.status}</strong>
              </p>
              {showTelemetryPopup && trip.telemetry && (
                <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                  Temp: <strong className="text-emerald-600">{trip.telemetry.temperatureCelsius}°C</strong> (Reefer Active)
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay Badge */}
      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-[11px] font-bold shadow-lg z-[1000] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>ROAD ROUTE • GPS ACTIVE</span>
      </div>
    </div>
  );
}
