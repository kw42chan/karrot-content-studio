import { StudioAppShell } from "@/components/studio/shell/StudioAppShell";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioAppShell>{children}</StudioAppShell>;
}
