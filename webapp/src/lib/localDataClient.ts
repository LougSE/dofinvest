import { DofusItem, RecipeIngredient } from "@/types/dofus";

let dataCache: DofusItem[] | null = null;

async function loadData(): Promise<DofusItem[]> {
  if (dataCache) return dataCache;
  const response = await fetch("/data/items.json");
  if (!response.ok) throw new Error("Failed to load local items");
  const json = await response.json();
  dataCache = json as DofusItem[];
  return dataCache;
}

export async function searchLocalItems({
  query,
  craftableOnly,
}: {
  query: string;
  craftableOnly?: boolean;
}): Promise<DofusItem[]> {
  const data = await loadData();
  const q = query.trim().toLowerCase();
  const filtered = data.filter((item) => {
    if (craftableOnly && !item.isCraftable) return false;
    if (!q) return true;
    return item.name.toLowerCase().includes(q);
  });
  return filtered;
}

export async function getLocalRecipe(id: number): Promise<RecipeIngredient[]> {
  const data = await loadData();
  const item = data.find((it) => it.id === id);
  return item?.recipe || [];
}
