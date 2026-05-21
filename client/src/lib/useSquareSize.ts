import { useState, useEffect } from 'react';

export function useSquareSize(maxSq = 56, is3DOrPadding: boolean | number = false): number {
  const calc = () => {
    const isMobile = window.innerWidth < 640;
    let padding: number;
    if (typeof is3DOrPadding === 'number') {
      padding = is3DOrPadding;
    } else {
      const is3D = is3DOrPadding;
      padding = isMobile ? (is3D ? 40 : 16) : (is3D ? 72 : 36);
    }
    const availableWidth = isMobile ? window.innerWidth : 640;
    return Math.max(32, Math.min(maxSq, Math.floor((availableWidth - padding) / 8)));
  };

  const [sq, setSq] = useState(calc);

  useEffect(() => {
    setSq(calc());
  }, [is3DOrPadding]);

  useEffect(() => {
    const onResize = () => setSq(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [is3DOrPadding]);

  return sq;
}

