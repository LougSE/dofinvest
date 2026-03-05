export const MARKET_BOT_INPUT_SCHEMA = "dofinvest-market-bot-input/v1";
export const MARKET_BOT_OUTPUT_SCHEMA = "dofinvest-market-bot-output/v1";

export type MarketBotEntityKind = "resource" | "item";

export interface MarketBotUsageHint {
  itemId: number;
  itemName: string;
  quantity: number;
}

export interface MarketBotInputItemTarget {
  id: number;
  name: string;
  level: number;
  type: string;
  iconUrl: string;
  currentPrice: number;
  recipeIngredientCount: number;
}

export interface MarketBotInputResourceTarget {
  id: number;
  name: string;
  iconUrl: string;
  totalQuantity: number;
  currentPrice: number;
  aliasIds?: string[];
  usedBy: MarketBotUsageHint[];
}

export interface MarketBotInputFile {
  schemaVersion: typeof MARKET_BOT_INPUT_SCHEMA;
  exportedAt: string;
  server: string;
  dataset: "20" | "129";
  source: "dofinvest";
  targetSummary: {
    itemCount: number;
    resourceCount: number;
  };
  items: MarketBotInputItemTarget[];
  resources: MarketBotInputResourceTarget[];
}

export interface MarketBotOutputPriceEntry {
  entityType: MarketBotEntityKind;
  id: string;
  name?: string;
  price: number;
  observedAt?: string;
  lotSize?: number;
  confidence?: number;
  notes?: string;
}

export interface MarketBotOutputFile {
  schemaVersion: typeof MARKET_BOT_OUTPUT_SCHEMA;
  collectedAt: string;
  server: string;
  dataset: "20" | "129";
  source: string;
  prices: MarketBotOutputPriceEntry[];
}
