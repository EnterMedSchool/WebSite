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
}: {
  id?: string;
  pretitle?: string;
  title: string;
  variant?: Variant;
  bullets?: Array<{ title: string; desc?: string; color?: string }>;
  right: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12 sm:py-16 md:py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-14">
        {/* Left copy */}
        <div className="relative">
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
          className="relative"
        >
          {right}
        </motion.div>
      </div>
    </section>
  );
}

