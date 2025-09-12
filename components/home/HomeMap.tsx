"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";
import ExplorerRail from "@/components/home/ExplorerRail";
import FloatingPanel from "@/components/ui/FloatingPanel";
import UniversitiesPanelFloating from "@/components/home/UniversitiesPanelFloating";
import { useRouter, useSearchParams } from "next/navigation";
import UniversitiesPanel from "@/components/home/UniversitiesPanel";
import UniversitiesListMobile from "@/components/home/UniversitiesListMobile";
import BottomSheet from "@/components/ui/BottomSheet";
import CompareFab from "@/components/home/CompareFab";
import CompareDrawer from "@/components/home/CompareDrawer";
import SavedFab from "@/components/home/SavedFab";
import SavedDrawer from "@/components/home/SavedDrawer";
import MapFiltersBar, { type MapFilters } from "@/components/home/MapFiltersBar";

// DB-backed types (match /api/universities response)
type City = {
  id?: number;
  slug?: string;
  city: string;
  lat: number;
  lng: number;
  uni: string;
  kind?: "public" | "private";
  language?: string;
  exam?: string;
  logo?: string;
  rating?: number;
  lastScore?: number;
  photos?: string[];
  orgs?: string[];
  article?: { title: string; href?: string };
  costRent?: number;
  costFoodIndex?: number;
  costTransport?: number;
  admOpens?: string;
  admDeadline?: string;
  admResults?: string;
  trendPoints?: Array<{ year: number; type: string; score: number }>;
  trendSeats?: Array<{ year: number; type: string; seats: number }>;
  emsCount?: number;
};
type CountryCities = Record<string, City[]>;

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Feature = {
  id: string;
  properties: { name: string; iso_a3?: string };
};

export default function HomeMap() {
  const router = useRouter();
  const [selected, setSelected] = useState<{ name: string; center: [number, number]; baseCenter: [number, number] } | null>(null);
  // Pull the world closer to the header by default
  // Start 50% closer than before (zoom 1.5 instead of 1)
  const [position, setPosition] = useState<{ center: [number, number]; zoom: number }>({ center: [0, 4], zoom: 1.5 });

  // Desktop-only layout constants (we don't handle mobile/tablet yet)
  // Keep panel tightly under the menu inside the map container.
  const PANEL_GUTTER = 8;    // spacing from container bottom
  const PANEL_TOP_GAP = 4;   // small gap under menu

  const [uniData, setUniData] = useState<CountryCities | null>(null);
  const [enrichedCountries, setEnrichedCountries] = useState<Set<string>>(new Set());
  const [enriching, setEnriching] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>({ q: "", country: "", language: "", exam: "" });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<{ x: number; y: number; data: any } | null>(null);
  const countryHasData = useMemo(() => new Set(Object.keys(uniData ?? {})), [uniData]);
  // Flatten all cities
  const allCityDataRaw = useMemo(() =>
    uniData ? Object.entries(uniData).flatMap(([country, cities]) => cities.map((c) => ({ ...c, country }))) : []
  , [uniData]);
  // Apply filters
  const allCityData = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return allCityDataRaw.filter((c) => {
      if (filters.country && c.country !== filters.country) return false;
      if (filters.language && (c.language ?? "") !== filters.language) return false;
      if (filters.exam && (c.exam ?? "") !== filters.exam) return false;
      if (filters.kind && (c.kind ?? '') !== filters.kind) return false;
      if (q && !(c.uni.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [allCityDataRaw, filters]);
  const cityData = useMemo(() => (selected ? allCityData.filter((c) => c.country === selected.name) : []), [selected, allCityData]);
  const cityDataSorted = useMemo(() => {
    const arr = [...cityData];
    const s = (filters as any)?.sort || '';
    if (!s) return arr;
    if (s === 'tuition-asc') {
      // placeholder: sort by rating ascending (proxy)
      return arr.sort((a: any, b: any) => (a.rating ?? 999) - (b.rating ?? 999));
    }
    if (s === 'seats-desc') {
      // placeholder: sort by lastScore descending (proxy)
      return arr.sort((a: any, b: any) => (b.lastScore ?? -1) - (a.lastScore ?? -1));
    }
    if (s === 'deadline-asc') {
      // placeholder: alphabetical by uni (proxy)
      return arr.sort((a: any, b: any) => (a.uni || '').localeCompare(b.uni || ''));
    }
    return arr;
  }, [cityData, (filters as any)?.sort]);
  const markerScale = useMemo(() => 0.35 / Math.sqrt(position.zoom || 1), [position.zoom]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [panelOffset, setPanelOffset] = useState(140);
  const searchParams = useSearchParams();
  const [compareOpen, setCompareOpen] = useState(false);
  const [compare, setCompare] = useState<Array<any>>([]);
  const compareSet = useMemo(() => new Set(compare.map((i) => i.uni)), [compare]);
  // Saved shortlist
  const [savedOpen, setSavedOpen] = useState(false);
  const [saved, setSaved] = useState<Array<any>>([]);
  const savedSet = useMemo(() => new Set(saved.map((i) => i.uni)), [saved]);
  // Mobile results control
  const [sheetCustomItems, setSheetCustomItems] = useState<any[] | null>(null); // if set, sheet shows these instead of selected country
  const [isSmall, setIsSmall] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Compare persistence + deep link
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('ems_compare') : null;
    if (stored) {
      try { setCompare(JSON.parse(stored)); } catch {}
    }
    const s2 = typeof window !== 'undefined' ? window.localStorage.getItem('ems_saved') : null;
    if (s2) { try { setSaved(JSON.parse(s2)); } catch {} }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('ems_compare', JSON.stringify(compare));
    // Deep link param
    const slugs = compare.map((c) => c.uni.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    const params = new URLSearchParams(window.location.search);
    if (slugs.length) params.set('compare', slugs.join(',')); else params.delete('compare');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : `?`, { scroll: false });
  }, [compare, router]);
  useEffect(() => {
    const pre = searchParams?.get('compare');
    if (pre) {
      const slugs = pre.split(',').filter(Boolean);
      const found = allCityDataRaw.filter((c) => slugs.includes(c.uni.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')))
        .map((c) => ({ uni: c.uni, country: c.country, city: c.city, kind: c.kind, language: (c as any).language, exam: (c as any).exam, rating: c.rating, lastScore: c.lastScore, logo: c.logo }));
      if (found.length) setCompare(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addToCompare(item: any) {
    setCompare((arr) => {
      if (arr.some((x) => x.uni === item.uni)) return arr;
      if (arr.length >= 10) { try { alert('You can compare up to 10 universities at a time.'); } catch {} return arr; }
      return [...arr, { uni: item.uni, country: item.country, city: item.city, kind: item.kind, language: item.language, exam: item.exam, rating: item.rating, lastScore: item.lastScore, logo: item.logo }];
    });
  }
  function removeFromCompare(uni: string) {
    setCompare((arr) => arr.filter((x) => x.uni !== uni));
  }
  function clearCompare() {
    setCompare([]);
  }
  function toggleSaved(item: any) {
    setSaved((arr) => {
      if (arr.some((x) => x.uni === item.uni)) return arr.filter((x) => x.uni !== item.uni);
      return [...arr, { uni: item.uni, country: item.country, city: item.city, kind: item.kind, logo: item.logo }];
    });
  }

  // Deep-link: read on first render
  useEffect(() => {
    const q = searchParams?.get('q') ?? '';
    const country = searchParams?.get('country') ?? '';
    const language = searchParams?.get('language') ?? '';
    const exam = searchParams?.get('exam') ?? '';
    const sort = searchParams?.get('sort') ?? '';
    const colorMode = (searchParams?.get('color') as any) as ('exam'|'language'|'type') ?? undefined;
    const kind = (searchParams?.get('kind') as any) as ('public'|'private'|'') ?? '';
    setFilters({ q, country, language, exam, sort, colorMode, kind });
    if (country) {
      // try to preselect country view
      const found = allCityDataRaw.find((c) => c.country === country);
      if (found) {
        // approximate center based on first match
        setSelected({ name: country, center: position.center, baseCenter: position.center });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure overlay height to place the left panel just beneath it
  useEffect(() => {
    function measure() {
      const h = overlayRef.current?.offsetHeight ?? 140;
      // Ensure the results panel always clears the filter with extra buffer
      setPanelOffset(Math.min(320, Math.max(140, h + 48)));
    }
    measure();
    if (typeof window !== 'undefined') {
      const ro = new ResizeObserver(measure);
      if (overlayRef.current) ro.observe(overlayRef.current);
      window.addEventListener('resize', measure);
      return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
    }
  }, []);

  // Deep-link: write on filter change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.country) params.set('country', filters.country);
      if (filters.language) params.set('language', filters.language);
      if (filters.exam) params.set('exam', filters.exam);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.colorMode) params.set('color', String(filters.colorMode));
      if (filters.kind) params.set('kind', String(filters.kind));
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : `?`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [filters, router]);

  // Load data from API (DB only; if it fails, show nothing instead of static demo)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Prefer localStorage cache by version to avoid network and Edge requests between visits
        const v = process.env.NEXT_PUBLIC_UNIS_DATA_V ? String(process.env.NEXT_PUBLIC_UNIS_DATA_V) : "v1";
        const localKey = `unis:markers:${v}`;
        try {
          const cached = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
          if (cached) {
            const parsed = JSON.parse(cached);
            if (!cancelled) setUniData(parsed as CountryCities);
            return; // use local cache; network skipped
          }
        } catch {}
        // Fallback to network
        const res = await fetch(`/api/universities?scope=markers&v=${encodeURIComponent(v)}`);
        const json = await res.json();
        if (!cancelled) {
          setUniData(json.data as CountryCities);
          try { if (typeof window !== 'undefined') window.localStorage.setItem(localKey, JSON.stringify(json.data)); } catch {}
        }
      } catch {
        if (!cancelled) setUniData({});
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // On country selection, fetch enriched data for that country once, then cache in memory
  useEffect(() => {
    const name = selected?.name;
    if (!name || !uniData) return;
    if (enrichedCountries.has(name) || enriching === name) return;
    // If current list items already have trendPoints (from a previous enrichment), skip
    const hasTrends = (uniData[name] || []).some((c: any) => Array.isArray((c as any).trendPoints) && (c as any).trendPoints.length > 0);
    if (hasTrends) {
      setEnrichedCountries((s) => new Set(s).add(name));
      return;
    }
    let cancelled = false;
    setEnriching(name);
    (async () => {
      try {
        const vStr = process.env.NEXT_PUBLIC_UNIS_DATA_V ? String(process.env.NEXT_PUBLIC_UNIS_DATA_V) : "v1";
        const localKey = `unis:country:${vStr}:${name}`;
        // Try local first
        try {
          const cached = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
          if (cached) {
            const arr = JSON.parse(cached);
            if (!cancelled) {
              const next: CountryCities = { ...(uniData || {}) } as any;
              next[name] = arr as any;
              setUniData(next);
              setEnrichedCountries((s) => new Set(s).add(name));
            }
            return;
          }
        } catch {}
        const res = await fetch(`/api/universities?scope=country&name=${encodeURIComponent(name)}&v=${encodeURIComponent(vStr)}`);
        if (!res.ok) throw new Error("bad");
        const json = await res.json();
        if (cancelled) return;
        const next: CountryCities = { ...(uniData || {}) } as any;
        // Replace only the selected country's array
        next[name] = (json.data?.[name] || []) as any;
        setUniData(next);
        setEnrichedCountries((s) => new Set(s).add(name));
        try { if (typeof window !== 'undefined') window.localStorage.setItem(localKey, JSON.stringify(next[name])); } catch {}
      } catch {}
      finally {
        if (!cancelled) setEnriching((s) => (s === name ? null : s));
      }
    })();
    return () => { cancelled = true; };
  }, [selected?.name, uniData, enrichedCountries, enriching]);

  // No header measurement needed; panel is anchored inside the map container.
  // Detect small screens (sm/md) for sheet behavior
  useEffect(() => {
    function check() {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
      setIsSmall(w < 1024); // match < lg
    }
    check();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }
  }, []);

  // Initial mobile focus will be snapped to Italy centroid once geographies are available
  const initApplied = useRef(false);

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

  function focusCountry(geo: any, openSheet: boolean) {
    const name: string = geo.properties.name;
    const baseCenter = geoCentroid(geo) as [number, number];
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const targetZoom = isSmall ? 6.9 : (vh < 850 ? 5.0 : 5.2);
    const center = isSmall ? baseCenter : computeOffsetCenter(baseCenter, targetZoom);
    setSelected({ name, center, baseCenter });
    setPosition({ center, zoom: targetZoom });
    if (isSmall && openSheet) { setSheetCustomItems(null); setSheetOpen(true); }
  }

  function handleCountryClick(geo: any) {
    focusCountry(geo, true);
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
      const targetZoom = isSmall ? 6.5 : (vh < 850 ? 5.0 : 5.2);
      const center = isSmall ? selected.baseCenter : computeOffsetCenter(selected.baseCenter, targetZoom);
      setPosition({ center, zoom: targetZoom });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [selected, isSmall]);

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
      <div className="relative rounded-none border-0 p-0 overflow-hidden" style={{ height: "calc(100svh - 120px)" }}>
        {/* No Back to world button per new default UX */}

        {/* Title removed per latest UX request */}

        {/* Wrap map to intercept wheel and scroll page instead of zooming */}
        <div
          className="relative h-full"
          onWheelCapture={(e) => {
            const target = e.target as HTMLElement;
            if ((panelRef.current && panelRef.current.contains(target)) || (overlayRef.current && overlayRef.current.contains(target))) return;
            e.preventDefault();
            e.stopPropagation();
            window.scrollBy({ top: e.deltaY, behavior: "auto" });
          }}
          
        >
        <ComposableMap projectionConfig={{ scale: 175 }} style={{ width: "100%", height: "100%" }}>
          <ZoomableGroup
            center={position.center}
            zoom={position.zoom}
            minZoom={isSmall ? 0.9 : position.zoom}
            maxZoom={isSmall ? 8 : position.zoom}
            animate
            animationDuration={1100}
            animationEasingFunction={(t: number) => 1 - Math.pow(1 - t, 3)}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) => {
                // On small screens, snap to Italy's precise centroid once, so it matches the post-click position
                if (isSmall && !initApplied.current && !selected && geographies?.length) {
                  const italyGeo = geographies.find((g: any) => (g.properties?.name as string) === 'Italy');
                  if (italyGeo) {
                    // schedule on next frame to avoid state updates during render
                    if (typeof window !== 'undefined') {
                      requestAnimationFrame(() => {
                        // Reuse the exact same centering logic as taps (but don't open the sheet)
                        focusCountry(italyGeo, false);
                        initApplied.current = true;
                      });
                    }
                  }
                }
                return geographies.map((geo: any) => {
                  const name = (geo.properties.name as string) || "";
                  const isSelected = selected?.name === name;
                  const hasData = countryHasData.has(name);
                  const fill = isSelected ? "#C7D2FE" : hasData ? "#E6ECFF" : "#EEF2F7";
                  // Keep the same fill on hover to remove the hover reaction
                  const hoverFill = fill;
                  // Subtler border; keep the same stroke on hover so it doesn't disappear when selected
                  const strokeColor = isSelected ? "#6366F1" : "#CBD5E1";
                  const strokeW = isSelected ? 1 : 0.5;
                  return (
                    <Geography
                      key={(geo as Feature).id}
                      geography={geo}
                      onClick={hasData ? () => handleCountryClick(geo) : undefined}
                      style={{
                        default: { fill, outline: "none", stroke: strokeColor, strokeWidth: strokeW, cursor: hasData ? "pointer" : "default" },
                        // Mirror default stroke on hover so selection outline stays visible
                        hover: { fill: hoverFill, outline: "none", stroke: strokeColor, strokeWidth: strokeW, cursor: hasData ? "pointer" : "default" },
                        pressed: { fill: "#C7D2FE", outline: "none", stroke: strokeColor, strokeWidth: strokeW },
                      }}
                    />
                  );
                })
              }}
            </Geographies>

            {/* City markers when a country is selected */}
            <AnimatePresence>
              {/* Render markers only for the selected country to cap DOM size */}
              {(selected ? cityDataSorted : []).map((c, idx) => {
                const label = c.city;
                const rimR = 5.5;
                const emblemR = 4.0;
                const isPrivate = c.kind === "private";
                // Color mapping by current mode (exam | language | type)
                const colorMode = (filters as any)?.colorMode || 'exam';
                const exam = (c as any).exam?.toLowerCase() || "";
                const lang = (c as any).language?.toLowerCase() || "";
                let accent = "#6C63FF";
                if (colorMode === 'exam') {
                  if (exam.includes('imat')) accent = '#6366F1';
                  else if (exam.includes('ucat')) accent = '#10B981';
                  else accent = '#6C63FF';
                } else if (colorMode === 'language') {
                  if (lang.includes('english')) accent = '#14B8A6';
                  else if (lang.includes('italian')) accent = '#38BDF8';
                  else accent = '#6C63FF';
                } else if (colorMode === 'type') {
                  accent = isPrivate ? '#F59E0B' : '#6366F1';
                }
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
                      whileHover={{ scale: scale * 1.35 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 140, damping: 18 }}
                      transform={`translate(0, ${yJitter})`}
                      onMouseEnter={(e) => {
                        (e.currentTarget as SVGGElement).style.zIndex = "10";
                        setHoveredKey(key);
                        try {
                          // Approximate screen placement for a pretty HTML hover card
                          const rect = (e as any)?.currentTarget?.getBoundingClientRect?.() || { left: (e as any).clientX, top: (e as any).clientY };
                          setHoverCard({ x: (rect.left || (e as any).clientX) + 14, y: (rect.top || (e as any).clientY) - 90, data: c });
                        } catch {}
                      }}
                      onMouseLeave={() => { setHoveredKey((k) => (k === key ? null : k)); setHoverCard((h)=> (h && `${h.data?.country}-${h.data?.city}-${h.data?.uni}`===key ? null : h)); }}
                      onClick={() => {
                        if (isSmall) {
                          setSheetCustomItems([c]);
                          if (!selected) {
                            setSelected({ name: c.country || "", center: position.center, baseCenter: position.center });
                          }
                          setSheetOpen(true);
                        } else {
                          const slug = (c.uni || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                          try { router.push(`/university/${encodeURIComponent(slug)}`); } catch {}
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Emblem-only dot (logo inside if available) */}
                      <g>
                        {isSelectedCountry && <circle r={rimR + 3} fill={accent} opacity={0.12} />}
                        {hoveredKey === key && <circle r={rimR + 5} fill={accent} opacity={0.18} />}
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
                      {/* Hover tooltip with quick info */}
                      {hoveredKey === key && (
                        <g transform="translate(12, -28)">
                          <rect x={-6} y={-14} rx={6} ry={6} width={180} height={36} fill="#111827" opacity={0.85} />
                          <text x={4} y={0} fontSize={10} fontWeight={700} fill="#fff">{c.uni}</text>
                          <text x={4} y={12} fontSize={9} fill="#e5e7eb">{c.city}{c.kind ? ` • ${c.kind}` : ''}</text>
                        </g>
                      )}
                    </motion.g>
                  </Marker>
                );
              })}
            </AnimatePresence>
          </ZoomableGroup>
        </ComposableMap>
        </div>

        {/* Filters rail (desktop) or floating compact bar (mobile) */}
        {isSmall ? (
          <div className="pointer-events-none absolute inset-x-0 z-30 flex justify-center" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" }}>
            <motion.div
              ref={overlayRef}
              className="pointer-events-auto"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              style={{ width: "min(calc(100vw - 24px), 560px)" }}
            >
              <MapFiltersBar
                compact={true}
                filters={filters}
                onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
                countries={Array.from(new Set(allCityDataRaw.map((c) => c.country))).sort()}
                languages={Array.from(new Set(allCityDataRaw.map((c) => c.language).filter(Boolean) as string[])).sort()}
                exams={Array.from(new Set(allCityDataRaw.map((c) => c.exam).filter(Boolean) as string[])).sort()}
                resultCount={allCityData.length} onOpenSaved={() => setSavedOpen(true)} onOpenCompare={() => setCompareOpen(true)} savedCount={saved.length} compareCount={compare.length}
                onViewMobile={() => {
                  if (filters.country) {
                    const found = allCityDataRaw.find((c)=> c.country === filters.country);
                    if (found) { setSelected({ name: filters.country, center: position.center, baseCenter: position.center }); setSheetCustomItems(null); setSheetOpen(true); }
                  } else { setSheetCustomItems(allCityData); setSheetOpen(true); }
                }}
                suggestions={
                  filters.q.trim().length >= 1
                    ? Array.from(new Set([
                        ...allCityDataRaw.map((c) => ({ label: c.uni, value: c.uni, kind: 'uni' as const })),
                        ...allCityDataRaw.map((c) => ({ label: c.city, value: c.city, kind: 'city' as const })),
                        ...allCityDataRaw.map((c) => ({ label: c.country, value: c.country, kind: 'country' as const })),
                      ].map((s) => `${s.kind}:${s.label}`)))
                        .map((key) => { const [kind, label] = key.split(':'); return { kind: kind as 'uni'|'city'|'country', label, value: label }; })
                        .filter((s) => s.label.toLowerCase().includes(filters.q.toLowerCase()))
                        .slice(0, 12)
                    : []
                }
                onPick={(s) => { if (s.kind === 'country') { setFilters((f) => ({ ...f, country: s.value })); setSelected({ name: s.value, center: position.center, baseCenter: position.center }); } else if (s.kind === 'uni') { const slug = s.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); try { router.push(`/university/${encodeURIComponent(slug)}`); } catch {} } else { setFilters((f) => ({ ...f, q: s.value })); } }}
              />
            </motion.div>
          </div>
        ) : (
          <>
            <FloatingPanel
              id="map-filters"
              title="Search & Filters"
              initialSize={{ width: 560, height: 420 }}
              initialPos={{ x: 24, y: 120 }}
              minWidth={420}
              minHeight={260}
              className="bg-white/0"
              bodyClassName="p-4"
            >
              <MapFiltersBar
                compact={false}
                defaultAdvancedOpen={true}
                filters={filters}
                onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
                countries={Array.from(new Set(allCityDataRaw.map((c) => c.country))).sort()}
                languages={Array.from(new Set(allCityDataRaw.map((c) => c.language).filter(Boolean) as string[])).sort()}
                exams={Array.from(new Set(allCityDataRaw.map((c) => c.exam).filter(Boolean) as string[])).sort()}
                resultCount={allCityData.length}
                onOpenSaved={() => setSavedOpen(true)}
                onOpenCompare={() => setCompareOpen(true)}
                savedCount={saved.length}
                compareCount={compare.length}
                suggestions={
                  filters.q.trim().length >= 1
                    ? Array.from(new Set([
                        ...allCityDataRaw.map((c) => ({ label: c.uni, value: c.uni, kind: 'uni' as const })),
                        ...allCityDataRaw.map((c) => ({ label: c.city, value: c.city, kind: 'city' as const })),
                        ...allCityDataRaw.map((c) => ({ label: c.country, value: c.country, kind: 'country' as const })),
                      ].map((s) => `${s.kind}:${s.label}`)))
                        .map((key) => { const [kind, label] = key.split(':'); return { kind: kind as 'uni'|'city'|'country', label, value: label }; })
                        .filter((s) => s.label.toLowerCase().includes(filters.q.toLowerCase()))
                        .slice(0, 12)
                    : []
                }
                onPick={(s) => { if (s.kind === 'country') { setFilters((f) => ({ ...f, country: s.value })); setSelected({ name: s.value, center: position.center, baseCenter: position.center }); } else if (s.kind === 'uni') { const slug = s.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); try { router.push(`/university/${encodeURIComponent(slug)}`); } catch {} } else { setFilters((f) => ({ ...f, q: s.value })); } }}
              />
            </FloatingPanel>

            {selected && cityData.length > 0 && (
              <FloatingPanel
                id="map-universities"
                title={selected!.name}
                initialSize={{ width: 520, height: 600 }}
                initialPos={{ x: Math.max(24, (typeof window !== 'undefined' ? (window.innerWidth - 520 - 24) : 980)), y: 140 }}
                minWidth={420}
                minHeight={360}
                className="bg-white/0"
                bodyClassName="p-4"
              >
                <UniversitiesPanelFloating
                  selectedName={selected!.name}
                  items={cityDataSorted as any}
                  onAddCompare={(c:any)=> addToCompare(c)}
                  compareSet={compareSet}
                  savedSet={savedSet}
                  onToggleSave={(c:any)=> toggleSaved(c)}
                  onHover={(c:any)=>{
                    if (!c) { setHoveredKey(null); return; }
                    const key = `${(c as any).country || selected!.name}-${c.city}-${c.uni}`;
                    setHoveredKey(key);
                  }}
                />
              </FloatingPanel>
            )}
          </>
        )}

        {/* Soft top/bottom gradient to blend edges on mobile */}
        {isSmall && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[var(--page-bg,#f6f7fb)]/0 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--page-bg,#f6f7fb)]/0 to-transparent" />
          </>
        )}

        {/* Right side panel of universities when a country is selected (legacy, disabled) */}
        {false && selected && cityData.length > 0 && (
          <div
            className="pointer-events-auto absolute left-3 z-20 w-[min(520px,42vw)] rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur overflow-hidden"
            style={{
              top: PANEL_TOP_GAP,
              bottom: PANEL_GUTTER,
              maxHeight: `calc(100% - ${PANEL_TOP_GAP + PANEL_GUTTER}px)`
            }}
            ref={panelRef}
          >
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">{selected?.name}</div>
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
        {(isSmall && sheetOpen && ( (selected && (sheetCustomItems===null)) || (sheetCustomItems && sheetCustomItems.length>0) )) && (
          <BottomSheet
            open={true}
            onClose={() => { setSheetCustomItems(null); setSelected(null); setSheetOpen(false); }}
            title={sheetCustomItems ? (filters.country || 'Results') : (selected!.name)}
            height="70vh"
          >
            <UniversitiesListMobile selectedName={sheetCustomItems ? (filters.country || 'Results') : selected!.name} items={(sheetCustomItems ?? cityDataSorted) as any} onAddCompare={(c:any)=> addToCompare(c)} compareSet={compareSet} />
          </BottomSheet>
        )}
        {(!isSmall && selected && cityData.length>0) && (
          <div ref={panelRef}>
            <UniversitiesPanel
              selectedName={selected!.name}
              items={cityDataSorted as any}
              topOffset={panelOffset}
              onAddCompare={(c)=> addToCompare(c)}
              compareSet={compareSet}
              savedSet={savedSet}
              onToggleSave={(c)=> toggleSaved(c)}
              onHover={(c) => {
                if (!c) { setHoveredKey(null); return; }
                const key = `${(c as any).country || selected!.name}-${c.city}-${c.uni}`;
                setHoveredKey(key);
              }}
            />
          </div>
        )}

        {/* Compare FAB + Drawer */}
        <CompareFab count={compare.length} onOpen={() => setCompareOpen(true)} />
        <CompareDrawer open={compareOpen} items={compare as any} onClose={() => setCompareOpen(false)} onRemove={removeFromCompare} onClear={clearCompare} />
        <SavedFab count={saved.length} onOpen={() => setSavedOpen(true)} />
        <SavedDrawer open={savedOpen} items={saved as any} onClose={() => setSavedOpen(false)} onRemove={(u)=> setSaved(s=>s.filter(x=>x.uni!==u))} onClear={()=> setSaved([])} />
      </div>

      {/* Pretty hover card (HTML), positioned near cursor */}
      {hoverCard && !isSmall && (
        <div className="pointer-events-none absolute z-40" style={{ left: hoverCard.x, top: hoverCard.y }}>
          <div className="rounded-xl bg-white/95 backdrop-blur p-2 pr-3 shadow-2xl ring-1 ring-black/10 flex items-center gap-3 min-w-[220px] max-w-[320px]">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center">
              {hoverCard.data.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hoverCard.data.logo} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-indigo-700">{hoverCard.data.city?.[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-gray-900">{hoverCard.data.uni}</div>
              <div className="truncate text-[10px] text-gray-600">{hoverCard.data.city}{hoverCard.data.kind ? ` • ${hoverCard.data.kind === 'private' ? 'Private' : 'Public'}` : ''}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {hoverCard.data.exam && (<span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700 ring-1 ring-indigo-200">{String(hoverCard.data.exam).toUpperCase()}</span>)}
                {hoverCard.data.language && (<span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700 ring-1 ring-teal-200">{String(hoverCard.data.language)}</span>)}
                {typeof hoverCard.data.emsCount === 'number' && (<span className="rounded-full bg-pink-50 px-1.5 py-0.5 text-[9px] font-semibold text-pink-700 ring-1 ring-pink-200">EMS {hoverCard.data.emsCount}</span>)}
              </div>
            </div>
            {typeof hoverCard.data.rating === 'number' && (
              <div className="ml-auto text-[11px] font-semibold text-gray-700">★ {hoverCard.data.rating.toFixed(1)}</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}



