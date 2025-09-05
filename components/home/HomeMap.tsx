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
  const markerScale = useMemo(() => 0.7 / Math.sqrt(position.zoom || 1), [position.zoom]);

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
      {/* Hero map */}
      <div className="relative rounded-xl border bg-gradient-to-b from-indigo-50 to-white p-2 shadow-sm" style={{ minHeight: "75vh" }}>
        <div className="absolute right-4 top-4 z-10">
          {selected && (
            <button onClick={reset} className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
              Back to world
            </button>
          )}
        </div>

        {/* Title overlay */}
        {!selected && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-center">
            <h1 className="mx-4 text-3xl font-extrabold text-gray-800 sm:text-4xl md:text-5xl">
              Where would you like to <span className="font-brand text-indigo-600">EnterMedSchool</span>?
            </h1>
          </div>
        )}

        <ComposableMap projectionConfig={{ scale: 165 }} style={{ width: "100%", height: "100%" }}>
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
              {cityData.map((c, idx) => {
                const label = c.city;
                const w = Math.max(58, 14 + label.length * 7);
                const h = 22;
                const pillX = 12; // offset to the right of the emblem
                const textX = pillX + w / 2 + (c.kind === "private" ? 6 : 0);
                const textY = 4; // optical centering
                const rimR = 7.5;
                const emblemR = 5.5;
                const isPrivate = c.kind === "private";
                const accent = isPrivate ? "#F59E0B" : "#6C63FF"; // amber for private, indigo for public
                const clipId = `logo-${(selected?.name || "").replace(/\s/g, "-")}-${idx}-clip`;
                return (
                  <Marker key={`${c.city}-${c.uni}`} coordinates={[c.lng, c.lat]}>
                    <motion.g
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: markerScale, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      {/* Emblem circle with white rim or logo masked in a circle */}
                      <g>
                        <circle r={rimR} fill="#ffffff" />
                        {c.logo ? (
                          <>
                            <defs>
                              <clipPath id={clipId}>
                                <circle r={emblemR} />
                              </clipPath>
                            </defs>
                            <image
                              href={c.logo}
                              x={-emblemR}
                              y={-emblemR}
                              width={emblemR * 2}
                              height={emblemR * 2}
                              preserveAspectRatio="xMidYMid slice"
                              clipPath={`url(#${clipId})`}
                            />
                            <circle r={emblemR} fill="none" stroke={accent} strokeWidth={0.8} />
                          </>
                        ) : (
                          <circle r={emblemR} fill={accent} />
                        )}
                      </g>
                      {/* Label pill */}
                      <g>
                        <rect x={pillX} y={-h / 2} rx={12} ry={12} width={w + (isPrivate ? 12 : 0)} height={h} fill="#ffffff" stroke="#E5E7EB" />
                        {isPrivate && (
                          <rect x={pillX + 6} y={-6} rx={3} ry={3} width={10} height={12} fill={accent} />
                        )}
                        <text x={textX} y={textY} textAnchor="middle" fontSize={11} fill={isPrivate ? "#B45309" : "#4F46E5"} fontWeight={700}>
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
      </div>

      {/* Cards below the map */}
      {selected && cityData.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

