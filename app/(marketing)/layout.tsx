import { Syne } from "next/font/google";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${syne.variable} marketing-shell relative min-h-screen bg-background`}
    >
      {children}
    </div>
  );
}
