import { useState, useCallback } from 'react';
import type { Lang } from '../lib/i18n';

const STORAGE_KEY = 'damka_lang';

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') return stored;
  } catch {}
  return 'en';
}

export function useLangState() {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  return { lang, setLang };
}
