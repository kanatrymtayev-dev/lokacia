"use client";

import { useEffect } from "react";
import type { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const PRIMARY = "#6d28d9";

function clusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 42 : 52;
  return L.divIcon({
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:9999px;
        background:${PRIMARY};
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        font-size:13px;
        font-family:ui-sans-serif,system-ui,-apple-system;
        box-shadow:0 0 0 6px rgba(109,40,217,0.18), 0 4px 14px rgba(0,0,0,0.18);
      ">${count}</div>
    `,
    className: "lokacia-cluster-icon",
    iconSize: L.point(size, size, true),
  });
}

// Helper component to handle auto-fitting bounds when listings change
function MapController({ listings, approximateRadius }: { listings: Listing[]; approximateRadius?: number }) {
  const map = useMap();

  useEffect(() => {
    // If no valid coordinates, don't fitbounds
    const valid = listings.filter(l => l.lat && l.lng && l.lat !== 0 && l.lng !== 0);

    if (valid.length === 1) {
      // В режиме circle отдаляем зум, чтобы круг радиуса R помещался с запасом
      const zoom = approximateRadius ? 14 : 13;
      map.setView([valid[0].lat, valid[0].lng], zoom, { animate: true });
    } else if (valid.length > 1) {
      const bounds = L.latLngBounds(valid.map(l => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }, [listings, map, approximateRadius]);

  return null;
}

function getIcon(price: string, highlighted: boolean) {
  const bg = highlighted ? "#111827" : "#ffffff";
  const fg = highlighted ? "#ffffff" : "#111827";
  const border = highlighted ? "#111827" : "rgba(0,0,0,0.12)";
  const scale = highlighted ? "scale(1.12)" : "scale(1)";
  
  const html = `
    <div style="
      background:${bg};
      color:${fg};
      border:1px solid ${border};
      box-shadow:0 4px 14px rgba(0,0,0,${highlighted ? 0.25 : 0.15});
      padding:6px 10px;
      border-radius:9999px;
      font-weight:700;
      font-size:12px;
      white-space:nowrap;
      transform:${scale} translateX(-50%);
      transform-origin:center bottom;
      transition:transform 0.15s ease, background-color 0.15s ease, color 0.15s ease;
      font-family:ui-sans-serif,system-ui,-apple-system;
      display:inline-block;
    ">${price}</div>
  `;

  return L.divIcon({
    html,
    className: "leaflet-custom-marker-transparent", 
    iconSize: [0, 0], // Zero size lets us control anchor purely by CSS translate
    iconAnchor: [0, 0] // 
  });
}

export default function MapLeaflet({
  listings,
  hoveredListingId,
  className = "",
  approximateRadius,
}: {
  listings: Listing[];
  hoveredListingId?: string | null;
  className?: string;
  /** Если задан — вместо точечного пина рисуется круг радиуса (в метрах). Используется на странице листинга для приватности. */
  approximateRadius?: number;
}) {
  // initial center
  const initialCenter: [number, number] = (listings.length > 0 && listings[0].lat !== 0) 
    ? [listings[0].lat, listings[0].lng] 
    : [43.238949, 76.945465];

  const valid = listings.map(l => {
    if (l.lat === 0 || l.lng === 0 || !Number.isFinite(l.lat) || !Number.isFinite(l.lng)) {
      return { ...l, lat: 43.238949, lng: 76.945465 };
    }
    return l;
  });

  return (
    <div className={`relative w-full h-full bg-gray-100 ${className} as-map-container`}>
      <style>{`
        .leaflet-custom-marker-transparent {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          z-index: 10;
        }
      `}</style>
      <MapContainer 
        center={initialCenter} 
        zoom={12} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapController listings={valid} approximateRadius={approximateRadius} />

        {approximateRadius ? (
          // Giggster/Airbnb-style: на странице листинга — круг приблизительной зоны
          valid.map((l) => (
            <Circle
              key={l.id}
              center={[l.lat, l.lng]}
              radius={approximateRadius}
              pathOptions={{
                color: "#111827",
                weight: 1.5,
                opacity: 0.5,
                fillColor: "#111827",
                fillOpacity: 0.12,
              }}
            />
          ))
        ) : (
          // Каталог: обычные ценовые маркеры с кластеризацией
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            iconCreateFunction={clusterIcon}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
          >
            {valid.map((l) => {
              const isHovered = l.id === hoveredListingId;
              return (
                <Marker
                  key={l.id}
                  position={[l.lat, l.lng]}
                  icon={getIcon(formatPrice(l.pricePerHour), isHovered)}
                  zIndexOffset={isHovered ? 1000 : 0}
                  eventHandlers={{
                    click: () => {
                      window.location.href = `/listing/${l.slug}`;
                    }
                  }}
                />
              );
            })}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
}
