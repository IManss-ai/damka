import { useState, useEffect } from 'react';

export function useSquareSize(maxSq = 56, padding = 24): number {
  const calc = () => Math.max(36, Math.min(maxSq, Math.floor((Math.min(window.innerWidth, 640) - padding) / 8)));
  const [sq, setSq] = useState(calc);
  useEffect(() => {
    const onResize = () => setSq(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return sq;
}
