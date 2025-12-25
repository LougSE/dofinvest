import { useEffect, useState } from "react";

const RESOURCE_KEY = (server: string) => `dofinvest_prices:${server}:resources`;
const ITEM_KEY = (server: string) => `dofinvest_prices:${server}:items`;

export function usePrices(server: string) {
  const [resourcePrices, setResourcePrices] = useState<Record<number, number>>({});
  const [itemPrices, setItemPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    try {
      const storedResources = localStorage.getItem(RESOURCE_KEY(server));
      const storedItems = localStorage.getItem(ITEM_KEY(server));
      setResourcePrices(storedResources ? JSON.parse(storedResources) : {});
      setItemPrices(storedItems ? JSON.parse(storedItems) : {});
    } catch (err) {
      console.error("Failed to read prices", err);
      setResourcePrices({});
      setItemPrices({});
    }
  }, [server]);

  const savePrices = (resources: Record<number, number>, items: Record<number, number>) => {
    setResourcePrices(resources);
    setItemPrices(items);
    try {
      localStorage.setItem(RESOURCE_KEY(server), JSON.stringify(resources));
      localStorage.setItem(ITEM_KEY(server), JSON.stringify(items));
    } catch (err) {
      console.error("Failed to persist prices", err);
    }
  };

  const resetPrices = () => {
    setResourcePrices({});
    setItemPrices({});
    try {
      localStorage.removeItem(RESOURCE_KEY(server));
      localStorage.removeItem(ITEM_KEY(server));
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
