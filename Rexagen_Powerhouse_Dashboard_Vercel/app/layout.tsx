export const metadata = {
  title: "Rexagen Powerhouse Dashboard",
  description: "Next-gen Sales Ops AI Interface",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

