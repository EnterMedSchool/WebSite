export default function ArticleTypographyStyles() {
  return (
    <style jsx global>{`
      .imat-article h1,
      .imat-article h2,
      .imat-article h3,
      .imat-article h4 {
        font-family: var(--font-baloo), "Poppins", "Segoe UI", system-ui, -apple-system, sans-serif;
        color: rgb(30, 41, 59);
      }
      .imat-article h2 {
        font-size: clamp(2rem, 2.6vw + 1.2rem, 2.75rem);
        line-height: 1.15;
        margin-top: 3.5rem;
      }
      .imat-article h3 {
        font-size: clamp(1.6rem, 1.4vw + 1rem, 2.15rem);
        line-height: 1.2;
        margin-top: 2.75rem;
      }
      .imat-article p {
        color: rgb(71, 85, 105);
      }
      .imat-article a {
        color: rgb(79, 70, 229);
        font-weight: 600;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 6px;
        transition: color 0.2s ease;
      }
      .imat-article a:hover {
        color: rgb(55, 48, 163);
      }
      .imat-article .cards {
        display: grid;
        gap: 1.5rem;
        margin: 2.75rem 0;
      }
      @media (min-width: 768px) {
        .imat-article .cards {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      .imat-article .card {
        border-radius: 1.5rem;
        padding: 1.6rem;
        background: linear-gradient(180deg, rgba(79, 70, 229, 0.08), rgba(14, 165, 233, 0.08));
        box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
        border: 1px solid rgba(79, 70, 229, 0.18);
      }
      .imat-article .card h4 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: rgb(30, 41, 59);
      }
      .imat-article .card .more {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.95rem;
        color: rgb(79, 70, 229);
        text-decoration: none;
      }
      .imat-article .card .more::after {
        content: ">";
        font-size: 0.9rem;
      }
      .imat-article table {
        border-radius: 1.25rem;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
      }
      .imat-article table thead {
        background: linear-gradient(90deg, rgba(37, 99, 235, 0.12), rgba(45, 212, 191, 0.12));
      }
      .imat-article table th,
      .imat-article table td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.25);
      }
      .imat-article table tbody tr:nth-child(odd) {
        background-color: rgba(148, 163, 184, 0.08);
      }
      .imat-article .backtop a {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border-radius: 9999px;
        padding: 0.4rem 0.9rem;
        background: rgba(79, 70, 229, 0.12);
        color: rgb(79, 70, 229);
        text-decoration: none;
      }
    `}</style>
  );
}
