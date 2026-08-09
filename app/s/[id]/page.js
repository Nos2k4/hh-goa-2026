export async function generateMetadata({ searchParams }) {
  const img = searchParams.img || '';
  const cap = searchParams.cap || "Hacker House 'Goa' 2026";

  return {
    title: cap,
    description: 'Shared from the HH Goa 2026 frame & builder card generator.',
    openGraph: {
      title: cap,
      description: '#FrameInGoa',
      images: img ? [{ url: img, width: 1024, height: 1024 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: cap,
      images: img ? [img] : [],
    },
  };
}

export default function SharePage({ searchParams }) {
  const img = searchParams.img;
  const cap = searchParams.cap || "Hacker House 'Goa' 2026";

  return (
    <div className="share-page">
      <h1>Hacker House &apos;गोवा&apos;</h1>
      {img && <img src={img} alt="Shared graphic" />}
      <p>{cap}</p>
      <a className="btn-link" href="/">Make your own →</a>
    </div>
  );
}
