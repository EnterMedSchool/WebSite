"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL = "/maps/world-110m.json";

type City = {
  uni: string;
  city: string;
  lat: number;
  lng: number;
  exam?: string;
  language?: string;
  trendPoints?: Array<{ year: number; type?: string; score: number }>;
  trendSeats?: Array<{ year: number; type?: string; seats: number }>;
};

type Props = {
  dataset: string;
  countryName: string;
  isoA3?: string;
  center: [number, number];
  zoom: number;
  examTag?: string;
  onOpenMap?: () => void;
};

const latestScore = (city: City) => {
  if (!city.trendPoints?.length) return null;
  return city.trendPoints.reduce<number | null>((acc, point) => {
    if (acc === null) return point.score;
    return Math.max(acc, point.score);
  }, null);
};

const latestSeats = (city: City) => {
  if (!city.trendSeats?.length) return null;
  return city.trendSeats.reduce<number | null>((acc, entry) => {
    if (acc === null) return entry.seats;
    return Math.max(acc, entry.seats);
  }, null);
};

export default function CountrySpotlight({ dataset, countryName, isoA3, center, zoom, examTag, onOpenMap }: Props) {
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    setCities([]);
    fetch(`/map/v1/countries/${dataset}.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load country data");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setCities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setError("Map data is not available right now.");
      });
    return () => {
      active = false;
    };
  }, [dataset]);

  const topCities = useMemo(() => {
    if (!cities.length) return [];
    return [...cities]
      .sort((a, b) => (latestScore(b) ?? 0) - (latestScore(a) ?? 0))
      .slice(0, 5);
  }, [cities]);

  const totalSeats = useMemo(
    () =>
      cities.reduce((acc, city) => {
        const seats = latestSeats(city);
        return acc + (seats ?? 0);
      }, 0),
    [cities],
  );

  const peakScore = useMemo(
    () =>
      cities.reduce((acc, city) => {
        const score = latestScore(city);
        if (score === null) return acc;
        return Math.max(acc, score);
      }, 0),
    [cities],
  );

  const hasData = topCities.length > 0;

  return (
    <section className="rounded-[32px] bg-gradient-to-br from-indigo-600/10 via-white/92 to-white/94 p-6 shadow-[0_22px_60px_rgba(30,64,175,0.18)] ring-1 ring-indigo-100/60 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-500">Stay explorer</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{countryName} spotlight</h2>
          <p className="mt-1 text-sm text-slate-600">
            Navigate {countryName}&apos;s medical schools, compare seat counts, and benchmark the scores you need for this exam.
          </p>
        </div>
        {examTag && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{examTag}</span>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <button
          type="button"
          onClick={onOpenMap}
          className="group relative block w-full overflow-hidden rounded-[28px] border border-indigo-200/70 bg-gradient-to-br from-indigo-600/20 via-indigo-500/15 to-sky-400/20 p-[2px] shadow-[0_18px_48px_rgba(37,99,235,0.18)]"
        >
          <div className="relative rounded-[26px] bg-slate-950/85">
            <div className="absolute left-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-indigo-600 shadow-lg shadow-indigo-400/40 transition group-hover:scale-105">
              ?
            </div>
            <div className="pointer-events-none absolute inset-x-10 bottom-6 z-10 rounded-full bg-[radial-gradient(120%_120%_at_50%_50%,rgba(79,70,229,0.3),transparent)] blur-3xl" />
            <div className="rounded-[26px] bg-[radial-gradient(140%_120%_at_50%_50%,rgba(15,118,110,0.18),transparent)] p-3">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 280 * zoom, center }}
                width={380}
                height={220}
                className="w-full"
              >
                <defs>
                  <radialGradient id="spotlight-country" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="rgba(129,140,248,0.95)" />
                    <stop offset="70%" stopColor="rgba(56,189,248,0.75)" />
                    <stop offset="100%" stopColor="rgba(37,99,235,0.4)" />
                  </radialGradient>
                </defs>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const props = geo.properties as { name?: string; iso_a3?: string };
                      const isTarget =
                        (isoA3 && props.iso_a3 === isoA3) ||
                        props.name?.toLowerCase() === countryName.toLowerCase();
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          stroke="rgba(226,232,240,0.25)"
                          strokeWidth={isTarget ? 0.9 : 0.35}
                          fill={isTarget ? "url(#spotlight-country)" : "rgba(148,163,184,0.12)"}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                {topCities.map((city) => (
                  <Marker key={`${city.uni}-${city.city}`} coordinates={[city.lng, city.lat]}>
                    <g transform="translate(0, -6)">
                      <circle r={4.6} fill="#a855f7" opacity={0.35} />
                      <circle r={3.2} fill="#38bdf8" stroke="#fff" strokeWidth={1.2} className="transition-transform group-hover:scale-110" />
                    </g>
                  </Marker>
                ))}
              </ComposableMap>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-4 text-xs font-semibold text-white">
              <span className="uppercase tracking-[0.28em] text-indigo-200">Live explorer</span>
              <span className="flex items-center gap-1 text-indigo-100">
                Open map
                <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">{"\u2192"}</span>
              </span>
            </div>
          </div>
        </button>

        <div className="grid gap-4 rounded-[26px] bg-white/90 p-5 text-sm text-slate-700 ring-1 ring-slate-200/60">
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold uppercase text-slate-500">
            <div className="rounded-2xl bg-slate-100 px-3 py-2">
              <p className="text-[11px] tracking-[0.18em] text-slate-500">Universities</p>
              <p className="mt-1 text-lg text-slate-900">{cities.length || "—"}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2">
              <p className="text-[11px] tracking-[0.18em] text-slate-500">Top score</p>
              <p className="mt-1 text-lg text-slate-900">{peakScore ? peakScore.toFixed(1) : "—"}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2">
              <p className="text-[11px] tracking-[0.18em] text-slate-500">Seats</p>
              <p className="mt-1 text-lg text-slate-900">{totalSeats ? totalSeats : "—"}</p>
            </div>
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}
          {!error && !hasData && <p className="text-sm text-slate-500">We&apos;re mapping the universities for this exam. Check back soon.</p>}

          {!error && hasData && (
            <ul className="space-y-3">
              {topCities.map((city) => {
                const score = latestScore(city);
                const seats = latestSeats(city);
                return (
                  <li
                    key={`${city.uni}-${city.city}`}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{city.uni}</p>
                      <p className="text-xs text-slate-500">{city.city}{city.language ? ` · ${city.language}` : ""}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      {score !== null && <p className="font-semibold text-indigo-600">Score {score.toFixed(1)}</p>}
                      {seats !== null && <p className="mt-1">Seats {seats}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}


