"use client";

import React from "react";

type Props = {
  className?: string;
  rounded?: boolean | string;
};

export function Skeleton({ className = "", rounded = true }: Props) {
  const r = typeof rounded === "string" ? rounded : rounded ? "rounded" : "";
  return <div className={`animate-pulse bg-gray-200 ${r} ${className}`} />;
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 w-full animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <div className={`inline-block animate-pulse rounded-full bg-gray-200 ${className}`} style={{ width: size, height: size }} />;
}

