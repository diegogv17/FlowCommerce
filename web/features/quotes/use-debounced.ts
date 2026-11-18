'use client';

import { useEffect, useState } from 'react';

/** Retrasa un valor (búsquedas) para no pedir a la API en cada tecla. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}
