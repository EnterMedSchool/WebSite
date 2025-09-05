"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ITALY_SVG = "https://entermedschool.b-cdn.net/wp-content/uploads/2024/04/italy_map.svg";

export default function UniversitiesMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`text-sm font-semibold uppercase tracking-wide text-white/90 hover:text-white px-1 py-1 ${
          open ? "opacity-100" : ""
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Universities
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 pt-3">
          <div className="mx-auto max-w-6xl rounded-2xl border bg-white p-4 shadow-2xl">
            <div className="grid grid-cols-12 gap-4">
              {/* Left: country image */}
              <div className="col-span-12 rounded-lg bg-indigo-50 p-3 sm:col-span-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ITALY_SVG} alt="Italy" className="h-64 w-full rounded-md object-contain" />
              </div>

              {/* Middle: exam selector */}
              <div className="col-span-12 sm:col-span-3">
                <div className="space-y-2">
                  <div className="rounded-xl bg-indigo-50 px-4 py-3 font-semibold text-indigo-700">🇮🇹 IMAT</div>
                  {/* Future: other exams could be added here */}
                </div>
              </div>

              {/* Right: universities by region */}
              <div className="col-span-12 sm:col-span-5">
                <h3 className="mb-2 text-lg font-bold tracking-wide text-gray-800">Italy</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-semibold text-gray-700">North</div>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>Turin</li>
                      <li>Pavia</li>
                      <li>Parma</li>
                      <li>Padova</li>
                      <li>Milano Statale</li>
                      <li>Milano Bicocca</li>
                      <li>Bologna</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Center</div>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>Tor Vergata</li>
                      <li>Ancona (M.D. & Tech)</li>
                      <li>La Sapienza</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">South</div>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>Luigi Vanvitelli</li>
                      <li>Federico II</li>
                      <li>Messina</li>
                      <li>Bari Aldo Moro</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="#"
                    className="inline-flex items-center rounded-xl bg-indigo-50 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    Universities in Italy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

