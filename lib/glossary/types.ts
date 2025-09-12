export type GlossaryPreview = {
  id: string;
  title: string;
  definition?: string;
  primary_tag?: string;
  tags?: string[];
  image?: { src: string; alt?: string };
};

export type GlossaryShard = {
  v: 1;
  shard: string; // 'a'..'z' or '0'
  forms: [string, string[]][]; // [normalized surface, [termIds]]
};

export type GlossaryManifest = {
  version: string;
  updatedAt: string;
  countTerms: number;
  countForms: number;
  shards: string[]; // available shard keys
};

export type HighlightMatch = {
  surface: string;
  ids: string[];
};

