import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Editor", template: "%s · Editor" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-svh bg-ivory text-ink">{children}</div>;
}
