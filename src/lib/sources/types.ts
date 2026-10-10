export type SourceReadResult = {
  title: string | null;
  author: string | null;
  text: string;
  published_at: string | null;
  url: string;
  full_text: boolean;
};

export type BilingualSummary = {
  en: {
    headline: string;
    summary: string;
    points: string[];
  };
  zh: {
    headline: string;
    summary: string;
    points: string[];
  };
};
