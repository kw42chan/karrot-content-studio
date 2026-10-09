export type BlogService = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: "chat" | "workflow" | "training";
  sample: boolean;
};

export const BLOG_SERVICES: BlogService[] = [
  {
    id: "consultancy",
    title: "AI consultancy",
    description: "Find where AI actually saves your team time, and pick tools that stay reliable.",
    href: "#services",
    icon: "chat",
    sample: true,
  },
  {
    id: "automation",
    title: "AI workflow automation",
    description: "Connect your apps and AI agents so repetitive admin runs on its own.",
    href: "#services",
    icon: "workflow",
    sample: true,
  },
  {
    id: "training",
    title: "Content & AI training",
    description: "Hands-on workshops so your team can create content with AI confidently.",
    href: "#services",
    icon: "training",
    sample: true,
  },
];
