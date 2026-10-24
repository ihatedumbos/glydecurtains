import { useCallback, useState } from 'react';

export type HomeDesign = 'new' | 'classic';

const KEY = 'glyde-home-design';

function read(): HomeDesign {
  try {
    return window.localStorage.getItem(KEY) === 'new' ? 'new' : 'classic';
  } catch {
    return 'classic';
  }
}

/** Which home page design the visitor sees. Remembered in this browser when storage allows it. */
export function useHomeDesign(): [HomeDesign, (next: HomeDesign) => void] {
  const [design, setDesign] = useState<HomeDesign>(read);

  const choose = useCallback((next: HomeDesign) => {
    setDesign(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* Storage blocked: the choice still applies until the page is closed. */
    }
  }, []);

  return [design, choose];
}
