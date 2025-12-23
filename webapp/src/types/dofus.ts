export interface DofusItem {
  id: number;
  name: string;
  level: number;
  type: string;
  iconUrl: string;
  recipe?: RecipeIngredient[];
  isCraftable: boolean;
}

export interface RecipeIngredient {
  itemId: number;
  name: string;
  quantity: number;
  iconUrl: string;
}

export interface Resource {
  id: number;
  name: string;
  iconUrl: string;
  totalQuantity: number;
  unitPrice: number;
  totalCost: number;
}

export interface SelectedItem {
  item: DofusItem;
  hdvPrice: number;
  hdvMin?: number;
  hdvMax?: number;
}

export interface ProfitabilityResult {
  item: DofusItem;
  costTotal: number;
  hdvPrice: number;
  benefit: number;
  marginPercent: number;
  resources: Resource[];
}

export interface ServerPrices {
  [resourceId: number]: number;
}
