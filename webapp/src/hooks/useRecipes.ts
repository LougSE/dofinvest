import { useEffect, useMemo, useState } from "react";
import { RecipeIngredient } from "@/types/dofus";
import { getLocalRecipe } from "@/lib/localDataClient";

const CACHE_PREFIX = "dofinvest_recipe_v2:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CONCURRENT = 4;

type RecipeMap = Record<number, RecipeIngredient[]>;

function readCache(dataset: "20" | "129", id: number): RecipeIngredient[] | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${dataset}:${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !parsed?.recipe) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.recipe as RecipeIngredient[];
  } catch (err) {
    console.error("Recipe cache read error", err);
    return null;
  }
}

function writeCache(dataset: "20" | "129", id: number, recipe: RecipeIngredient[]) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${dataset}:${id}`, JSON.stringify({ recipe, timestamp: Date.now() }));
  } catch (err) {
    console.error("Recipe cache write error", err);
  }
}

async function fetchWithLimit<T>(
  tasks: Array<() => Promise<{ id: number; recipe: RecipeIngredient[] }>>,
): Promise<RecipeMap> {
  const results: RecipeMap = {};
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = tasks[index];
      index += 1;
      const { id, recipe } = await current();
      results[id] = recipe;
    }
  }

  const workers = Array.from({ length: Math.min(MAX_CONCURRENT, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function useRecipes(itemIds: number[], dataset: "20" | "129" = "20") {
  const [recipes, setRecipes] = useState<RecipeMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRecipes({});
  }, [dataset]);

  useEffect(() => {
    let cancelled = false;
    const uniqueIds = Array.from(new Set(itemIds)).filter(Boolean);
    if (!uniqueIds.length) {
      setRecipes({});
      setIsLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const tasks: Array<() => Promise<{ id: number; recipe: RecipeIngredient[] }>> = uniqueIds.map((id) => async () => {
      const cached = readCache(dataset, id);
      if (cached) return { id, recipe: cached };
      const fetched = await getLocalRecipe(id, dataset);
      writeCache(dataset, id, fetched);
      return { id, recipe: fetched };
    });

    setIsLoading(true);
    setError(null);

    fetchWithLimit(tasks)
      .then((result) => {
        if (cancelled) return;
        setRecipes(result);
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error("useRecipes error", { itemIds, error: err });
        setError(err?.message || "Erreur lors du chargement des recettes");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemIds]);

  const value = useMemo(
    () => ({ recipes, isLoading, error }),
    [recipes, isLoading, error],
  );

  return value;
}
