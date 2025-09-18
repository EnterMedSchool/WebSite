import Link from "next/link";
import styles from "./mobile-home.module.css";

const focusPills = ["Lessons", "Cases", "Study groups", "Admissions"];
const quickCards = [
  {
    title: "Study streak",
    copy: "Keep your daily rhythm with short sessions tailored for touch.",
  },
  {
    title: "Clinical cases",
    copy: "Practice on-the-go with tappable checklists and rapid feedback.",
  },
  {
    title: "Community",
    copy: "Drop into live rooms, ask questions, and get nudges from mentors.",
  },
];

export default function MobileHome() {
  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <p className={styles.sectionLabel}>Welcome back</p>
        <h1 className={styles.heroTitle}>EnterMedSchool in your pocket</h1>
        <p className={styles.heroCopy}>
          Jump into the next bite-sized lesson, track your admissions plan, and keep your streaks alive from anywhere.
        </p>
        <div className={styles.pills}>
          {focusPills.map((pill) => (
            <span key={pill} className={styles.pill}>
              {pill}
            </span>
          ))}
        </div>
        <Link href="/lesson/discover" className={styles.heroCta}>
          Resume studying
        </Link>
      </section>

      <section>
        <p className={styles.sectionLabel}>Today&apos;s focus</p>
        <div className={styles.scrollRow}>
          {quickCards.map((card) => (
            <article key={card.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardCopy}>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <nav className={styles.bottomNav} aria-label="Mobile shortcuts">
        <Link href="/study" className={`${styles.navButton} ${styles.navButtonActive}`}>
          <span>Study</span>
          <span className={styles.navDot} />
        </Link>
        <Link href="/cases" className={styles.navButton}>
          <span>Cases</span>
        </Link>
        <Link href="/community" className={styles.navButton}>
          <span>Community</span>
        </Link>
      </nav>

      <p className={styles.footerNote}>Mobile beta - tap the desktop switcher to return to the full experience.</p>
    </div>
  );
}

