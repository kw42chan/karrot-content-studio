-- Optional SEO fields for blog channel settings
alter table public.studio_posts
  add column if not exists seo_title text,
  add column if not exists meta_description text;
