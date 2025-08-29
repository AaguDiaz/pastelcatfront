import { useState, useEffect } from 'react';

function usePaginatedFetch<T>(endpoint: string, pageSize: number) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set('page', String(page));
        url.searchParams.set('pageSize', String(pageSize));
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error('Error fetching data');
        const json = await res.json();
        setData(json.data || []);
      } catch (e) {
        const err = e as Error;
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [endpoint, page, pageSize]);

  const next = () => setPage((p) => p + 1);
  const prev = () => setPage((p) => Math.max(1, p - 1));

  return { data, page, isLoading, error, next, prev };
}

export default usePaginatedFetch;
export { usePaginatedFetch };