import { StudioAppShell } from "@/components/studio/shell/StudioAppShell";

export default function DemoStudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioAppShell demoMode>{children}</StudioAppShell>;
}
