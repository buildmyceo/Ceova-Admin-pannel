import React, { useEffect, useRef } from 'react';

export const PortalBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Allow autoplay fallback if browser restricts immediate playback
      });
    }
  }, []);

  return (
    <div className="portal-sky-bg-container" aria-hidden="true">
      <video
        ref={videoRef}
        className="portal-sky-video"
        autoPlay
        loop
        muted
        playsInline
        poster="/images/sky.png"
      >
        <source src="/video/sky.mp4" type="video/mp4" />
      </video>
      <div className="portal-sky-overlay" />
    </div>
  );
};
