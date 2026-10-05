import type { EditorPost, EditorSource, EditorSuggestion } from "@/components/studio/post-editor";

export const DEMO_POST: EditorPost = {
  id: "demo",
  title: "Claude 封號：香港創作者的共用對策",
  slug: "claude-bans-hk-creators-playbook",
  status: "draft",
  my_take:
    "對香港創作者來說，真正關鍵不是「找一個更貴的 VPN」，而是把裝置、支付方式、使用習慣和網絡來源當成同一套防線。以下三篇來自本地創作者的經驗，剛好互相補足。",
  body: `最近幾位香港 AI 創作者陸續分享被 Claude 封號的經歷。MagicPower 連續被封六次後，改用美國伺服器再接 AT&T 住宅網絡，之後就沒有再被封。AYi 則把防線拆成環境、支付、使用行為和設定四層，強調一個裝置只用一個帳號、以 App Store 付款，並把時區設為台北。

BrewBytes 則指出，問題未必是「用了 VPN」這麼簡單，Claude 會綜合判斷整套裝置與網絡環境。三篇合起來的方向很接近：不要只換工具，要整套重設。

## Sources

1. **MagicPower** on X — Banned by Claude six times, and the fix that worked (https://x.com/MagicPower21M/status/2106653640588927234)
2. **AYi** on X — A full guide to avoiding Claude bans (https://x.com/AYi_AInotes/status/2106639522586829094)
3. **BrewBytes** on Threads — Are Hong Kong bans really about your VPN? (https://www.threads.com/share/EtCKem4fj/)`,
  body_language: "zh-HK",
  key_point:
    "香港創作者把網絡、裝置與付款當成一套系統，而不只是換 VPN。",
  social_captions: {
    zh: "Claude 封號：香港創作者實戰整理\n\n網絡、裝置、付款要一齊設計。",
    en: "Claude bans: what HK creators are actually doing\n\nNetwork, device, and payment as one stack.",
  },
  kit_broadcast_id: null,
};

export const DEMO_SOURCES: EditorSource[] = [
  {
    id: "s1",
    author: "MagicPower",
    title: "Banned by Claude six times",
    url: "https://x.com/MagicPower21M/status/2106653640588927234",
    platform: "x",
    full_text: true,
    summary_zh: {
      headline: "連續六次被Claude封號後的最終解決方案",
      summary:
        "作者在被封號六次後，透過搭建搬瓦工VPS加AT&T美國住宅IP的雙層網絡，成功避免再被封號。",
      points: [],
    },
    summary_en: {
      headline: "how to avoid claude account bans with a dual-layer network setup",
      summary:
        "After being banned six times, the author built a reliable network using a US VPS and static residential IP to access Claude without getting blocked.",
      points: [],
    },
  },
  {
    id: "s2",
    author: "AYi",
    title: "Claude account protection guide for 2026",
    url: "https://x.com/AYi_AInotes/status/2106639522586829094",
    platform: "x",
    full_text: true,
    summary_zh: {
      headline: "2026年Claude防封實用指南",
      summary:
        "文章詳述如何透過環境、支付、使用行為及設定四層防線，保護Claude帳號免遭封禁。",
      points: [],
    },
    summary_en: {
      headline: "Claude account protection guide for 2026",
      summary:
        "A detailed guide explains how to protect Claude accounts from being banned by managing environment, payment, behavior, and settings.",
      points: [],
    },
  },
  {
    id: "s3",
    author: "BrewBytes",
    title: "Claude blocks HK users",
    url: "https://www.threads.com/share/EtCKem4fj/",
    platform: "threads",
    full_text: false,
    summary_zh: {
      headline: "Claude 大規模封香港用戶 真係因為你個 VPN唔乾淨",
      summary:
        "Claude 封鎖香港用戶並非單因使用 VPN，而是綜合分析裝置及網絡環境所致。",
      points: [],
    },
    summary_en: {
      headline: "claude blocks hk users why vpn not clean",
      summary:
        "Claude blocks Hong Kong users not just because of VPN use but due to overall device and network environment.",
      points: [],
    },
  },
];

export const DEMO_SUGGESTION: EditorSuggestion = {
  id: "sug1",
  paragraph:
    "另外，用 App Store 付款而不是虛擬卡，可以減少帳號被判定為異常的機會。這點和 MagicPower 的網絡設定是分開的，兩者一起用會更穩。",
  source_id: "s2",
};

export const DEMO_PUBLIC_POST = {
  title: "Claude Account Bans: Hong Kong Creators' Shared Playbook",
  slug: "claude-bans-hk-creators-playbook",
  my_take:
    "Hong Kong teams using Claude are not fighting a single “bad VPN” story. Network, device, and payment need to be designed as one stack.",
  body: DEMO_POST.body,
  published_at: new Date().toISOString(),
  body_language: "zh-HK",
};

export const DEMO_PUBLIC_SOURCES = DEMO_SOURCES.map((s) => ({
  author: s.author,
  title: s.title,
  url: s.url,
  platform: s.platform,
}));
