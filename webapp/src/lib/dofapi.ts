import { DofapiItem, DofusItem, RecipeIngredient } from "@/types/dofus";

const DEFAULT_BASE_URL = "https://dofapi.fr";
const REQUEST_TIMEOUT = 10000;
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

const getBaseUrl = () => import.meta.env.VITE_DOFAPI_BASE || DEFAULT_BASE_URL;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number; retryCount?: number } = {},
): Promise<Response> {
  const { timeoutMs = REQUEST_TIMEOUT, retryCount = 1, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...rest, signal: controller.signal });
    if (response.ok) return response;

    if (retryCount > 0 && RETRYABLE_STATUSES.includes(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchWithTimeout(input, { ...init, retryCount: retryCount - 1 });
    }

    throw new Error(`Dofapi error ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

export function mapDofapiItemToDofus(item: DofapiItem): DofusItem {
  const iconUrl =
    item.imgUrl || item.imageUrl || item.icon || `${getBaseUrl()}/items/${item._id || item.ankamaId || item.id}/image`;

  const recipe: RecipeIngredient[] | undefined = item.recipe?.map((ingredient) => ({
    itemId: ingredient.id || ingredient.ankamaId || 0,
    name: ingredient.name || `Ressource ${ingredient.id || ingredient.ankamaId || "?"}`,
    quantity: ingredient.quantity,
    iconUrl:
      ingredient.imageUrl || ingredient.icon || `${getBaseUrl()}/items/${ingredient.id || ingredient.ankamaId}/image`,
  }));

  return {
    id: item._id || item.ankamaId || item.id || 0,
    name: item.name,
    level: item.level,
    type: item.type,
    iconUrl,
    recipe,
    isCraftable: Boolean(recipe?.length),
  };
}

export async function searchItems({
  query,
  page,
  size,
}: {
  query: string;
  page: number;
  size: number;
}): Promise<DofusItem[]> {
  const url = new URL(`${getBaseUrl()}/items`);
  if (query) url.searchParams.set("name", query);
  if (page) url.searchParams.set("page", String(page));
  if (size) url.searchParams.set("size", String(size));

  const response = await fetchWithTimeout(url.toString(), { method: "GET" });
  const data = await response.json();

  const items: DofapiItem[] = Array.isArray(data) ? data : data?.items || [];
  return items.map(mapDofapiItemToDofus).filter((item) => item.isCraftable);
}

export async function getItem(id: number): Promise<DofusItem> {
  const response = await fetchWithTimeout(`${getBaseUrl()}/items/${id}`, { method: "GET" });
  const data: DofapiItem = await response.json();
  return mapDofapiItemToDofus(data);
}

export async function getRecipe(id: number): Promise<RecipeIngredient[]> {
  const response = await fetchWithTimeout(`${getBaseUrl()}/items/${id}/recipe`, { method: "GET" });
  const recipe = await response.json();
  if (!Array.isArray(recipe)) return [];

  return recipe.map((ing: any) => ({
    itemId: ing.itemId || ing.id || ing.ankamaId || 0,
    name: ing.name || `Ressource ${ing.itemId || ing.id || ing.ankamaId || "?"}`,
    quantity: ing.quantity,
    iconUrl: ing.imageUrl || ing.icon || `${getBaseUrl()}/items/${ing.itemId || ing.id || ing.ankamaId}/image`,
  }));
}

export function getImageUrl(id: number) {
  return `${getBaseUrl()}/items/${id}/image`;
}
