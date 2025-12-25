import { useEffect, useMemo, useRef, useState } from "react";
import { DofusItem } from "@/types/dofus";
import { searchLocalItems } from "@/lib/localDataClient";

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 50;

export interface UseItemsSearchParams {
  query: string;
  craftableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export function useItemsSearch({ query, craftableOnly = true, page = 1, pageSize = PAGE_SIZE }: UseItemsSearchParams) {
  const [items, setItems] = useState<DofusItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveQuery = query.trim();
  const minQueryMet = effectiveQuery.length >= 2;

  const fetchItems = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);
    setIsOfflineFallback(false);

    try {
      if (!minQueryMet) {
        setItems([]);
        setHasMore(false);
        return;
      }
      const results = await searchLocalItems({ query: effectiveQuery, craftableOnly });
      setItems(results);
      setHasMore(false);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setItems([]);
      setIsOfflineFallback(true);
      setError("Impossible de charger les données locales.");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchItems, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveQuery, craftableOnly, page, pageSize]);

  const state = useMemo(
    () => ({ items, isLoading, error, hasMore, isOfflineFallback, minQueryMet }),
    [items, isLoading, error, hasMore, isOfflineFallback, minQueryMet],
  );

  return state;
}
