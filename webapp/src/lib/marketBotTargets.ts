import resourceAliases129 from "@/data/resourceAliases129.json";
import {
  MARKET_BOT_INPUT_SCHEMA,
  MarketBotInputFile,
  MarketBotInputItemTarget,
  MarketBotInputResourceTarget,
} from "@/types/marketBot";

function getAliasIds(dataset: "20" | "129", resourceId: number) {
  if (dataset !== "129") return undefined;

  const id = String(resourceId);
  for (const entry of Object.values(resourceAliases129)) {
    if (entry.aliasIds.includes(id)) {
      return entry.aliasIds;
    }
  }

  return [id];
}

export function buildMarketBotInputFile({
  server,
  dataset,
  items,
  resources,
}: {
  server: string;
  dataset: "20" | "129";
  items: MarketBotInputItemTarget[];
  resources: Array<Omit<MarketBotInputResourceTarget, "aliasIds">>;
}): MarketBotInputFile {
  return {
    schemaVersion: MARKET_BOT_INPUT_SCHEMA,
    exportedAt: new Date().toISOString(),
    server,
    dataset,
    source: "dofinvest",
    targetSummary: {
      itemCount: items.length,
      resourceCount: resources.length,
    },
    items,
    resources: resources.map((resource) => ({
      ...resource,
      aliasIds: getAliasIds(dataset, resource.id),
    })),
  };
}

export function downloadMarketBotInputFile(payload: MarketBotInputFile) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const suffix = `${payload.server.toLowerCase()}-${payload.dataset}-${new Date().toISOString().slice(0, 10)}`;
  anchor.href = url;
  anchor.download = `dofinvest-market-bot-input-${suffix}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
