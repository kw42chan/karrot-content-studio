import type { BlogService } from "@/lib/blog/services";

export function ServiceIcon({ icon }: { icon: BlogService["icon"] }) {
  if (icon === "chat") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        <path d="M9 10h6M9 14h4" />
      </svg>
    );
  }
  if (icon === "workflow") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1.5" />
        <rect x="15" y="15" width="6" height="6" rx="1.5" />
        <path d="M9 6h4a3 3 0 0 1 3 3v6" />
        <path d="M13.5 12.5 16 15l2.5-2.5" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l10-5 10 5-10 5z" />
      <path d="M6 10v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      <path d="M22 8v6" />
    </svg>
  );
}
