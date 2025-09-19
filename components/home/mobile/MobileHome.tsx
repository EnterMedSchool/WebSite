import dynamic from "next/dynamic";
import Link from "next/link";

import HomeBackdrop from "@/components/home/HomeBackdrop";
import styles from "./mobile-home.module.css";

const MissionShowcaseDynamic = dynamic(() => import("@/components/home/MissionShowcase"), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingCard}>
      <span className={styles.loadingDot} />
      <span>Loading mission highlight...</span>
    </div>
  ),
});

const focusPills = [
  "Lessons",
  "Cases",
  "Admissions",
  "Community",
  "Flashcards",
  "Live rooms",
];

const heroStats = [
  { label: "Streak", value: "5 days", meta: "Keep it alive" },
  { label: "IMAT plan", value: "On track", meta: "Mock exam Fri" },
  { label: "Cases cleared", value: "12", meta: "+2 this week" },
  { label: "Mentor replies", value: "3", meta: "New insights" },
];

type QuickAction = {
  title: string;
  copy: string;
  href: string;
  badge: string;
  meta: string;
};

const quickActions: QuickAction[] = [
  {
    title: "Resume endocrine lesson",
    copy: "Finish the regulation checkpoint in fifteen minutes.",
    href: "/lesson/discover",
    badge: "15 min left",
    meta: "Lesson 4 of 6",
  },
  {
    title: "Continue hypercortisolism case",
    copy: "You are at the management decision stage.",
    href: "/cases",
    badge: "Stage 4",
    meta: "Score 62 / 80",
  },
  {
    title: "Update admissions plan",
    copy: "Check upcoming deadlines and seat trends.",
    href: "/imat-planner",
    badge: "2 tasks due",
    meta: "Next step: documents",
  },
];

type HighlightAccent = "indigo" | "violet" | "sky";

const highlightDeck: Array<{
  title: string;
  copy: string;
  metric: string;
  href: string;
  accent: HighlightAccent;
}> = [
  {
    title: "Adaptive lessons",
    copy: "Micro sessions, spaced reminders, and touch friendly notes.",
    metric: "128 lessons refreshed",
    href: "/lesson/discover",
    accent: "indigo",
  },
  {
    title: "Branching cases",
    copy: "Practice real clinical arcs with rapid feedback on every tap.",
    metric: "+6 new endocrinology paths",
    href: "/cases",
    accent: "violet",
  },
  {
    title: "Live community",
    copy: "Drop into mentor rooms, study jams, and admissions clinics.",
    metric: "18 sessions this week",
    href: "/course-mates",
    accent: "sky",
  },
];

const mapSpotlights = [
  {
    name: "University of Pavia",
    city: "Pavia, Italy",
    seats: 140,
    trend: "+2 vs 2023",
    highlight: "Last admitted score: 42.3",
    tags: ["Public", "English track"],
  },
  {
    name: "Humanitas University",
    city: "Milan, Italy",
    seats: 150,
    trend: "+5 vs 2023",
    highlight: "Scholarship window closes in nine days",
    tags: ["Private", "Scholarships"],
  },
  {
    name: "La Sapienza",
    city: "Rome, Italy",
    seats: 80,
    trend: "Stable",
    highlight: "Cut off 41.6, strong biology weighting",
    tags: ["Public", "High competition"],
  },
];

const timelineSteps: Array<{
  title: string;
  detail: string;
  status: "complete" | "active" | "upcoming";
}> = [
  {
    title: "Warm up review",
    detail: "Ten endocrine flashcards",
    status: "complete",
  },
  {
    title: "Case practice",
    detail: "Finish hypercortisolism stage",
    status: "active",
  },
  {
    title: "Admissions check",
    detail: "Upload translated transcripts",
    status: "upcoming",
  },
  {
    title: "Community sync",
    detail: "Join Friday mentor AMA",
    status: "upcoming",
  },
];

const communityStories = [
  {
    name: "Sara B.",
    role: "IMAT 2023",
    blurb: "Shared her pacing strategy in this week clinic replay.",
    href: "/course-mates",
  },
  {
    name: "Kumar",
    role: "Study lead",
    blurb: "Hosting a live lab interpretation room on Saturday.",
    href: "/course-mates",
  },
  {
    name: "Amina",
    role: "Mentor",
    blurb: "Answered your question about timeline trade offs.",
    href: "/course-mates",
  },
];

const reviewCards = [
  {
    quote: "The mobile flow keeps my streak alive on commutes. Cases feel like a mini game but with real learning.",
    author: "Giulia",
    detail: "IMAT admit, 2023 cohort",
  },
  {
    quote: "Admissions tasks, lessons, and community nudges all live in one place. It is the only app I pin to my dock.",
    author: "Noah",
    detail: "First year med student",
  },
];

function greetingMessage() {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function MobileHome() {
  const greeting = greetingMessage();

  return (
    <>
      <HomeBackdrop />
      <div className={styles.screen}>
        <header className={styles.appBar}>
          <div>
            <p className={styles.appBarLabel}>Mobile beta</p>
            <p className={styles.appBarTitle}>{greeting}, explorer.</p>
          </div>
          <Link href="/dashboard" className={styles.appBarLink}>
            Dashboard
          </Link>
        </header>

        <section className={styles.hero}>
          <div>
            <p className={styles.heroTag}>Today flow</p>
            <h1 className={styles.heroTitle}>EnterMedSchool on the move.</h1>
            <p className={styles.heroCopy}>
              Pick up where you left off, stay ahead on admissions, and never lose your streak.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/lesson/discover" className={styles.ctaPrimary}>
              Resume studying
            </Link>
            <Link href="/imat-planner" className={styles.ctaSecondary}>
              Plan admissions
            </Link>
          </div>
          <div className={styles.statsGrid}>
            {heroStats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statMeta}>{stat.meta}</span>
              </div>
            ))}
          </div>
          <div className={styles.pillRow}>
            {focusPills.map((pill) => (
              <span key={pill} className={styles.pill}>
                {pill}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Shortcuts</p>
              <h2 className={styles.sectionTitle}>Tap into your next win</h2>
            </div>
            <Link href="/study" className={styles.sectionLink}>
              View all
            </Link>
          </header>
          <div className={styles.quickGrid}>
            {quickActions.map((item) => (
              <Link key={item.title} href={item.href} className={styles.quickCard}>
                <div className={styles.quickBadge}>{item.badge}</div>
                <h3 className={styles.quickTitle}>{item.title}</h3>
                <p className={styles.quickCopy}>{item.copy}</p>
                <p className={styles.quickMeta}>{item.meta}</p>
                <span className={styles.quickArrow}>Go</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Guided modules</p>
              <h2 className={styles.sectionTitle}>Built for touch first learning</h2>
            </div>
            <Link href="/lesson/discover" className={styles.sectionLink}>
              Browse lessons
            </Link>
          </header>
          <div className={styles.highlightGrid}>
            {highlightDeck.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`${styles.highlightCard} ${styles[`highlightCard_${item.accent}`]}`}
              >
                <p className={styles.highlightMetric}>{item.metric}</p>
                <h3 className={styles.highlightTitle}>{item.title}</h3>
                <p className={styles.highlightCopy}>{item.copy}</p>
                <span className={styles.cardLink}>Open</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Mission</p>
              <h2 className={styles.sectionTitle}>Prep anywhere, stay inspired</h2>
            </div>
            <Link href="/course" className={styles.sectionLink}>
              Explore courses
            </Link>
          </header>
          <div className={styles.glassCard}>
            <MissionShowcaseDynamic poster="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png" />
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Admissions intel</p>
              <h2 className={styles.sectionTitle}>Spotlight universities</h2>
            </div>
            <Link href="/course-mates" className={styles.sectionLink}>
              Compare all
            </Link>
          </header>
          <div className={styles.scrollRow}>
            {mapSpotlights.map((item) => (
              <article key={item.name} className={`${styles.scrollCard} ${styles.mapCard}`}>
                <div>
                  <span className={styles.cardBadge}>{item.city}</span>
                  <h3 className={styles.cardTitle}>{item.name}</h3>
                  <p className={styles.cardCopy}>{item.highlight}</p>
                </div>
                <div className={styles.mapMeta}>
                  <span>{item.seats} seats</span>
                  <span>{item.trend}</span>
                </div>
                <div className={styles.chipRow}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.chip}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/course-mates" className={styles.cardLink}>
                  Compare
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Daily plan</p>
              <h2 className={styles.sectionTitle}>Stay locked into your rhythm</h2>
            </div>
          </header>
          <ol className={styles.timeline}>
            {timelineSteps.map((step) => (
              <li
                key={step.title}
                className={`${styles.timelineItem} ${styles[`timelineItem_${step.status}`]}`}
              >
                <div className={styles.timelineMarker}>
                  <span />
                </div>
                <div>
                  <p className={styles.timelineTitle}>{step.title}</p>
                  <p className={styles.timelineDetail}>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Community</p>
              <h2 className={styles.sectionTitle}>Mentors and peers on standby</h2>
            </div>
            <Link href="/course-mates" className={styles.sectionLink}>
              Join a room
            </Link>
          </header>
          <div className={styles.scrollRow}>
            {communityStories.map((story) => (
              <Link key={story.name} href={story.href} className={`${styles.scrollCard} ${styles.communityCard}`}>
                <div className={styles.avatar}>{story.name[0]}</div>
                <div className={styles.communityCopy}>
                  <p className={styles.communityName}>{story.name}</p>
                  <p className={styles.communityRole}>{story.role}</p>
                  <p className={styles.communityBlurb}>{story.blurb}</p>
                </div>
                <span className={styles.cardLink}>Open</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Learner notes</p>
              <h2 className={styles.sectionTitle}>What keeps med hopefuls motivated</h2>
            </div>
          </header>
          <div className={styles.reviewGrid}>
            {reviewCards.map((card) => (
              <article key={card.author} className={styles.reviewCard}>
                <p className={styles.reviewQuote}>&quot;{card.quote}&quot;</p>
                <p className={styles.reviewAuthor}>{card.author}</p>
                <p className={styles.reviewDetail}>{card.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.switcher}>
            <p className={styles.switcherTitle}>Need the full layout?</p>
            <p className={styles.switcherCopy}>Flip to the desktop experience for dashboards and deep analytics.</p>
            <Link href="/?platform=desktop" className={styles.switcherButton}>
              Switch to desktop
            </Link>
          </div>
        </section>
      </div>

      <nav className={styles.bottomNav} aria-label="Primary mobile navigation">
        <Link href="/study" className={`${styles.navButton} ${styles.navButtonActive}`}>
          <span className={styles.navIcon}>S</span>
          <span className={styles.navLabel}>Study</span>
        </Link>
        <Link href="/cases" className={styles.navButton}>
          <span className={styles.navIcon}>C</span>
          <span className={styles.navLabel}>Cases</span>
        </Link>
        <Link href="/course-mates" className={styles.navButton}>
          <span className={styles.navIcon}>A</span>
          <span className={styles.navLabel}>Admissions</span>
        </Link>
        <Link href="/dashboard" className={styles.navButton}>
          <span className={styles.navIcon}>M</span>
          <span className={styles.navLabel}>More</span>
        </Link>
      </nav>
    </>
  );
}
