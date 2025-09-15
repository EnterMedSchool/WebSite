type JsonLdProps = {
  id?: string;
  data: Record<string, any> | Record<string, any>[];
};

export default function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script
      key={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

