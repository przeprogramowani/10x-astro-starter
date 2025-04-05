import { Rocket, type LucideIcon } from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  description?: string;
  items?: NavigationItem[];
}

export interface NavigationConfig {
  items: NavigationItem[];
  logo?: {
    icon: LucideIcon;
    size?: number;
  };
}

export const defaultNavigation: NavigationConfig = {
  items: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Features",
      href: "/features",
      description: "Take your app to the next level with our advanced features",
      items: [
        {
          title: "Analytics",
          href: "/features/analytics",
          description: "Track your app's performance and user behavior",
        },
        {
          title: "Security",
          href: "/features/security",
          description: "Keep your data safe and secure",
        },
      ],
    },
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "About",
      href: "/about",
    },
  ],
  logo: {
    icon: Rocket,
    size: 24,
  },
};
