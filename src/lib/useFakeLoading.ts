import { useEffect, useState } from 'react';

/** Shows a skeleton briefly on first mount so screens feel "fetched". */
export function useFakeLoading(ms = 450): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
