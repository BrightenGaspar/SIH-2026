'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DeliveryTracking } from '@/types/delivery';
import { supabase } from '@/lib/supabaseClient';

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
  const defaultCenter: [number, number] = [17.3850, 78.4867];
  const initialVehiclePosition = trip.currentCoordinates || trip.pickupCoordinates || defaultCenter;
  const pickupPosition = trip.pickupCoordinates || defaultCenter;
  const destinationPosition = trip.destinationCoordinates || defaultCenter;

  const [vehiclePosition, setVehiclePosition] = useState<[number, number]>(initialVehiclePosition);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    trip.routeCoordinates && trip.routeCoordinates.length > 0 ? trip.routeCoordinates : [pickupPosition, initialVehiclePosition]
  );
  const [telemetryTemp, setTelemetryTemp] = useState<number | undefined>(trip.telemetry?.temperatureCelsius);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(Boolean(trip.currentCoordinates));

  // Over-the-air Supabase Realtime channel subscription for live phone telemetry & GPS updates
  useEffect(() => {
    if (!trip.id) return;

    const channel = supabase
      .channel(`live-tracking-map-${trip.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_telemetry_logs',
          filter: `trip_id=eq.${trip.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row && row.lat != null && row.lng != null) {
            const newPos: [number, number] = [Number(row.lat), Number(row.lng)];
            setVehiclePosition(newPos);
            setRouteCoordinates((prev) => [...prev, newPos]);
            if (row.temp_celsius != null) {
              setTelemetryTemp(Number(row.temp_celsius));
            }
            setIsLiveStreaming(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'logistics_trips',
          filter: `id=eq.${trip.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row && row.current_lat != null && row.current_lng != null) {
            const newPos: [number, number] = [Number(row.current_lat), Number(row.current_lng)];
            setVehiclePosition(newPos);
            setRouteCoordinates((prev) => {
              const last = prev[prev.length - 1];
              if (last && Math.abs(last[0] - newPos[0]) < 0.0001 && Math.abs(last[1] - newPos[1]) < 0.0001) {
                return prev;
              }
              return [...prev, newPos];
            });
            if (row.current_temp != null) {
              setTelemetryTemp(Number(row.current_temp));
            }
            setIsLiveStreaming(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip.id]);

  const vehicleSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/></svg>`;
  const vehicleIcon = createCustomIcon('#10b981', vehicleSvg, true);
  const pickupIcon = createCustomIcon('#0284c7', 'P');
  const destinationIcon = createCustomIcon('#ef4444', 'D');
  const waypointIcon = createCustomIcon('#64748b', '&bull;');

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner z-0">
      {!isLiveStreaming && (
        <div className="absolute top-2 left-2 right-2 z-[400] bg-slate-900/90 text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
          <span>⚠️ Waiting for driver&apos;s live GPS</span>
          <span className="text-[10px] text-slate-400 font-normal">Phone beacon inactive</span>
        </div>
      )}
      <MapContainer
        center={vehiclePosition}
        zoom={10}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[380px]"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <ChangeMapView center={vehiclePosition} />

        {/* Real-time Dynamic Route Line */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#10b981"
            weight={5}
            opacity={0.85}
            dashArray="2, 6"
          />
        )}

        {/* Pickup Marker */}
        <Marker position={pickupPosition} icon={pickupIcon}>
          <Popup>
            <div className="p-1 font-sans text-xs">
              <strong className="block text-slate-900 font-bold">Farm Pickup Point</strong>
              <span className="text-slate-600 text-[11px]">{trip.pickupLocation}</span>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={destinationPosition} icon={destinationIcon}>
          <Popup>
            <div className="p-1 font-sans text-xs">
              <strong className="block text-slate-900 font-bold">Destination Hub</strong>
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
                <span>{trip.vehicleType}</span>
              </div>
              <p className="text-[11px] text-slate-700 font-mono font-bold">
                {trip.vehicleNumber}
              </p>
              <p className="text-[11px] text-slate-600">
                Driver: <strong>{trip.driverName}</strong>
              </p>
              <p className="text-[11px] text-slate-600">
                Status: <strong>{trip.status}</strong>
              </p>
              {showTelemetryPopup && (
                <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                  {telemetryTemp != null ? (
                    <>Temp: <strong className="text-emerald-600">{telemetryTemp}&deg;C</strong></>
                  ) : (
                    <span className="text-slate-500">Temp: <em>No live reading (Phone GPS)</em></span>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay Badge */}
      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-[11px] font-bold shadow-lg z-[1000] flex items-center gap-2">
        {isLiveStreaming ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PHONE GPS &bull; LIVE STREAMING</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>GPS &bull; AWAITING DRIVER BEACON</span>
          </>
        )}
      </div>
    </div>
  );
}

