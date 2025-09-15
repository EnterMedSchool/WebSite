import JsonLd from "./JsonLd";

export type Crumb = {
  name: string;
  item: string; // absolute URL preferred (will auto-absolute if relative)
};

function abs(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export default function BreadcrumbsJsonLd({
  baseUrl,
  crumbs,
}: {
  baseUrl: string;
  crumbs: Crumb[];
}) {
  const itemListElement = crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: abs(baseUrl, c.item),
  }));
  return (
    <JsonLd
      id="breadcrumbs-jsonld"
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      }}
    />
  );
}

