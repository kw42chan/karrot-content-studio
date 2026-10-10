import { PostEditor } from "@/components/studio/post-editor";
import {
  DEMO_POST,
  DEMO_SOURCES,
  DEMO_SUGGESTION,
  DEMO_VARIANTS,
} from "@/lib/demo/content";

export default function DemoStudioPage() {
  return (
    <PostEditor
      demoMode
      post={DEMO_POST}
      sources={DEMO_SOURCES}
      variants={DEMO_VARIANTS}
      suggestions={[
        {
          ...DEMO_SUGGESTION,
          channel: "blog",
          label: "Suggested from a new source · AYi tip on App Store payments",
        },
      ]}
      comments={[
        {
          id: "c1",
          body: "Add one sentence on App Store payments near the end.",
          resolved: false,
          created_at: new Date().toISOString(),
        },
      ]}
      versions={[]}
    />
  );
}
