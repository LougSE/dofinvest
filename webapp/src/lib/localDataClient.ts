import { DofusItem, RecipeIngredient } from "@/types/dofus";

const caches: Record<string, DofusItem[] | null> = {};

async function loadData(dataset: "20" | "129" = "20"): Promise<DofusItem[]> {
  if (caches[dataset]) return caches[dataset] as DofusItem[];
  const path = dataset === "129" ? "/data/items-129.json" : "/data/items.json";
  const response = await fetch(path);
  if (!response.ok) throw new Error("Failed to load local items");
  const json = await response.json();
  caches[dataset] = json as DofusItem[];
  return caches[dataset] as DofusItem[];
}

export async function searchLocalItems({
  query,
  craftableOnly,
  dataset = "20",
}: {
  query: string;
  craftableOnly?: boolean;
  dataset?: "20" | "129";
}): Promise<DofusItem[]> {
  const data = await loadData(dataset);
  const q = query.trim().toLowerCase();
  const filtered = data.filter((item) => {
    if (craftableOnly && !item.isCraftable) return false;
    if (!q) return true;
    return item.name.toLowerCase().includes(q);
  });
  return filtered;
}

export async function getLocalRecipe(id: number, dataset: "20" | "129" = "20"): Promise<RecipeIngredient[]> {
  const data = await loadData(dataset);
  const item = data.find((it) => it.id === id);
  return item?.recipe || [];
}
