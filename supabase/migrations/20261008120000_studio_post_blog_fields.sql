-- Blog public fields for /p redesign (studio_ prefix only)

alter table public.studio_posts
  add column if not exists category text check (
    category is null
    or category in ('ai-tools', 'automation', 'account-security', 'case-studies')
  ),
  add column if not exists read_time int,
  add column if not exists excerpt text,
  add column if not exists key_points jsonb,
  add column if not exists cover_url text;

create index if not exists studio_posts_category_idx on public.studio_posts (category);

-- Backfill published posts (Claude guide → account-security, ~4 min read)
update public.studio_posts
set
  category = coalesce(
    category,
    case
      when title ilike '%claude%' or body ilike '%claude%' or body ilike '%Claude%' then 'account-security'
      when title ilike '%harness%' or title ilike '%agent%' then 'automation'
      else 'automation'
    end
  ),
  read_time = coalesce(
    read_time,
    greatest(
      1,
      case
        when body_language = 'zh-HK' then ceil(
          length(regexp_replace(body, '\n## Sources[\s\S]*$', '', 'm'))::numeric / 325
        )
        else ceil(
          (
            select count(*)::numeric
            from regexp_split_to_table(
              regexp_replace(body, '\n## Sources[\s\S]*$', '', 'm'),
              '\s+'
            ) as w
            where w <> ''
          ) / 220
        )
      end
    )
  ),
  excerpt = coalesce(
    nullif(trim(excerpt), ''),
    nullif(trim(meta_description), ''),
    nullif(trim(my_take), '')
  ),
  key_points = coalesce(
    key_points,
    case
      when title ilike '%claude%' or body ilike '%claude帳號%'
      then '[
        {"title":"統一時區設定","subtitle":"台北時間 UTC+8，關閉自動調整"},
        {"title":"獨享住宅 IP","subtitle":"ISP 出口，避免機房 IP"},
        {"title":"啟用 TUN 模式","subtitle":"防止 WebRTC / DNS 洩漏"},
        {"title":"一帳號一設備一瀏覽器","subtitle":"不共用、不接第三方客戶端"},
        {"title":"App Store 付款","subtitle":"循序漸進升級方案"}
      ]'::jsonb
      else key_points
    end
  )
where status = 'published';
