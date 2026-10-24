import { useState } from 'react';

interface HomePhotoProps {
  /** File under `frontend/public/home-photos/`, e.g. `/home-photos/hero.jpg`. */
  src: string;
  alt: string;
  className?: string;
  /** Load straight away (use for the photo at the top of the page). */
  priority?: boolean;
}

/**
 * A home page photo. If the file is missing or fails to load, it shows a quiet curtain-fold
 * pattern instead of a broken image, so the layout holds up while photos are being added.
 */
export default function HomePhoto({ src, alt, className = '', priority = false }: HomePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          backgroundColor: '#1d323c',
          backgroundImage:
            'linear-gradient(160deg, rgba(168,64,15,0.28) 0%, rgba(20,35,43,0) 55%), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 26px, rgba(255,255,255,0) 26px 52px)',
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  );
}
