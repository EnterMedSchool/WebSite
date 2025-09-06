"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { CountryCities } from "@/data/universities"; // type-only import

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Feature = {
  id: string;
  properties: { name: string; iso_a3?: string };
};

export default function HomeMap() {
  const router = useRouter();
  const [selected, setSelected] = useState<{ name: string; center: [number, number]; baseCenter: [number, number] } | null>(null);
  // Pull the world closer to the header by default
  const [position, setPosition] = useState<{ center: [number, number]; zoom: number }>({ center: [0, 4], zoom: 1 });

  // Desktop-only layout constants (we don't handle mobile/tablet yet)
  // Keep panel tightly under the menu inside the map container.
  const PANEL_GUTTER = 8;    // spacing from container bottom
  const PANEL_TOP_GAP = 4;   // small gap under menu

  const [uniData, setUniData] = useState<CountryCities | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const countryHasData = useMemo(() => new Set(Object.keys(uniData ?? {})), [uniData]);
  const cityData = useMemo(() => (selected && uniData ? uniData[selected.name] ?? [] : []), [selected, uniData]);
  const allCityData = useMemo(() =>
    uniData ? Object.entries(uniData).flatMap(([country, cities]) => cities.map((c) => ({ ...c, country }))) : []
  , [uniData]);
  const markerScale = useMemo(() => 0.35 / Math.sqrt(position.zoom || 1), [position.zoom]);

  // Load data from API (falls back to demo JSON on the server if DB is empty)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/universities", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setUniData(json.data as CountryCities);
      } catch {
        // as a final fallback, lazy import demo JSON in the browser
        const mod = await import("@/data/universities");
        if (!cancelled) setUniData(mod.demoUniversities);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // No header measurement needed; panel is anchored inside the map container.

  // Compute a center offset that leaves room for the right panel and
  // adds a vertical margin so selection isn't glued to the bottom.
  function computeOffsetCenter(baseCenter: [number, number], zoom: number): [number, number] {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;

    const panelWidthPx = Math.min(520, 0.42 * vw); // matches panel's CSS width
    const panelFrac = panelWidthPx / vw; // portion of the viewport used by panel

    // Approximate width/height of visible world in degrees under the current zoom.
    const visibleWidthDeg = 360 / Math.max(zoom, 1);
    const visibleHeightDeg = 180 / Math.max(zoom, 1);

    // Horizontal shift: align the country roughly with the center of the
    // remaining (non-panel) viewport: ~panelFrac/2 of visible degrees.
    // Add a small minimum to keep it clear on very wide screens.
    // Nudge view left (decrease center lon) so Italy appears further right
    // and clears the left-side panel comfortably.
    const xShift = Math.max(8, visibleWidthDeg * panelFrac * 0.70 + 2);

    // Vertical shift: slightly gentler so the selection isn't too high.
    const yShiftBase = vh < 850 ? 0.20 : 0.18; // fraction of visible height
    const yShift = Math.max(4, visibleHeightDeg * yShiftBase);

    return [baseCenter[0] - xShift, baseCenter[1] - yShift];
  }

  function handleCountryClick(geo: any) {
    const name: string = geo.properties.name;
    const baseCenter = geoCentroid(geo) as [number, number];
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const targetZoom = vh < 850 ? 5.0 : 5.2; // moderate zoom so Italy is fully visible
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
      const targetZoom = vh < 850 ? 5.0 : 5.2;
      const center = computeOffsetCenter(selected.baseCenter, targetZoom);
      setPosition({ center, zoom: targetZoom });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [selected]);

  // Default selection: Italy on initial mount
  useEffect(() => {
    if (selected) return;
    const baseCenter: [number, number] = [12.567, 41.8719]; // Italy approximate centroid
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const targetZoom = vh < 850 ? 5.0 : 5.2;
    const center = computeOffsetCenter(baseCenter, targetZoom);
    setSelected({ name: "Italy", baseCenter, center });
    setPosition({ center, zoom: targetZoom });
  }, []);

  return (
    <div className="relative">
      {/* Hero map */}
      <div className="relative rounded-none border-0 bg-white p-0" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* No Back to world button per new default UX */}

        {/* Title removed per latest UX request */}

        <ComposableMap projectionConfig={{ scale: 175 }} style={{ width: "100%", height: "100%" }}>
          <ZoomableGroup center={position.center} zoom={position.zoom} minZoom={1} maxZoom={8} animate animationDuration={1100} animationEasingFunction={(t: number) => 1 - Math.pow(1 - t, 3)}>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const name = (geo.properties.name as string) || "";
                  const isSelected = selected?.name === name;
                  const hasData = countryHasData.has(name);
                  const fill = isSelected ? "#C7D2FE" : hasData ? "#E6ECFF" : "#EEF2F7";
                  const hoverFill = isSelected ? "#C7D2FE" : "#DDE3F5";
                  return (
                    <Geography
                      key={(geo as Feature).id}
                      geography={geo}
                      onClick={hasData ? () => handleCountryClick(geo) : undefined}
                      style={{
                        default: { fill, outline: "none", stroke: "#CBD5E1", strokeWidth: isSelected ? 1 : 0.5, cursor: hasData ? "pointer" : "default" },
                        hover: { fill: hoverFill, outline: "none", cursor: hasData ? "pointer" : "default" },
                        pressed: { fill: "#C7D2FE", outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* City markers when a country is selected */}
            <AnimatePresence>
              {/* Render markers for all countries with data; scale up for selected country */}
              {allCityData.map((c, idx) => {
                const label = c.city;
                const rimR = 5.5;
                const emblemR = 4.0;
                const isPrivate = c.kind === "private";
                const accent = isPrivate ? "#F59E0B" : "#6C63FF"; // amber for private, indigo for public
                const clipId = `logo-${(c.country || selected?.name || "").replace(/\s/g, "-")}-${idx}-clip`;
                const yJitter = 0; // keep precise alignment; jitter removed
                const isSelectedCountry = selected?.name === c.country;
                const scale = markerScale * (isSelectedCountry ? 1 : 0.8);
                const key = `${c.country}-${c.city}-${c.uni}`;
                return (
                  <Marker key={`${c.city}-${c.uni}`} coordinates={[c.lng, c.lat]}>
                    <motion.g
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 140, damping: 18 }}
                      transform={`translate(0, ${yJitter})`}
                      onMouseEnter={(e) => {
                        (e.currentTarget as SVGGElement).style.zIndex = "10";
                        setHoveredKey(key);
                      }}
                      onMouseLeave={() => setHoveredKey((k) => (k === key ? null : k))}
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

                      {/* Hover tooltip button */}
                      {hoveredKey === key && (
                        <g transform="translate(10, -22)" style={{ cursor: "pointer" }} onClick={() => {
                          const slug = (c.uni || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                          try { router.push(`/universities/${encodeURIComponent(slug)}`); } catch {}
                        }}>
                          <rect x={-4} y={-12} rx={6} ry={6} width={92} height={24} fill="#6C63FF" opacity={0.95} />
                          <text x={42} y={4} textAnchor="middle" fontSize={10} fontWeight={600} fill="#fff">Learn more?</text>
                        </g>
                      )}
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
            className="pointer-events-auto absolute left-3 z-20 w-[min(520px,42vw)] rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur overflow-hidden"
            style={{
              top: PANEL_TOP_GAP,
              bottom: PANEL_GUTTER,
              maxHeight: `calc(100% - ${PANEL_TOP_GAP + PANEL_GUTTER}px)`
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
