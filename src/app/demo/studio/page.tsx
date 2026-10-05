import { PostEditor } from "@/components/studio/post-editor";
import {
  DEMO_POST,
  DEMO_SOURCES,
  DEMO_SUGGESTION,
} from "@/lib/demo/content";

export default function DemoStudioPage() {
  return (
    <PostEditor
      demoMode
      post={DEMO_POST}
      sources={DEMO_SOURCES}
      suggestions={[
        {
          ...DEMO_SUGGESTION,
          label: "Suggested from a new source · AYi tip on App Store payments",
        },
      ]}
      versions={[]}
    />
  );
}
