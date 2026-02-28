import { DofusItem, RecipeIngredient } from "@/types/dofus";
import resourceAliases129 from "@/data/resourceAliases129.json";

const caches: Record<string, DofusItem[] | null> = {};
const resourceAliasCaches: Record<string, Record<string, string[]> | null> = {};

function normalizeResourceName(name: string) {
  return name.trim().toLowerCase();
}

async function loadData(dataset: "20" | "129" = "129"): Promise<DofusItem[]> {
  if (caches[dataset]) return caches[dataset] as DofusItem[];
  const path = dataset === "129" ? "/data/items-129.json" : "/data/items.json";
  const response = await fetch(path);
  if (!response.ok) throw new Error("Failed to load local items");
  const json = await response.json();
  caches[dataset] = json as DofusItem[];
  return caches[dataset] as DofusItem[];
}

export async function getLocalResourceAliases(dataset: "20" | "129" = "129"): Promise<Record<string, string[]>> {
  if (resourceAliasCaches[dataset]) return resourceAliasCaches[dataset] as Record<string, string[]>;

  if (dataset === "129") {
    const aliases = Object.fromEntries(
      Object.entries(resourceAliases129).map(([name, entry]) => [name, entry.aliasIds]),
    );
    resourceAliasCaches[dataset] = aliases;
    return aliases;
  }

  const data = await loadData(dataset);
  const byName = new Map<string, Set<string>>();

  data.forEach((item) => {
    (item.recipe || []).forEach((ingredient) => {
      const normalizedName = normalizeResourceName(ingredient.name || "");
      if (!normalizedName) return;

      const currentIds = byName.get(normalizedName) ?? new Set<string>();
      currentIds.add(String(ingredient.itemId));
      byName.set(normalizedName, currentIds);
    });
  });

  const aliases = Object.fromEntries(
    Array.from(byName.entries()).map(([name, ids]) => [name, Array.from(ids)]),
  );
  resourceAliasCaches[dataset] = aliases;
  return aliases;
}

export async function searchLocalItems({
  query,
  craftableOnly,
  dataset = "129",
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

export async function getLocalRecipe(id: number, dataset: "20" | "129" = "129"): Promise<RecipeIngredient[]> {
  const data = await loadData(dataset);
  const item = data.find((it) => it.id === id);
  return item?.recipe || [];
}
