import { useEffect, useState } from "react";

const RESOURCE_KEY = (server: string, dataset: "20" | "129") => `dofinvest_prices:${server}:${dataset}:resources`;
const ITEM_KEY = (server: string, dataset: "20" | "129") => `dofinvest_prices:${server}:${dataset}:items`;

export function usePrices(server: string, dataset: "20" | "129" = "20") {
  const [resourcePrices, setResourcePrices] = useState<Record<number, number>>({});
  const [itemPrices, setItemPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    try {
      const storedResources = localStorage.getItem(RESOURCE_KEY(server, dataset));
      const storedItems = localStorage.getItem(ITEM_KEY(server, dataset));

      const nextResources = storedResources ? JSON.parse(storedResources) : {};
      const nextItems = storedItems ? JSON.parse(storedItems) : {};

      // One-time migration: if dataset-specific empty but base 20 exists, copy it
      if (!storedResources && dataset !== "20") {
        const baseResources = localStorage.getItem(RESOURCE_KEY(server, "20"));
        if (baseResources) {
          localStorage.setItem(RESOURCE_KEY(server, dataset), baseResources);
          Object.assign(nextResources, JSON.parse(baseResources));
        }
      }

      if (!storedItems && dataset !== "20") {
        const baseItems = localStorage.getItem(ITEM_KEY(server, "20"));
        if (baseItems) {
          localStorage.setItem(ITEM_KEY(server, dataset), baseItems);
          Object.assign(nextItems, JSON.parse(baseItems));
        }
      }

      setResourcePrices(nextResources);
      setItemPrices(nextItems);
    } catch (err) {
      console.error("Failed to read prices", err);
      setResourcePrices({});
      setItemPrices({});
    }
  }, [server, dataset]);

  const savePrices = (resources: Record<number, number>, items: Record<number, number>) => {
    setResourcePrices(resources);
    setItemPrices(items);
    try {
      localStorage.setItem(RESOURCE_KEY(server, dataset), JSON.stringify(resources));
      localStorage.setItem(ITEM_KEY(server, dataset), JSON.stringify(items));
    } catch (err) {
      console.error("Failed to persist prices", err);
    }
  };

  const resetPrices = () => {
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
    setResourcePrices,
    setItemPrices,
    savePrices,
    resetPrices,
  };
}
