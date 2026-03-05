import {
  MARKET_BOT_OUTPUT_SCHEMA,
  MarketBotOutputFile,
  MarketBotOutputPriceEntry,
} from "@/types/marketBot";

function isIsoDate(value: unknown) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function sanitizeImportedPrice(entry: MarketBotOutputPriceEntry): MarketBotOutputPriceEntry {
  const rawPrice = Number(entry.price) || 0;
  const normalizedLotSize = entry.lotSize !== undefined
    ? Math.max(0, Math.trunc(Number(entry.lotSize) || 0))
    : undefined;
  const unitPrice = normalizedLotSize && normalizedLotSize > 0
    ? rawPrice / normalizedLotSize
    : rawPrice;

  return {
    ...entry,
    id: String(entry.id),
    price: Math.max(0, Math.round(unitPrice)),
    observedAt: isIsoDate(entry.observedAt) ? entry.observedAt : undefined,
    lotSize: normalizedLotSize,
    confidence: entry.confidence !== undefined ? Number(entry.confidence) : undefined,
    notes: entry.notes?.trim() || undefined,
  };
}

export function parseMarketBotOutputFile(raw: string): MarketBotOutputFile {
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON payload.");
  }

  if (parsed.schemaVersion !== MARKET_BOT_OUTPUT_SCHEMA) {
    throw new Error(`Unsupported schemaVersion: ${String(parsed.schemaVersion || "unknown")}`);
  }

  if ((parsed.dataset !== "20" && parsed.dataset !== "129") || typeof parsed.server !== "string") {
    throw new Error("Missing or invalid dataset/server.");
  }

  if (!isIsoDate(parsed.collectedAt)) {
    throw new Error("Missing or invalid collectedAt timestamp.");
  }

  if (typeof parsed.source !== "string" || !parsed.source.trim()) {
    throw new Error("Missing bot source.");
  }

  if (!Array.isArray(parsed.prices)) {
    throw new Error("Missing prices array.");
  }

  const prices = parsed.prices.map((entry: unknown, index: number) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Invalid price entry at index ${index}.`);
    }
    const candidate = entry as Record<string, unknown>;
    if (candidate.entityType !== "resource" && candidate.entityType !== "item") {
      throw new Error(`Invalid entityType at index ${index}.`);
    }
    if ((typeof candidate.id !== "string" && typeof candidate.id !== "number") || !String(candidate.id).trim()) {
      throw new Error(`Missing id at index ${index}.`);
    }
    if (!Number.isFinite(Number(candidate.price)) || Number(candidate.price) < 0) {
      throw new Error(`Invalid price at index ${index}.`);
    }

    return sanitizeImportedPrice({
      entityType: candidate.entityType,
      id: String(candidate.id),
      name: typeof candidate.name === "string" ? candidate.name : undefined,
      price: Number(candidate.price),
      observedAt: typeof candidate.observedAt === "string" ? candidate.observedAt : undefined,
      lotSize: candidate.lotSize as number | undefined,
      confidence: candidate.confidence as number | undefined,
      notes: typeof candidate.notes === "string" ? candidate.notes : undefined,
    });
  });

  return {
    schemaVersion: MARKET_BOT_OUTPUT_SCHEMA,
    collectedAt: parsed.collectedAt,
    server: parsed.server.trim(),
    dataset: parsed.dataset,
    source: parsed.source.trim(),
    prices,
  };
}
