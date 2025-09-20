"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";
import FloatingPanel from "@/components/ui/FloatingPanel";
import UniversitiesPanelFloating from "@/components/home/UniversitiesPanelFloating";
import { useRouter, useSearchParams } from "next/navigation";
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

// Use local TopoJSON so the map is fully offline
const GEO_URL = "/maps/world-110m.json";

type Feature = {
  id: string;
  properties: { name: string; iso_a3?: string };
};

type Viewport = { width: number; height: number };

const slugify = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function HomeMap({ variant = "default" }: { variant?: "default" | "compact" } = {}) {
  const router = useRouter();
  const forcedCompact = variant === "compact";
  const italyCenter: [number, number] = [12.567, 41.8719];
  const initialSmall = forcedCompact || (typeof window !== "undefined" ? window.innerWidth < 1024 : false);
  const [selected, setSelected] = useState<{ name: string; center: [number, number]; baseCenter: [number, number] } | null>(() =>
    initialSmall ? { name: "Italy", center: italyCenter, baseCenter: italyCenter } : null
  );
  const [position, setPosition] = useState<{ center: [number, number]; zoom: number }>(() =>
    initialSmall ? { center: italyCenter, zoom: 9.8 } : { center: [0, 4], zoom: 1.5 }
  );

  // Desktop-only layout constants (we don't handle mobile/tablet yet)
  // Keep panel tightly under the menu inside the map container.
  // Static JSON dataset (from public/). Starts empty and fills from /map/v1/*.json
  const [uniData, setUniData] = useState<CountryCities | null>(null);
  const [enrichedCountries, setEnrichedCountries] = useState<Set<string>>(new Set());
  const [enriching, setEnriching] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>(() => ({ q: "", country: initialSmall ? "Italy" : "", language: "", exam: "" }));
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<{ x: number; y: number; data: any } | null>(null);
  const updateSearchParams = useCallback((mutator: (params: URLSearchParams) => void) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const before = params.toString();
    mutator(params);
    const after = params.toString();
    if (after === before) return;
    const next = `${window.location.pathname}${after ? `?${after}` : ""}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next === current) return;
    router.replace(next, { scroll: false });
  }, [router]);
  const countryHasData = useMemo(() => new Set(Object.keys(uniData ?? {})), [uniData]);
  // Flatten all cities
  const allCityDataRaw = useMemo(
    () => (uniData ? Object.entries(uniData).flatMap(([country, cities]) => cities.map((c) => ({ ...c, country }))) : []),
    [uniData]
  );
  // Apply filters
  const allCityData = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return allCityDataRaw.filter((c) => {
      if (filters.country && c.country !== filters.country) return false;
      if (filters.language && (c.language ?? '') !== filters.language) return false;
      if (filters.exam && (c.exam ?? '') !== filters.exam) return false;
      if (filters.kind && (c.kind ?? '') !== filters.kind) return false;
      if (q && !(c.uni.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [allCityDataRaw, filters]);
  const cityData = useMemo(() => (selected ? allCityData.filter((c) => c.country === selected.name) : []), [selected, allCityData]);
  const sortKey = (filters as any)?.sort || '';
  const cityDataSorted = useMemo(() => {
    const arr = [...cityData];
    if (!sortKey) return arr;
    if (sortKey === 'tuition-asc') {
      // placeholder: sort by rating ascending (proxy)
      return arr.sort((a: any, b: any) => (a.rating ?? 999) - (b.rating ?? 999));
    }
    if (sortKey === 'seats-desc') {
      // placeholder: sort by lastScore descending (proxy)
      return arr.sort((a: any, b: any) => (b.lastScore ?? -1) - (a.lastScore ?? -1));
    }
    if (sortKey === 'deadline-asc') {
      // placeholder: alphabetical by uni (proxy)
      return arr.sort((a: any, b: any) => (a.uni || '').localeCompare(b.uni || ''));
    }
    return arr;
  }, [cityData, sortKey]);
  const markerScale = useMemo(() => 0.35 / Math.sqrt(position.zoom || 1), [position.zoom]);
  const [viewport, setViewport] = useState<Viewport>({ width: 1440, height: 900 });
  const searchParams = useSearchParams();
  const [compareOpen, setCompareOpen] = useState(false);
  const [compare, setCompare] = useState<Array<any>>([]);
  const compareSet = useMemo(() => new Set(compare.map((i) => i.uni)), [compare]);
  // Saved shortlist
  const [savedOpen, setSavedOpen] = useState(false);
  const [saved, setSaved] = useState<Array<any>>([]);
  const savedSet = useMemo(() => new Set(saved.map((i) => i.uni)), [saved]);

  const { q: rawSearch } = filters;
  const searchQuery = rawSearch.trim();
  const searchSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    const uniq = new Set<string>();
    for (const c of allCityDataRaw) {
      uniq.add(`uni:${c.uni}`);
      uniq.add(`city:${c.city}`);
      uniq.add(`country:${c.country}`);
    }
    return Array.from(uniq)
      .map((key) => {
        const [kind, label] = key.split(':');
        return { kind: kind as 'uni' | 'city' | 'country', label, value: label };
      })
      .filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 12);
  }, [allCityDataRaw, searchQuery]);

  const availableCountries = useMemo(() => {
    const entries = new Set(allCityDataRaw
      .map((c) => c.country)
      .filter((country): country is string => !!country));
    return Array.from(entries).sort();
  }, [allCityDataRaw]);
  const availableLanguages = useMemo(() => {
    const entries = new Set(allCityDataRaw
      .map((c) => c.language)
      .filter((lang): lang is string => !!lang));
    return Array.from(entries).sort();
  }, [allCityDataRaw]);
  const availableExams = useMemo(() => {
    const entries = new Set(allCityDataRaw
      .map((c) => c.exam)
      .filter((exam): exam is string => !!exam));
    return Array.from(entries).sort();
  }, [allCityDataRaw]);

  const [sheetCustomItems, setSheetCustomItems] = useState<any[] | null>(null); // if set, sheet shows these instead of selected country
  const [isSmall, setIsSmall] = useState(initialSmall);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ems_compare', JSON.stringify(compare));
    }
    updateSearchParams((params) => {
      const slugs = compare.map((c) => slugify(c.uni)).filter(Boolean);
      if (slugs.length > 0) params.set('compare', slugs.join(',')); else params.delete('compare');
    });
  }, [compare, updateSearchParams]);
  useEffect(() => {
    const pre = searchParams?.get('compare');
    if (pre) {
      const slugs = pre.split(',').filter(Boolean);
      const found = allCityDataRaw.filter((c) => slugs.includes(slugify(c.uni)))
        .map((c) => ({ uni: c.uni, country: c.country, city: c.city, kind: c.kind, language: (c as any).language, exam: (c as any).exam, rating: c.rating, lastScore: c.lastScore, logo: c.logo }));
      if (found.length) setCompare(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addToCompare(item: any) {
    setCompare((arr) => {
      if (arr.some((x) => x.uni === item.uni)) return arr;
      if (arr.length >= 10) { try { alert('You can compare up to 10 universities at a time.'); } catch {} return arr; }
      // Preserve any prefetched trend data so Compare drawer can render offline
      return [
        ...arr,
        {
          uni: item.uni,
          country: item.country,
          city: item.city,
          kind: item.kind,
          language: item.language,
          exam: item.exam,
          rating: item.rating,
          lastScore: item.lastScore,
          logo: item.logo,
          trendPoints: (item as any).trendPoints,
          trendSeats: (item as any).trendSeats,
          id: (item as any).id,
        },
      ];
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

  const handleSuggestionPick = (s: { label: string; kind: 'uni' | 'city' | 'country'; value: string }) => {
    if (s.kind === 'country') {
      const baseCenter = s.value === 'Italy' ? italyCenter : position.center;
      setFilters((f) => ({ ...f, country: s.value }));
      setSelected({ name: s.value, center: baseCenter, baseCenter });
      if (isSmall) {
        setPosition({ center: baseCenter, zoom: 10.5 });
      }
    } else if (s.kind === 'uni') {
      const slug = s.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      try { router.push(`/university/${encodeURIComponent(slug)}`); } catch {}
    } else {
      setFilters((f) => ({ ...f, q: s.value }));
    }
  };

  const handleOpenMobileResults = () => {
    if (!isSmall) return;
    if (filters.country) {
      const baseCenter = filters.country === 'Italy' ? italyCenter : (selected?.baseCenter ?? position.center);
      setSelected({ name: filters.country, center: baseCenter, baseCenter });
      setPosition({ center: baseCenter, zoom: 10.5 });
      setSheetCustomItems(null);
    } else {
      setSheetCustomItems(allCityData);
    }
    setFiltersSheetOpen(false);
    setSheetOpen(true);
  };

  // Deep-link: read on first render
  useEffect(() => {
    const hasAnyParam = ['q', 'country', 'language', 'exam', 'sort', 'color', 'kind'].some((key) => searchParams?.has(key));
    if (!hasAnyParam) return;
    const q = searchParams?.get('q') ?? '';
    const country = searchParams?.get('country') ?? '';
    const language = searchParams?.get('language') ?? '';
    const exam = searchParams?.get('exam') ?? '';
    const sort = searchParams?.get('sort') ?? '';
    const colorMode = (searchParams?.get('color') as any) as ('exam'|'language'|'type') ?? undefined;
    const kind = (searchParams?.get('kind') as any) as ('public'|'private'|'') ?? '';
    setFilters((prev) => ({ ...prev, q, country, language, exam, sort, colorMode, kind }));
    if (country) {
      // try to preselect country view
      const found = allCityDataRaw.find((c) => c.country === country);
      if (found) {
        // approximate center based on first match
        const baseCenter = country === "Italy" ? italyCenter : position.center;
        setSelected({ name: country, center: baseCenter, baseCenter });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Deep-link: write on filter change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      updateSearchParams((params) => {
        ['q', 'country', 'language', 'exam', 'sort', 'color', 'kind'].forEach((key) => params.delete(key));
        if (filters.q) params.set('q', filters.q);
        if (filters.country) params.set('country', filters.country);
        if (filters.language) params.set('language', filters.language);
        if (filters.exam) params.set('exam', filters.exam);
        if (filters.sort) params.set('sort', filters.sort);
        if (filters.colorMode) params.set('color', String(filters.colorMode));
        if (filters.kind) params.set('kind', String(filters.kind));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [filters, updateSearchParams]);

  // Load minimal markers from static JSON under public/map/v1/markers.min.json
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch("/map/v1/markers.min.json", { cache: "force-cache" });
        if (!res.ok) throw new Error("no markers");
        const json = await res.json();
        if (!off) setUniData(json as CountryCities);
        // Optimistically prefetch Italy enrichment if available so the panel has scores immediately
        try {
          const r2 = await fetch(`/map/v1/countries/Italy.json`, { cache: "force-cache" });
          if (r2.ok) {
            const arr = await r2.json();
            if (!off) {
              setUniData((prev) => {
                const base = (prev || (json as CountryCities)) as any;
                const next: CountryCities = { ...base } as any;
                next["Italy"] = arr as any;
                return next;
              });
              setEnrichedCountries((s) => new Set(s).add("Italy"));
            }
          }
        } catch {}
      } catch {
        // Fallback: try bundled demo data so UI isn't empty during setup
        try {
          const mod = await import("@/data/universities");
          if (!off) setUniData(mod.demoUniversities as CountryCities);
        } catch {
          if (!off) setUniData({});
        }
      }
    })();
    return () => { off = true; };
  }, []);

  // On selection, load enriched per-country file from public/map/v1/countries/<name>.json (if available)
  useEffect(() => {
    const name = selected?.name;
    if (!name || !uniData) return;
    if (enrichedCountries.has(name) || enriching === name) return;
    let off = false;
    setEnriching(name);
    (async () => {
      try {
        const path = `/map/v1/countries/${encodeURIComponent(name)}.json`;
        const res = await fetch(path, { cache: "force-cache" });
        if (!res.ok) throw new Error("no country file");
        const arr = (await res.json()) as City[];
        if (off) return;
        const next: CountryCities = { ...(uniData || {}) } as any;
        next[name] = arr as any;
        setUniData(next);
        setEnrichedCountries((s) => new Set(s).add(name));
      } catch {
        // If there's no country file yet, keep markers-only view
      } finally {
        if (!off) setEnriching((s) => (s === name ? null : s));
      }
    })();
    return () => { off = true; };
  }, [selected?.name, uniData, enrichedCountries, enriching]);

  // No header measurement needed; panel is anchored inside the map container.
  // Detect small screens (sm/md) for sheet behavior
  useEffect(() => {
    function check() {
      const w = typeof window !== "undefined" ? window.innerWidth : 1440;
      const h = typeof window !== "undefined" ? window.innerHeight : 900;
      setViewport({ width: w, height: h });
      setIsSmall(forcedCompact || w < 1024); // match < lg or compact override
    }
    check();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }
  }, [forcedCompact]);

  useEffect(() => {
    if (!isSmall) {
      setFiltersSheetOpen(false);
    }
  }, [isSmall]);

  // Initial mobile focus will be snapped to Italy centroid once geographies are available
  const initApplied = useRef(false);

  // Compute a center offset that places the focused country roughly
  // in the middle of the free space between the two floating panels
  // (filters on the left, universities list on the right) and adds a
  // vertical margin so selection isn't glued to the bottom.
  function computeOffsetCenter(baseCenter: [number, number], zoom: number): [number, number] {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;

    // FloatingPanel defaults (match component props below)
    const leftPanelWidthPx = 560; // filters panel
    const rightPanelWidthPx = 520; // universities list panel
    const leftPadPx = 24;
    const rightPadPx = 24;

    // Approximate width/height of visible world in degrees under the current zoom.
    const visibleWidthDeg = 360 / Math.max(zoom, 1);
    const visibleHeightDeg = 180 / Math.max(zoom, 1);

    // Target on-screen X for the country centroid: center of the free gap.
    const gapWidthPx = Math.max(0, vw - leftPanelWidthPx - rightPanelWidthPx - leftPadPx - rightPadPx);
    const desiredXpx = leftPadPx + leftPanelWidthPx + gapWidthPx / 2; // from left edge
    const deltaFromCenterPx = desiredXpx - (vw / 2);
    const xShift = (visibleWidthDeg * deltaFromCenterPx) / vw;

    // Vertical shift to avoid the bottom edge; keep it modest.
    const yShiftBase = vh < 850 ? 0.20 : 0.18; // fraction of visible height
    const yShift = Math.max(4, visibleHeightDeg * yShiftBase);

    // Move map center opposite to desired content shift.
    return [baseCenter[0] - xShift, baseCenter[1] - yShift];
  }

  function focusCountry(geo: any, openSheet: boolean) {
    const name: string = geo.properties.name;
    const baseCenter = geoCentroid(geo) as [number, number];
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    // Much deeper zoom on mobile; a bit more on desktop
    const targetZoom = isSmall ? 10.5 : (vh < 850 ? 6.0 : 6.2);
    const center = isSmall ? baseCenter : computeOffsetCenter(baseCenter, targetZoom);
    setSelected({ name, center, baseCenter });
    setFilters((prev) => ({ ...prev, country: name }));
    setPosition({ center, zoom: targetZoom });
    if (isSmall && openSheet) {
      setSheetCustomItems(null);
      setFiltersSheetOpen(true);
      setSheetOpen(false);
    }
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
      const targetZoom = isSmall ? 10.3 : (vh < 850 ? 6.0 : 6.2);
      const center = isSmall ? selected.baseCenter : computeOffsetCenter(selected.baseCenter, targetZoom);
      setPosition({ center, zoom: targetZoom });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [selected, isSmall]);

  // Default selection: select Italy once data is available
  useEffect(() => {
    if (selected || !uniData) return;
    const baseCenter: [number, number] = [12.567, 41.8719]; // Italy approximate centroid
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    if (isSmall) {
      const targetZoom = 10.5;
      const center = baseCenter;
      setSelected({ name: "Italy", baseCenter, center });
      setPosition({ center, zoom: targetZoom });
    } else {
      const targetZoom = vh < 850 ? 6.0 : 6.2;
      const center = computeOffsetCenter(baseCenter, targetZoom);
      setSelected({ name: "Italy", baseCenter, center });
      setPosition({ center, zoom: targetZoom });
    }
  }, [uniData, isSmall, selected]);

  const compactHeight = Math.max(Math.min(viewport.height - 120, 620), 420);
  const desktopHeight = Math.max(viewport.height - 120, 640);
  const mapHeight = (forcedCompact || isSmall) ? compactHeight : desktopHeight;
  const outerClass = (forcedCompact || isSmall) ? "relative px-4 pb-10 pt-4 space-y-6" : "relative";
  const mapShellClass = (forcedCompact || isSmall)
    ? "relative overflow-hidden rounded-[28px] border border-white/30 bg-white/10 p-0 shadow-[0_24px_60px_rgba(30,64,175,0.18)] backdrop-blur"
    : "relative rounded-none border-0 p-0 overflow-hidden";

  return (
    <div className={outerClass}>
      {/* Hero map */}
      <div className={mapShellClass} style={{ height: mapHeight }}>
        {/* No Back to world button per new default UX */}

        {/* Title removed per latest UX request */}

        {/* Wrap map to intercept wheel and scroll page instead of zooming */}
        <div
          className="relative h-full"
          onWheelCapture={(e) => {
            // Allow interactive zoom on desktop; on small screens, keep wheel scrolling the page
            if (!isSmall) return;
            e.preventDefault();
            e.stopPropagation();
            window.scrollBy({ top: e.deltaY, behavior: "auto" });
          }}
        >
        <ComposableMap projectionConfig={{ scale: 175 }} style={{ width: "100%", height: "100%" }}>
          <ZoomableGroup
            center={position.center}
            zoom={position.zoom}
            minZoom={isSmall ? 0.9 : 0.9}
            maxZoom={isSmall ? 14 : 14}
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
                          setFiltersSheetOpen(false);
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
                      {false && hoveredKey === key && (
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[var(--page-bg,#f6f7fb)]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--page-bg,#f6f7fb)]/80 to-transparent" />
        {isSmall ? (
          <motion.div
            className="pointer-events-none absolute inset-x-0 z-30 flex justify-center"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              type="button"
              onClick={() => setFiltersSheetOpen(true)}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-sm font-semibold text-indigo-700 shadow-[0_18px_38px_rgba(79,70,229,0.22)] backdrop-blur-sm"
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Adjust filters
            </button>
          </motion.div>
        ) : (
          <>
            <FloatingPanel
              id="home-map-filters"
              initialSize={{ width: 420, height: 520 }}
              minWidth={360}
              minHeight={320}
              initialPos={{ x: 24, y: 96 }}
              className="hidden lg:block z-30"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white/95 shadow-[0_20px_46px_rgba(36,43,72,0.2)] ring-1 ring-indigo-100/70 backdrop-blur">
                <div className="ems-win-drag select-none px-5 py-3 text-xs font-semibold uppercase tracking-wide text-indigo-600/90">
                  Map filters
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <MapFiltersBar
                    filters={filters}
                    onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
                    countries={availableCountries}
                    languages={availableLanguages}
                    exams={availableExams}
                    resultCount={allCityData.length}
                    suggestions={searchSuggestions}
                    onPick={handleSuggestionPick}
                    onOpenSaved={() => setSavedOpen(true)}
                    onOpenCompare={() => setCompareOpen(true)}
                    savedCount={saved.length}
                    compareCount={compare.length}
                    defaultAdvancedOpen
                  />
                </div>
              </div>
            </FloatingPanel>
            {selected && cityDataSorted.length > 0 && (
              <FloatingPanel
                id="home-map-results"
                initialSize={{ width: 520, height: 540 }}
                minWidth={420}
                minHeight={360}
                initialPos={{ x: 476, y: 96 }}
                className="hidden lg:block z-30"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white/95 shadow-[0_22px_50px_rgba(36,43,72,0.24)] ring-1 ring-indigo-100/70 backdrop-blur">
                  <UniversitiesPanelFloating
                    selectedName={selected.name}
                    items={cityDataSorted as any}
                    onAddCompare={(c: any) => addToCompare(c)}
                    compareSet={compareSet}
                    onHover={(item) => {
                      if (!item) {
                        setHoveredKey(null);
                        setHoverCard(null);
                        return;
                      }
                      const key = `${item.country ?? selected.name}-${item.city}-${item.uni}`;
                      setHoveredKey(key);
                      setHoverCard(null);
                    }}
                    savedSet={savedSet}
                    onToggleSave={(item: any) => toggleSaved(item)}
                  />
                </div>
              </FloatingPanel>
            )}
          </>
        )}


        {isSmall && (
          <BottomSheet
            open={filtersSheetOpen}
            onClose={() => setFiltersSheetOpen(false)}
            title="Filter universities"
            height="72vh"
          >
            <div className="pb-3">
              <MapFiltersBar
                compact
                filters={filters}
                onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
                countries={availableCountries}
                languages={availableLanguages}
                exams={availableExams}
                resultCount={allCityData.length}
                onOpenSaved={() => setSavedOpen(true)}
                onOpenCompare={() => setCompareOpen(true)}
                savedCount={saved.length}
                compareCount={compare.length}
                onViewMobile={handleOpenMobileResults}
                suggestions={searchSuggestions}
                onPick={handleSuggestionPick}
              />
            </div>
          </BottomSheet>
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
        {/* Legacy right-side panel was removed along with data fetching. */}

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
