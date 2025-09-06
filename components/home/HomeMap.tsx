"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [selected, setSelected] = useState<{ name: string; center: [number, number]; baseCenter: [number, number] } | null>(null);
  // Pull the world closer to the header by default
  const [position, setPosition] = useState<{ center: [number, number]; zoom: number }>({ center: [0, 4], zoom: 1 });

  // Desktop-only layout constants (we don't handle mobile/tablet yet)
  // We'll detect the actual header height at runtime, defaulting to ~112px.
  const [headerOffset, setHeaderOffset] = useState<number>(112);
  const PANEL_GUTTER = 16;   // spacing from viewport edges

  const cityData = useMemo(() => (selected ? demoUniversities[selected.name] ?? [] : []), [selected]);
  const markerScale = useMemo(() => 0.35 / Math.sqrt(position.zoom || 1), [position.zoom]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHeader = () => {
      const header = document.querySelector("header");
      const h = header ? Math.ceil(header.getBoundingClientRect().height) : 112;
      setHeaderOffset(h);
    };
    updateHeader();
    window.addEventListener("resize", updateHeader);
    return () => window.removeEventListener("resize", updateHeader);
  }, []);

  // Compute a center offset that leaves room for the right panel and
  // adds a vertical margin so selection isn't glued to the bottom.
  function computeOffsetCenter(baseCenter: [number, number], zoom: number): [number, number] {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;

    const panelWidthPx = Math.min(400, 0.36 * vw); // matches panel's CSS width
    const panelFrac = panelWidthPx / vw; // portion of the viewport used by panel

    // Approximate width/height of visible world in degrees under the current zoom.
    const visibleWidthDeg = 360 / Math.max(zoom, 1);
    const visibleHeightDeg = 180 / Math.max(zoom, 1);

    // Horizontal shift: move country toward the visual left by the fraction occupied by the panel.
    // Multiplier tuned so typical zoom keeps points clearly visible without overcompensation.
    const xShift = Math.max(4, visibleWidthDeg * panelFrac * 0.8);

    // Vertical shift: more on short screens, scaled to visible degrees.
    const yShiftBase = vh < 850 ? 0.28 : 0.22; // fraction of visible height
    const yShift = Math.max(4, visibleHeightDeg * yShiftBase);

    return [baseCenter[0] - xShift, baseCenter[1] - yShift];
  }

  function handleCountryClick(geo: any) {
    const name: string = geo.properties.name;
    const baseCenter = geoCentroid(geo) as [number, number];
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const targetZoom = vh < 850 ? 5.8 : 6.2; // strong zoom to clarify markers
    const center = computeOffsetCenter(baseCenter, targetZoom);
    setSelected({ name, center, baseCenter });
    setPosition({ center, zoom: targetZoom });
  }

  function reset() {
    setSelected(null);
    setPosition({ center: [0, 4], zoom: 1 });
  }

  // Recompute center on viewport resize so the panel binding stays correct
  useEffect(() => {
    function onResize() {
      if (!selected) return;
      const vh = typeof window !== "undefined" ? window.innerHeight : 900;
      const targetZoom = vh < 850 ? 5.8 : 6.2;
      const center = computeOffsetCenter(selected.baseCenter, targetZoom);
      setPosition({ center, zoom: targetZoom });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [selected]);

  return (
    <div className="relative">
      {/* Hero map */}
      <div className="relative rounded-none border-0 bg-white p-0" style={{ minHeight: "calc(100vh - 120px)" }}>
        <div className="absolute right-4 top-4 z-10">
          {selected && (
            <button onClick={reset} className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
              Back to world
            </button>
          )}
        </div>

        {/* Title removed per latest UX request */}

        <ComposableMap projectionConfig={{ scale: 175 }} style={{ width: "100%", height: "100%" }}>
          <ZoomableGroup center={position.center} zoom={position.zoom} minZoom={1} maxZoom={8} animate animationDuration={1100} animationEasingFunction={(t: number) => 1 - Math.pow(1 - t, 3)}>
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
                const rimR = 5.5;
                const emblemR = 4.0;
                const isPrivate = c.kind === "private";
                const accent = isPrivate ? "#F59E0B" : "#6C63FF"; // amber for private, indigo for public
                const clipId = `logo-${(selected?.name || "").replace(/\s/g, "-")}-${idx}-clip`;
                const yJitter = 0; // keep precise alignment; jitter removed
                return (
                  <Marker key={`${c.city}-${c.uni}`} coordinates={[c.lng, c.lat]}>
                    <motion.g
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: markerScale, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 140, damping: 18 }}
                      transform={`translate(0, ${yJitter})`}
                    >
                      {/* Emblem-only dot (logo inside if available) */}
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
                    </motion.g>
                  </Marker>
                );
              })}
            </AnimatePresence>
          </ZoomableGroup>
        </ComposableMap>

        {/* Right side panel of universities when a country is selected */}
        {selected && cityData.length > 0 && (
          <div
            className="pointer-events-auto absolute right-4 z-20 w-[min(400px,36vw)] rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur"
            style={{
              top: headerOffset,
              bottom: PANEL_GUTTER,
              maxHeight: `calc(100vh - ${headerOffset + PANEL_GUTTER}px)`
            }}
          >
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">{selected.name}</div>
            <div className="space-y-3 max-h-full overflow-auto pr-1">
              {cityData.map((c, i) => (
                <div key={`${c.city}-${i}`} className="rounded-xl border p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                      {c.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logo} alt="logo" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-indigo-700">{c.city[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.uni}</div>
                      <div className="text-sm text-gray-500">{c.city} • {c.kind === "private" ? "Private" : "Public"}</div>
                    </div>
                    <div className="ml-auto text-sm font-semibold text-gray-700">⭐ {c.rating?.toFixed(1) ?? "4.3"}</div>
                  </div>
                  {/* Meta grid */}
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="col-span-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                      <div className="font-semibold text-gray-700">Last Score</div>
                      <div className="mt-1 text-gray-800">{c.lastScore ?? 65}/100</div>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 p-2">
                      <div className="mb-1 text-xs font-semibold text-gray-700">Gallery</div>
                      <div className="flex gap-1">
                        {(c.photos ?? ["https://placehold.co/64x64", "https://placehold.co/64x64", "https://placehold.co/64x64"]).slice(0,3).map((src, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={idx} src={src} alt="photo" className="h-12 w-12 rounded object-cover" />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Orgs + article */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(c.orgs ?? ["EMS", "Volunteering"]).slice(0,3).map((o) => (
                      <span key={o} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{o}</span>
                    ))}
                    {c.article && (
                      <span className="ml-auto text-xs text-indigo-600 underline">{c.article.title}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
