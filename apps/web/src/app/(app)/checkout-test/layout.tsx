import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout de teste",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function CheckoutTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
