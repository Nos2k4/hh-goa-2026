import './globals.css';

export const metadata = {
  title: "HH Goa 2026 — Frame & Builder Card",
  description: "Turn your photo into a Hacker House 'Goa' PFP frame or builder ID card and share it to X. #FrameInGoa",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bungee&family=Baloo+2:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.44.0/iconfont/tabler-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
