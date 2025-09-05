"use client";

import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";
import { demoUniversities } from "@/data/universities";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Feature = {
  id: string;
  properties: { name: string; iso_a3?: string };
};

export default function HomeMap() {
  const [selected, setSelected] = useState<{ name: string; center: [number, number] } | null>(null);
  const [position, setPosition] = useState<{ center: [number, number]; zoom: number }>({ center: [0, 20], zoom: 1 });

  const cityData = useMemo(() => (selected ? demoUniversities[selected.name] ?? [] : []), [selected]);
  const markerScale = useMemo(() => 0.85 / Math.sqrt(position.zoom || 1), [position.zoom]);

  function handleCountryClick(geo: any) {
    const name: string = geo.properties.name;
    const center = geoCentroid(geo) as [number, number];
    setSelected({ name, center });
    setPosition({ center, zoom: 3 });
  }

  function reset() {
    setSelected(null);
    setPosition({ center: [0, 20], zoom: 1 });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-brand text-2xl">Explore Universities</h2>
        {selected && (
          <button onClick={reset} className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
            Back to world
          </button>
        )}
      </div>

      <ComposableMap projectionConfig={{ scale: 165 }} style={{ width: "100%", height: "520px" }}>
        <ZoomableGroup center={position.center} zoom={position.zoom}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={(geo as Feature).id}
                  geography={geo}
                  onClick={() => handleCountryClick(geo)}
                  style={{
                    default: { fill: "#EEF2F7", outline: "none", stroke: "#CBD5E1", strokeWidth: 0.5 },
                    hover: { fill: "#DDE3F5", outline: "none" },
                    pressed: { fill: "#C7D2FE", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* City markers when a country is selected */}
          <AnimatePresence>
            {cityData.map((c) => {
              const label = c.city;
              const w = Math.max(58, 14 + label.length * 7);
              const h = 22;
              const pillX = 12; // offset to the right of the emblem
              const textX = pillX + w / 2;
              const textY = 4; // optical centering
              return (
                <Marker key={`${c.city}-${c.uni}`} coordinates={[c.lng, c.lat]}>
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: markerScale, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    {/* Emblem circle with white rim */}
                    <g>
                      <circle r={8} fill="#ffffff" />
                      <circle r={6} fill="#6C63FF" />
                    </g>
                    {/* Label pill */}
                    <g>
                      <rect x={pillX} y={-h / 2} rx={12} ry={12} width={w} height={h} fill="#ffffff" stroke="#E5E7EB" />
                      <text x={textX} y={textY} textAnchor="middle" fontSize={11} fill="#4F46E5" fontWeight={600}>
                        {label}
                      </text>
                    </g>
                  </motion.g>
                </Marker>
              );
            })}
          </AnimatePresence>
        </ZoomableGroup>
      </ComposableMap>

      {/* Cute popups below the map for demo (easier cross-device) */}
      {selected && cityData.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cityData.map((c) => (
            <div key={c.city} className="rounded-lg border bg-white p-3 shadow-sm">
              <div className="text-sm text-gray-500">{selected.name} • {c.city}</div>
              <div className="font-medium">{c.uni}</div>
              <div className="mt-1 text-sm text-indigo-600">Read more →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
