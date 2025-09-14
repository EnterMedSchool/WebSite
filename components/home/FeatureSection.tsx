"use client";

import ShimmerHeading from "@/components/ui/ShimmerHeading";
import { motion } from "framer-motion";

type Variant = "indigo" | "teal" | "amber";

export default function FeatureSection({
  id,
  pretitle = "Feature spotlight",
  title,
  variant = "indigo",
  bullets = [],
  right,
  flip = false,
  tint = "none",
}: {
  id?: string;
  pretitle?: string;
  title: string;
  variant?: Variant;
  bullets?: Array<{ title: string; desc?: string; color?: string }>;
  right: React.ReactNode;
  flip?: boolean;
  tint?: "none" | "indigo" | "teal" | "amber";
}) {
  const tintClass =
    tint === "teal"
      ? "from-teal-300/15 via-cyan-300/10 to-emerald-300/10"
      : tint === "amber"
      ? "from-amber-300/15 via-rose-300/10 to-orange-300/10"
      : tint === "indigo"
      ? "from-indigo-300/15 via-violet-300/10 to-fuchsia-300/10"
      : "from-transparent via-transparent to-transparent";

  return (
    <section
      id={id}
      className="group/section relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12 sm:py-16 md:py-24"
    >
      {/* subtle tinted backdrop per section to reduce repetition */}
      <div className={`pointer-events-none absolute -top-16 right-[-6%] -z-10 h-80 w-80 rounded-full bg-gradient-to-br ${tintClass} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-10 left-[-6%] -z-10 h-72 w-72 rounded-full bg-gradient-to-tr ${tintClass} blur-3xl`} />

      <div className={`mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-14`}>
        {/* Left copy */}
        <div className={`relative ${flip ? "order-2 md:order-1" : "order-1"}`}>
          <ShimmerHeading pretitle={pretitle} title={title} variant={variant as any} size="lg" />

          <ul className="mt-6 space-y-5">
            {bullets.map((b, i) => (
              <motion.li
                key={b.title}
                initial={{ x: -40, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: "spring", stiffness: 90, damping: 16, delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <span
                  className={`mt-1 inline-grid h-7 w-7 place-items-center rounded-full text-xs font-black text-white ${
                    b.color || "bg-gradient-to-tr from-indigo-600 to-fuchsia-600"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">{b.title}</div>
                  {b.desc && (
                    <div className="text-sm text-slate-600 dark:text-slate-300">{b.desc}</div>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Right demo */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className={`relative ${flip ? "order-1 md:order-2" : "order-2"}`}
        >
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(480px_140px_at_70%_0%,rgba(0,0,0,0.08),transparent)]" />
          <div className="transition-transform duration-300 ease-out will-change-transform group-hover/section:[transform:perspective(900px)_rotateX(1.5deg)_rotateY(-1.5deg)]">
            {right}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
