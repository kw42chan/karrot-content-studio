import { PublicPostView } from "@/components/public/post-view";

export default function DemoPostPage() {
  return (
    <PublicPostView
      post={{
        title: "Claude Account Bans: Hong Kong Creators' Shared Playbook",
        slug: "demo",
        my_take:
          "Hong Kong teams using Claude are not fighting a single “bad VPN” story. Network, device, and payment need to be designed as one stack.",
        body: `## What three creators actually found

Three public write-ups from Hong Kong-linked creators describe overlapping patterns.

## Sources

1. **MagicPower** on X`,
        published_at: new Date().toISOString(),
        body_language: "en",
      }}
      sources={[
        {
          author: "MagicPower",
          title: "Banned by Claude six times",
          url: "https://x.com/MagicPower21M/status/2106653640588927234",
          platform: "x",
        },
      ]}
    />
  );
}
