import { useCallback, useEffect, useRef, useState } from "react";
import { PriceHistoryEntry } from "@/types/dofus";
import { getLocalResourceAliases } from "@/lib/localDataClient";

const RESOURCE_KEY = (server: string, dataset: "20" | "129") => `dofinvest_prices:${server}:${dataset}:resources`;
const ITEM_KEY = (server: string, dataset: "20" | "129") => `dofinvest_prices:${server}:${dataset}:items`;
const RESOURCE_HISTORY_KEY = (server: string, dataset: "20" | "129") => `dofinvest_price_history:${server}:${dataset}:resources`;
const ITEM_HISTORY_KEY = (server: string, dataset: "20" | "129") => `dofinvest_price_history:${server}:${dataset}:items`;
const MAX_HISTORY_ENTRIES = 200;

type PricesMap = Record<string, number>;
type PriceHistoryMap = Record<string, PriceHistoryEntry[]>;

function parsePrices(raw: string | null): PricesMap {
  return raw ? JSON.parse(raw) : {};
}

function parseHistory(raw: string | null): PriceHistoryMap {
  return raw ? JSON.parse(raw) : {};
}

function appendHistoryEntries(
  previous: PricesMap,
  next: PricesMap,
  history: PriceHistoryMap,
): PriceHistoryMap {
  let changed = false;
  const merged: PriceHistoryMap = { ...history };

  Object.keys(next).forEach((idKey) => {
    const id = Number(idKey);
    const prevPrice = previous[id] ?? 0;
    const nextPrice = next[id] ?? 0;
    if (prevPrice === nextPrice) return;

    const currentEntries = merged[id] ?? [];
    const lastEntry = currentEntries[currentEntries.length - 1];
    if (lastEntry?.price === nextPrice) return;

    changed = true;
    merged[id] = [
      ...currentEntries,
      {
        price: nextPrice,
        timestamp: new Date().toISOString(),
      },
    ].slice(-MAX_HISTORY_ENTRIES);
  });

  return changed ? merged : history;
}

function mergeHistoryEntries(entries: PriceHistoryEntry[][]): PriceHistoryEntry[] {
  const merged = entries
    .flat()
    .filter((entry) => entry && typeof entry.price === "number" && typeof entry.timestamp === "string")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const deduped: PriceHistoryEntry[] = [];
  merged.forEach((entry) => {
    const last = deduped[deduped.length - 1];
    if (last && last.price === entry.price && last.timestamp === entry.timestamp) return;
    deduped.push(entry);
  });

  return deduped.slice(-MAX_HISTORY_ENTRIES);
}

function normalizeResourcePriceData(
  prices: PricesMap,
  history: PriceHistoryMap,
  aliases: Record<string, string[]>,
) {
  let changed = false;
  const nextPrices: PricesMap = { ...prices };
  const nextHistory: PriceHistoryMap = { ...history };

  Object.values(aliases).forEach((ids) => {
    if (ids.length < 2) return;

    const mergedHistory = mergeHistoryEntries(ids.map((id) => nextHistory[id] ?? []));
    const pricedCandidates = ids
      .map((id) => {
        const price = nextPrices[id];
        const latestHistoryTimestamp = (nextHistory[id] ?? []).at(-1)?.timestamp ?? "";
        return { id, price, latestHistoryTimestamp };
      })
      .filter((candidate) => typeof candidate.price === "number" && candidate.price > 0);

    pricedCandidates.sort((a, b) => {
      if (a.latestHistoryTimestamp && b.latestHistoryTimestamp) {
        return new Date(b.latestHistoryTimestamp).getTime() - new Date(a.latestHistoryTimestamp).getTime();
      }
      if (a.latestHistoryTimestamp) return -1;
      if (b.latestHistoryTimestamp) return 1;
      return 0;
    });

    const canonicalPrice =
      pricedCandidates[0]?.price ??
      mergedHistory.filter((entry) => entry.price > 0).at(-1)?.price ??
      0;

    ids.forEach((id) => {
      if ((nextPrices[id] ?? 0) !== canonicalPrice) {
        nextPrices[id] = canonicalPrice;
        changed = true;
      }

      const currentHistory = nextHistory[id] ?? [];
      const sameHistory =
        currentHistory.length === mergedHistory.length &&
        currentHistory.every((entry, index) => entry.price === mergedHistory[index]?.price && entry.timestamp === mergedHistory[index]?.timestamp);

      if (!sameHistory && mergedHistory.length) {
        nextHistory[id] = mergedHistory;
        changed = true;
      }
    });
  });

  return {
    prices: nextPrices,
    history: nextHistory,
    changed,
  };
}

export function usePrices(server: string, dataset: "20" | "129" = "20") {
  const [resourcePrices, setResourcePrices] = useState<Record<number, number>>({});
  const [itemPrices, setItemPrices] = useState<Record<number, number>>({});
  const [resourcePriceHistory, setResourcePriceHistory] = useState<PriceHistoryMap>({});
  const [itemPriceHistory, setItemPriceHistory] = useState<PriceHistoryMap>({});
  const resourcePricesRef = useRef<PricesMap>({});
  const itemPricesRef = useRef<PricesMap>({});
  const resourceHistoryRef = useRef<PriceHistoryMap>({});
  const itemHistoryRef = useRef<PriceHistoryMap>({});
  const resourceAliasesRef = useRef<Record<string, string[]>>({});
  const resourceAliasByIdRef = useRef<Record<string, string[]>>({});

  const persistState = useCallback((resources: PricesMap, items: PricesMap, resourceHistory: PriceHistoryMap, itemHistory: PriceHistoryMap) => {
    resourcePricesRef.current = resources;
    itemPricesRef.current = items;
    resourceHistoryRef.current = resourceHistory;
    itemHistoryRef.current = itemHistory;

    setResourcePrices(resources);
    setItemPrices(items);
    setResourcePriceHistory(resourceHistory);
    setItemPriceHistory(itemHistory);

    try {
      localStorage.setItem(RESOURCE_KEY(server, dataset), JSON.stringify(resources));
      localStorage.setItem(ITEM_KEY(server, dataset), JSON.stringify(items));
      localStorage.setItem(RESOURCE_HISTORY_KEY(server, dataset), JSON.stringify(resourceHistory));
      localStorage.setItem(ITEM_HISTORY_KEY(server, dataset), JSON.stringify(itemHistory));
    } catch (err) {
      console.error("Failed to persist prices", err);
    }
  }, [server, dataset]);

  const getAliasIdsForResource = useCallback((id: string) => {
    return resourceAliasByIdRef.current[id] ?? [id];
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const storedResources = localStorage.getItem(RESOURCE_KEY(server, dataset));
        const storedItems = localStorage.getItem(ITEM_KEY(server, dataset));
        const storedResourceHistory = localStorage.getItem(RESOURCE_HISTORY_KEY(server, dataset));
        const storedItemHistory = localStorage.getItem(ITEM_HISTORY_KEY(server, dataset));

        const nextResources = parsePrices(storedResources);
        const nextItems = parsePrices(storedItems);
        let nextResourceHistory = parseHistory(storedResourceHistory);
        const nextItemHistory = parseHistory(storedItemHistory);
        let pricesChanged = false;

        // One-time migration: if dataset-specific empty but base 20 exists, copy it
        if (!storedResources && dataset !== "20") {
          const baseResources = localStorage.getItem(RESOURCE_KEY(server, "20"));
          if (baseResources) {
            Object.assign(nextResources, parsePrices(baseResources));
            pricesChanged = true;
          }
        }

        if (!storedItems && dataset !== "20") {
          const baseItems = localStorage.getItem(ITEM_KEY(server, "20"));
          if (baseItems) {
            Object.assign(nextItems, parsePrices(baseItems));
            pricesChanged = true;
          }
        }

        const aliases = await getLocalResourceAliases(dataset);
        resourceAliasesRef.current = aliases;
        const nextAliasById: Record<string, string[]> = {};
        Object.values(aliases).forEach((ids) => {
          ids.forEach((id) => {
            nextAliasById[id] = ids;
          });
        });
        resourceAliasByIdRef.current = nextAliasById;
        const normalizedResources = normalizeResourcePriceData(nextResources, nextResourceHistory, aliases);
        const finalResources = normalizedResources.prices;
        nextResourceHistory = normalizedResources.history;
        pricesChanged = pricesChanged || normalizedResources.changed;

        if (cancelled) return;

        resourcePricesRef.current = finalResources;
        itemPricesRef.current = nextItems;
        resourceHistoryRef.current = nextResourceHistory;
        itemHistoryRef.current = nextItemHistory;
        setResourcePrices(finalResources);
        setItemPrices(nextItems);
        setResourcePriceHistory(nextResourceHistory);
        setItemPriceHistory(nextItemHistory);

        if (pricesChanged) {
          try {
            localStorage.setItem(RESOURCE_KEY(server, dataset), JSON.stringify(finalResources));
            localStorage.setItem(ITEM_KEY(server, dataset), JSON.stringify(nextItems));
            localStorage.setItem(RESOURCE_HISTORY_KEY(server, dataset), JSON.stringify(nextResourceHistory));
            localStorage.setItem(ITEM_HISTORY_KEY(server, dataset), JSON.stringify(nextItemHistory));
          } catch (err) {
            console.error("Failed to persist migrated prices", err);
          }
        }
      } catch (err) {
        console.error("Failed to read prices", err);
        if (cancelled) return;
        setResourcePrices({});
        setItemPrices({});
        setResourcePriceHistory({});
        setItemPriceHistory({});
        resourcePricesRef.current = {};
        itemPricesRef.current = {};
        resourceHistoryRef.current = {};
        itemHistoryRef.current = {};
        resourceAliasesRef.current = {};
        resourceAliasByIdRef.current = {};
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [server, dataset]);

  const savePrices = (resources: Record<number, number>, items: Record<number, number>) => {
    const nextResourceHistory = appendHistoryEntries(resourcePricesRef.current, resources, resourceHistoryRef.current);
    const nextItemHistory = appendHistoryEntries(itemPricesRef.current, items, itemHistoryRef.current);
    persistState(resources, items, nextResourceHistory, nextItemHistory);
  };

  const updateResourcePrice = (id: number, value: number) => {
    const cleanValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    const idKey = String(id);
    const aliasIds = getAliasIdsForResource(idKey);
    const nextResources = { ...resourcePricesRef.current };
    aliasIds.forEach((aliasId) => {
      nextResources[aliasId] = cleanValue;
    });
    const nextResourceHistory = appendHistoryEntries(resourcePricesRef.current, nextResources, resourceHistoryRef.current);
    persistState(nextResources, itemPricesRef.current, nextResourceHistory, itemHistoryRef.current);
  };

  const updateItemPrice = (id: number, value: number) => {
    const cleanValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    const nextItems = { ...itemPricesRef.current, [id]: cleanValue };
    const nextItemHistory = appendHistoryEntries(itemPricesRef.current, nextItems, itemHistoryRef.current);
    persistState(resourcePricesRef.current, nextItems, resourceHistoryRef.current, nextItemHistory);
  };

  const resetPrices = () => {
    resourcePricesRef.current = {};
    itemPricesRef.current = {};
    setResourcePrices({});
    setItemPrices({});
    try {
      localStorage.removeItem(RESOURCE_KEY(server, dataset));
      localStorage.removeItem(ITEM_KEY(server, dataset));
    } catch (err) {
      console.error("Failed to reset prices", err);
    }
  };

  return {
    resourcePrices,
    itemPrices,
    resourcePriceHistory,
    itemPriceHistory,
    updateResourcePrice,
    updateItemPrice,
    savePrices,
    resetPrices,
  };
}
