'use client';

import { useEffect } from 'react';

type Props = {
  slot: string;
  format?: string;
};

export function AdSense({ slot, format }: Props) {
  if (process.env.NEXT_PUBLIC_ENABLE_ADS !== 'true') {
    return null; // ads disabled
  }

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error', err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
      data-ad-slot={slot}
      data-ad-format={format || 'auto'}
      data-full-width-responsive="true"
    />
  );
}