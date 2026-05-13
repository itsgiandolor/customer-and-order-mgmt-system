import "./globals.css";
import { CartProvider } from "../context/CartContext";
import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}