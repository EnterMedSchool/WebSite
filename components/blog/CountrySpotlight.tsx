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
};

type RenderGeography = {
  rsmKey: string;
  properties?: { name?: string; iso_a3?: string } & Record<string, unknown>;
} & Record<string, unknown>;

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

export default function CountrySpotlight({ dataset, countryName, isoA3, center, zoom, examTag }: Props) {
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
      .slice(0, 6);
  }, [cities]);

  const hasData = topCities.length > 0;

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">{countryName} Spotlight</h2>
          <p className="mt-2 text-sm text-slate-600">
            Explore the key universities offering programmes relevant to this guide{examTag ? `, focused on ${examTag}.` : "."}
          </p>
        </div>
        {examTag && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{examTag}</span>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl bg-slate-900/5 p-3">
        <div className="relative isolate overflow-hidden rounded-[26px] bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 280 * zoom, center }}
            width={320}
            height={200}
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
              {({ geographies }: { geographies: RenderGeography[] }) =>
                geographies.map((geo) => {
                  const props = (geo.properties ?? {}) as { name?: string; iso_a3?: string };
                  const isTarget =
                    (isoA3 && props.iso_a3 === isoA3) ||
                    props.name?.toLowerCase() === countryName.toLowerCase();
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      stroke="rgba(226,232,240,0.4)"
                      strokeWidth={isTarget ? 0.8 : 0.35}
                      fill={isTarget ? "url(#spotlight-country)" : "rgba(148,163,184,0.08)"}
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
                  <circle r={3.2} fill="#38bdf8" stroke="#fff" strokeWidth={1.2} />
                </g>
              </Marker>
            ))}
          </ComposableMap>
          <div className="pointer-events-none absolute inset-x-6 bottom-4 rounded-full bg-gradient-to-r from-indigo-400/40 via-transparent to-sky-400/40 blur-3xl" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {error && (
          <p className="text-sm text-rose-500">{error}</p>
        )}
        {!error && !hasData && (
          <p className="text-sm text-slate-500">We&apos;re mapping the universities for this exam. Check back soon.</p>
        )}
        {!error && hasData && (
          <ul className="space-y-3">
            {topCities.map((city) => {
              const score = latestScore(city);
              const seats = latestSeats(city);
              return (
                <li
                  key={`${city.uni}-${city.city}`}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{city.uni}</p>
                    <p className="text-xs text-slate-600">{city.city}{city.language ? ` \u00B7 ${city.language}` : ""}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    {score !== null && (
                      <p className="font-semibold text-indigo-600">Score {score.toFixed(1)}</p>
                    )}
                    {seats !== null && (
                      <p className="mt-1">Seats {seats}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

