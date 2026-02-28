import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Coins, Save, RefreshCw, Database, TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { useItemsSearch } from "@/hooks/useItemsSearch";
import { usePrices } from "@/hooks/usePrices";
import { DofusItem, PriceHistoryEntry, Resource } from "@/types/dofus";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { searchLocalItems } from "@/lib/localDataClient";
import resourceAliases129 from "@/data/resourceAliases129.json";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const formatKamas = (value: number) => value.toLocaleString("fr-FR");
const formatCompactKamas = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toLocaleString("fr-FR");
};

type HistoryEntityType = "resource" | "item";
type HistoryRange = "24h" | "7d" | "30d" | "all";

interface HistoryOption {
  id: string;
  label: string;
  type: HistoryEntityType;
}

const historyChartConfig = {
  price: {
    label: "Prix",
    color: "hsl(var(--primary))",
  },
  trend: {
    label: "Tendance",
    color: "hsl(var(--gold))",
  },
};

const Prices = () => {
  const [datasetVersion, setDatasetVersion] = useState<"20" | "129">("129");
  const [server] = useState("Abrak");
  const { items: searchResults } = useItemsSearch({ query: "", craftableOnly: true, page: 1, dataset: datasetVersion });
  const [selection, setSelection] = useState<DofusItem[]>([]);
  const [allItems, setAllItems] = useState<DofusItem[]>([]);
  const [historyType, setHistoryType] = useState<HistoryEntityType>("resource");
  const [historyTargetId, setHistoryTargetId] = useState<string>("");
  const [historyRange, setHistoryRange] = useState<HistoryRange>("all");
  const { resourcePrices, itemPrices, resourcePriceHistory, itemPriceHistory, updateResourcePrice, updateItemPrice, savePrices, resetPrices } = usePrices(server, datasetVersion);

  useEffect(() => {
    let cancelled = false;

    searchLocalItems({ query: "", craftableOnly: false, dataset: datasetVersion })
      .then((items) => {
        if (!cancelled) setAllItems(items);
      })
      .catch((err) => {
        console.error("Failed to load items for history", err);
        if (!cancelled) setAllItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [datasetVersion]);

  const aggregatedResources = useMemo(() => {
    const map: Record<number, Resource> = {};
    selection.forEach((item) => {
      item.recipe?.forEach((ing) => {
        const existing = map[ing.itemId];
        const totalQuantity = (existing?.totalQuantity || 0) + ing.quantity;
        map[ing.itemId] = {
          id: ing.itemId,
          name: ing.name,
          iconUrl: ing.iconUrl,
          totalQuantity,
          unitPrice: resourcePrices[ing.itemId] ?? 0,
          totalCost: (resourcePrices[ing.itemId] ?? 0) * totalQuantity,
        };
      });
    });
    return Object.values(map);
  }, [selection, resourcePrices]);

  const totalResourceCost = aggregatedResources.reduce((sum, res) => sum + res.totalCost, 0);

  const handleResourceChange = (id: number, value: string) => {
    const cleanValue = parseInt(value.replace(/\D/g, "")) || 0;
    updateResourcePrice(id, cleanValue);
  };

  const handleItemPriceChange = (id: number, value: string) => {
    const cleanValue = parseInt(value.replace(/\D/g, "")) || 0;
    updateItemPrice(id, cleanValue);
  };

  const handleSave = () => {
    savePrices(resourcePrices, itemPrices);
  };

  const handleReset = () => {
    resetPrices();
  };

  const itemNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    allItems.forEach((item) => {
      map[String(item.id)] = item.name;
      (item.recipe || []).forEach((ingredient) => {
        const ingredientId = String(ingredient.itemId);
        if (!map[ingredientId]) {
          map[ingredientId] = ingredient.name;
        }
      });
    });
    return map;
  }, [allItems]);

  const aliasNameMap = useMemo(() => {
    if (datasetVersion !== "129") return {} as Record<string, string>;

    const map: Record<string, string> = {};
    Object.entries(resourceAliases129).forEach(([name, entry]) => {
      entry.aliasIds.forEach((id) => {
        map[id] = name;
      });
    });
    return map;
  }, [datasetVersion]);

  const aliasCanonicalIdMap = useMemo(() => {
    if (datasetVersion !== "129") return {} as Record<string, string>;

    const map: Record<string, string> = {};
    Object.values(resourceAliases129).forEach((entry) => {
      entry.aliasIds.forEach((id) => {
        map[id] = entry.canonicalId;
      });
    });
    return map;
  }, [datasetVersion]);

  const aliasIdsByCanonicalId = useMemo(() => {
    if (datasetVersion !== "129") return {} as Record<string, string[]>;

    const map: Record<string, string[]> = {};
    Object.values(resourceAliases129).forEach((entry) => {
      map[entry.canonicalId] = entry.aliasIds;
    });
    return map;
  }, [datasetVersion]);

  const historyOptions = useMemo<HistoryOption[]>(() => {
    const rawResourceIds = Array.from(new Set([
      ...Object.keys(resourcePriceHistory),
      ...Object.keys(resourcePrices),
    ]));
    const resourceIds = Array.from(
      new Set(rawResourceIds.map((id) => aliasCanonicalIdMap[id] ?? id)),
    );
    const itemIds = Array.from(new Set([
      ...Object.keys(itemPriceHistory),
      ...Object.keys(itemPrices),
    ]));

    const buildLabel = (id: string, type: HistoryEntityType) => {
      const aliasName = type === "resource" ? aliasNameMap[id] : undefined;
      const name = itemNameMap[id] || aliasName || `${type === "resource" ? "Resource" : "Item"} #${id}`;
      return name;
    };

    const resources = resourceIds
      .map((id) => ({ id, type: "resource" as const, label: buildLabel(id, "resource") }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const items = itemIds
      .map((id) => ({ id, type: "item" as const, label: buildLabel(id, "item") }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [...resources, ...items];
  }, [resourcePriceHistory, itemPriceHistory, resourcePrices, itemPrices, itemNameMap, aliasNameMap, aliasCanonicalIdMap]);

  const historyOptionsForType = useMemo(
    () => historyOptions.filter((option) => option.type === historyType),
    [historyOptions, historyType],
  );

  useEffect(() => {
    if (!historyOptionsForType.length) {
      setHistoryTargetId("");
      return;
    }

    const exists = historyOptionsForType.some((option) => String(option.id) === historyTargetId);
    if (!exists) {
      setHistoryTargetId(String(historyOptionsForType[0].id));
    }
  }, [historyOptionsForType, historyTargetId]);

  const selectedHistoryEntries = useMemo<PriceHistoryEntry[]>(() => {
    if (!historyTargetId) return [];
    if (historyType === "item") {
      return itemPriceHistory[historyTargetId] ?? [];
    }

    const aliasIds = aliasIdsByCanonicalId[historyTargetId] ?? [historyTargetId];
    const merged = aliasIds
      .flatMap((id) => resourcePriceHistory[id] ?? [])
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const deduped: PriceHistoryEntry[] = [];
    merged.forEach((entry) => {
      const last = deduped[deduped.length - 1];
      if (last && last.price === entry.price && last.timestamp === entry.timestamp) return;
      deduped.push(entry);
    });

    return deduped;
  }, [historyTargetId, historyType, resourcePriceHistory, itemPriceHistory, aliasIdsByCanonicalId]);

  const filteredHistoryEntries = useMemo<PriceHistoryEntry[]>(() => {
    if (historyRange === "all") return selectedHistoryEntries;

    const now = Date.now();
    const rangeMs =
      historyRange === "24h"
        ? 24 * 60 * 60 * 1000
        : historyRange === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

    return selectedHistoryEntries.filter((entry) => {
      const timestamp = new Date(entry.timestamp).getTime();
      return now - timestamp <= rangeMs;
    });
  }, [selectedHistoryEntries, historyRange]);

  const selectedHistoryOption = useMemo(
    () => historyOptions.find((option) => String(option.id) === historyTargetId && option.type === historyType),
    [historyOptions, historyTargetId, historyType],
  );

  const historyChartData = useMemo(() => {
    return filteredHistoryEntries.map((entry, index, entries) => {
      const date = new Date(entry.timestamp);
      const movingWindow = entries.slice(Math.max(0, index - 2), index + 1);
      const trend = Math.round(
        movingWindow.reduce((sum, current) => sum + current.price, 0) / movingWindow.length,
      );

      return {
        index: index + 1,
        price: entry.price,
        trend,
        timestamp: entry.timestamp,
        label: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        fullLabel: date.toLocaleString("fr-FR"),
      };
    });
  }, [filteredHistoryEntries]);

  const historyStats = useMemo(() => {
    if (!filteredHistoryEntries.length) {
      return null;
    }

    const prices = filteredHistoryEntries.map((entry) => entry.price);
    const latest = prices[prices.length - 1];
    const previous = prices.length > 1 ? prices[prices.length - 2] : null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    const delta = previous === null ? 0 : latest - previous;
    const deltaPercent = previous && previous > 0 ? (delta / previous) * 100 : null;
    const firstSeen = filteredHistoryEntries[0]?.timestamp ?? null;
    const lastSeen = filteredHistoryEntries[filteredHistoryEntries.length - 1]?.timestamp ?? null;

    return {
      latest,
      previous,
      min,
      max,
      average,
      delta,
      deltaPercent,
      points: prices.length,
      firstSeen,
      lastSeen,
    };
  }, [filteredHistoryEntries]);

  const toggleSelection = (item: DofusItem) => {
    setSelection((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
    });
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-gold text-sm">
            <Coins className="h-4 w-4" />
            <span>Cahier des prix & serveur</span>
          </div>
          <h2 className="mt-4 text-3xl font-heading font-bold text-foreground">
            Préparez vos tarifs avant l'analyse
          </h2>
          <p className="mt-2 text-muted-foreground">
            Renseignez les prix des ressources et des items HDV. Ces valeurs seront utilisées pour
            calculer la rentabilité et pourront être synchronisées avec le stockage local par serveur.
          </p>
        </section>

        {/* Dataset + selection */}
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Version du jeu</p>
              <Select
                value={datasetVersion}
                onValueChange={(v) => {
                  setDatasetVersion(v as "20" | "129");
                  setSelection([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">Dofus 2.0</SelectItem>
                  <SelectItem value="129">Dofus 1.29 (Retro)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Items disponibles (cliquer pour sélectionner)</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {searchResults.slice(0, 30).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleSelection(item)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full border",
                      selection.some((i) => i.id === item.id)
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selection.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selection.map((item) => (
                <Badge key={item.id} variant="outline" className="border-primary/30 text-primary">
                  {item.name}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="card-dofus rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ressources nécessaires</p>
                <h3 className="text-xl font-semibold text-foreground">Tarifs HDV par ressource</h3>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {aggregatedResources.length} ressources
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2">
              {aggregatedResources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-3"
                >
                  <img src={res.iconUrl} alt={res.name} className="h-12 w-12 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{res.name}</p>
                    <p className="text-xs text-muted-foreground">Quantité totale: {res.totalQuantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formatKamas(resourcePrices[res.id] || 0)}
                      onChange={(e) => handleResourceChange(res.id, e.target.value)}
                      className="input-dofus w-28 text-right"
                    />
                    <span className="text-xs text-primary">k</span>
                  </div>
                  <div className="min-w-[120px] text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatKamas((resourcePrices[res.id] || 0) * res.totalQuantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              ))}
              {aggregatedResources.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune ressource (sélectionnez des items)</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/30 p-4">
              <div className="text-sm text-muted-foreground">Coût cumulé des ressources</div>
              <div className="text-2xl font-heading font-bold text-primary">
                {formatKamas(totalResourceCost)} kamas
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-dofus rounded-xl p-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Prix des items sélectionnés</p>
                <h3 className="text-xl font-semibold text-foreground">HDV & marge cible</h3>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {selection.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
                  >
                    <img src={item.iconUrl} alt={item.name} className="h-10 w-10 rounded" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Niv. {item.level} • {item.type}
                      </p>
                    </div>
                    <Input
                      value={formatKamas(itemPrices[item.id] || 0)}
                      onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                      className="input-dofus w-32 text-right"
                    />
                    <span className="text-xs text-primary">k</span>
                  </div>
                ))}
                {selection.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun item sélectionné</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span>Sync locale par serveur ({server})</span>
                </div>
                <p>
                  Les prix saisis sont sauvegardés automatiquement dans localStorage par serveur et version de jeu, avec historique pour les futurs KPI et graphiques.
                </p>
                <p>
                  Historique disponible: {Object.keys(resourcePriceHistory).length} ressources, {Object.keys(itemPriceHistory).length} items HDV.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="lime" className="flex-1 gap-2" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Sauvegarder les prix
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            <div className="card-dofus rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">Check-list avant calcul</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Sélectionnez les items à analyser.</li>
                <li>• Renseignez les prix HDV (ressources + items) pour le serveur.</li>
                <li>• Sauvegardez pour réutiliser ces tarifs lors de l'analyse.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary text-sm">
                <BarChart3 className="h-4 w-4" />
                <span>Price history</span>
              </div>
              <h3 className="mt-4 text-2xl font-heading font-bold text-foreground">
                Historique et KPI des prix
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Analyse les variations que tu saisis au fil du temps pour une ressource ou un item HDV.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Type</p>
                <Select value={historyType} onValueChange={(value) => setHistoryType(value as HistoryEntityType)}>
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resource">Ressource</SelectItem>
                    <SelectItem value="item">Item HDV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Période</p>
                <div className="flex flex-wrap gap-2">
                  {(["24h", "7d", "30d", "all"] as HistoryRange[]).map((range) => (
                    <Button
                      key={range}
                      type="button"
                      size="sm"
                      variant={historyRange === range ? "lime" : "outline"}
                      onClick={() => setHistoryRange(range)}
                    >
                      {range === "all" ? "Tout" : range}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {historyType === "resource" ? "Ressource suivie" : "Item suivi"}
                </p>
                <Select
                  value={historyTargetId}
                  onValueChange={setHistoryTargetId}
                  disabled={!historyOptionsForType.length}
                >
                  <SelectTrigger className="min-w-[260px]">
                    <SelectValue placeholder="Choisir une entrée" />
                  </SelectTrigger>
                  <SelectContent>
                    {historyOptionsForType.map((option) => (
                      <SelectItem key={`${option.type}-${option.id}`} value={String(option.id)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {!historyStats || !selectedHistoryOption ? (
            <div className="card-dofus rounded-xl p-8 text-center">
              <p className="text-lg font-semibold text-foreground">Pas encore d’historique exploitable</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Saisis quelques prix, puis reviens ici pour voir les tendances et les KPI.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="card-dofus rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">Dernier prix</p>
                  <p className="mt-2 text-3xl font-heading font-bold text-primary">
                    {formatCompactKamas(historyStats.latest)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {historyStats.lastSeen ? new Date(historyStats.lastSeen).toLocaleString("fr-FR") : "N/A"}
                  </p>
                </div>

                <div className="card-dofus rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">Variation récente</p>
                  <div className="mt-2 flex items-center gap-2">
                    {historyStats.delta >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-profit" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-loss" />
                    )}
                    <p className={cn("text-3xl font-heading font-bold", historyStats.delta >= 0 ? "text-profit" : "text-loss")}>
                      {historyStats.delta >= 0 ? "+" : ""}{formatCompactKamas(historyStats.delta)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {historyStats.deltaPercent === null
                      ? "Pas assez de points pour un pourcentage"
                      : `${historyStats.deltaPercent >= 0 ? "+" : ""}${historyStats.deltaPercent.toFixed(1)}% vs point précédent`}
                  </p>
                </div>

                <div className="card-dofus rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">Range observée</p>
                  <p className="mt-2 text-3xl font-heading font-bold text-foreground">
                    {formatCompactKamas(historyStats.min)} - {formatCompactKamas(historyStats.max)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {historyStats.points} points enregistrés sur {historyRange === "all" ? "tout l’historique" : historyRange}
                  </p>
                </div>

                <div className="card-dofus rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">Prix moyen</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <p className="text-3xl font-heading font-bold text-foreground">
                      {formatCompactKamas(historyStats.average)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Depuis le {historyStats.firstSeen ? new Date(historyStats.firstSeen).toLocaleDateString("fr-FR") : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <div className="card-dofus rounded-xl p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {historyType === "resource" ? "Ressource suivie" : "Item HDV suivi"}
                      </p>
                      <h4 className="text-xl font-semibold text-foreground">{selectedHistoryOption.label}</h4>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {historyStats.points} points
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <ChartContainer config={historyChartConfig} className="h-[320px] w-full">
                    <LineChart data={historyChartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCompactKamas(Number(value))}
                        width={72}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => (
                              <div className="flex min-w-[180px] items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                  {name === "trend" ? "Tendance" : "Prix"}
                                </span>
                                <span className="font-mono font-medium text-foreground">
                                  {formatKamas(Number(value))} kamas
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-price)"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "var(--color-price)" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="trend"
                        stroke="var(--color-trend)"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>

                <div className="card-dofus rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">Derniers relevés</p>
                  <h4 className="mt-1 text-xl font-semibold text-foreground">Journal récent</h4>
                  <Separator className="my-4" />

                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                    {[...filteredHistoryEntries].reverse().slice(0, 12).map((entry, index) => {
                      const originalIndex = filteredHistoryEntries.length - 1 - index;
                      const previousEntry = originalIndex > 0 ? filteredHistoryEntries[originalIndex - 1] : null;
                      const delta = previousEntry ? entry.price - previousEntry.price : null;

                      return (
                        <div
                          key={`${entry.timestamp}-${entry.price}-${index}`}
                          className="rounded-lg border border-border bg-secondary/30 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{formatKamas(entry.price)} kamas</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString("fr-FR")}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-current/20",
                                delta === null ? "text-muted-foreground" : delta >= 0 ? "text-profit" : "text-loss",
                              )}
                            >
                              {delta === null ? "Initial" : `${delta >= 0 ? "+" : ""}${formatCompactKamas(delta)}`}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Prices;
