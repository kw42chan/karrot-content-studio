import { PublicPostView } from "@/components/public/post-view";
import { DEMO_PUBLIC_POST, DEMO_PUBLIC_SOURCES } from "@/lib/demo/content";

export default function DemoPostPage() {
  return (
    <PublicPostView post={DEMO_PUBLIC_POST} sources={DEMO_PUBLIC_SOURCES} />
  );
}
