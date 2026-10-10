import { PostEditor } from "@/components/studio/post-editor";
import {
  DEMO_POST,
  DEMO_SOURCES,
  DEMO_VARIANTS,
} from "@/lib/demo/content";

export default function DemoStudioZhPage() {
  return (
    <PostEditor
      demoMode
      initialChannel="instagram"
      initialLocale="zh-HK"
      post={DEMO_POST}
      sources={DEMO_SOURCES}
      suggestions={[]}
      comments={[]}
      variants={DEMO_VARIANTS}
      versions={[]}
    />
  );
}
