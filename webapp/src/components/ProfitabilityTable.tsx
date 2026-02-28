import { useEffect, useMemo, useState, Fragment } from "react";
import { ProfitabilityResult, Resource } from "@/types/dofus";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ProfitabilityTableProps {
  results: ProfitabilityResult[];
  onBack: () => void;
  onSave?: () => void;
  quantities: Record<number, number>;
  onQuantityChange: (id: number, qty: number) => void;
  onQuantityChangeAll?: (qty: number) => void;
  initialIncludedIds?: number[];
  onIncludedIdsChange?: (ids: number[]) => void;
  initialPriceInputs?: Record<number, string>;
  onPriceInputsChange?: (inputs: Record<number, string>) => void;
  onItemPricePersist?: (id: number, price: number) => void;
  onResultsChange?: (results: ProfitabilityResult[]) => void;
  initialAcknowledgedResources?: string[];
  onAcknowledgedResourcesChange?: (keys: string[]) => void;
  initialAcknowledgedItemResources?: Record<number, string[]>;
  onAcknowledgedItemResourcesChange?: (map: Record<number, string[]>) => void;
  onResourcePricePersist?: (id: number | undefined, price: number) => void;
}

type SortKey = "benefit" | "marginPercent" | "hdvPrice" | "costTotal" | "multiplier";

const ProfitabilityTable = ({
  results,
  onBack,
  onSave,
  quantities,
  onQuantityChange,
  onQuantityChangeAll,
  initialIncludedIds,
  onIncludedIdsChange,
  initialPriceInputs,
  onPriceInputsChange,
  onItemPricePersist,
  onResultsChange,
  initialAcknowledgedResources,
  onAcknowledgedResourcesChange,
  initialAcknowledgedItemResources,
  onAcknowledgedItemResourcesChange,
  onResourcePricePersist,
}: ProfitabilityTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("marginPercent");
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editableResults, setEditableResults] = useState<ProfitabilityResult[]>(results);
  const [resourceSortDesc, setResourceSortDesc] = useState(true);
  const [includedIds, setIncludedIds] = useState<Set<number>>(new Set(initialIncludedIds ?? results.map((r) => r.item.id)));
  const [expandedSortDesc, setExpandedSortDesc] = useState<Record<number, boolean>>({});
  const [acknowledgedResourceIds, setAcknowledgedResourceIds] = useState<Set<string>>(new Set());
  const [acknowledgedItemResources, setAcknowledgedItemResources] = useState<Record<number, Set<string>>>({});
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>(initialPriceInputs ?? {});
  const [filterProfitableOnly, setFilterProfitableOnly] = useState(false);
  const [filterMinMultiplier, setFilterMinMultiplier] = useState<number | null>(null);
  const [filterItemType, setFilterItemType] = useState<string | null>(null);
  const [editResource, setEditResource] = useState<{ id?: number; key?: string; name: string; unitPrice: number } | null>(null);
  const [editResourceInput, setEditResourceInput] = useState("");

  useEffect(() => {
    setEditableResults(results);
    onResultsChange?.(results);
    if (initialIncludedIds !== undefined) {
      setIncludedIds(new Set(initialIncludedIds));
    } else {
      setIncludedIds(new Set(results.map((r) => r.item.id)));
    }
    setAcknowledgedResourceIds(new Set());
    setAcknowledgedItemResources({});
    if (initialAcknowledgedResources) {
      setAcknowledgedResourceIds(new Set(initialAcknowledgedResources));
    }
    if (initialAcknowledgedItemResources) {
      const next: Record<number, Set<string>> = {};
      Object.entries(initialAcknowledgedItemResources).forEach(([id, arr]) => {
        next[Number(id)] = new Set(arr);
      });
      setAcknowledgedItemResources(next);
    }
  }, [results, initialIncludedIds, initialAcknowledgedResources, initialAcknowledgedItemResources, onResultsChange]);

  useEffect(() => {
    const initialPrices: Record<number, string> = {};
    if (initialPriceInputs && Object.keys(initialPriceInputs).length) {
      setPriceInputs(initialPriceInputs);
    } else {
      results.forEach((r) => {
        initialPrices[r.item.id] = r.hdvPrice ? String(r.hdvPrice) : "";
      });
      setPriceInputs(initialPrices);
    }
  }, [initialPriceInputs, results]);

  const itemTypes = useMemo(() => {
    const types = new Set(editableResults.map((r) => r.item.type));
    return Array.from(types).sort();
  }, [editableResults]);

  const filteredResults = useMemo(() => {
    return editableResults.filter((r) => {
      if (filterProfitableOnly && r.benefit <= 0) return false;
      if (filterMinMultiplier !== null && r.costTotal > 0) {
        const qty = r.quantity ?? quantities[r.item.id] ?? 1;
        const revenue = r.hdvPrice * qty;
        const multiplier = revenue / r.costTotal;
        if (multiplier < filterMinMultiplier) return false;
      }
      if (filterItemType && r.item.type !== filterItemType) return false;
      return true;
    });
  }, [editableResults, filterProfitableOnly, filterMinMultiplier, filterItemType, quantities]);

  const sortedResults = [...filteredResults].sort((a, b) => {
    const includedWeightA = includedIds.has(a.item.id) ? 0 : 1;
    const includedWeightB = includedIds.has(b.item.id) ? 0 : 1;
    if (includedWeightA !== includedWeightB) return includedWeightA - includedWeightB; // included first
    const multiplier = sortDesc ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

  const includedResults = useMemo(
    () => editableResults.filter((r) => includedIds.has(r.item.id)),
    [editableResults, includedIds],
  );

  const allIncluded = includedIds.size === editableResults.length && editableResults.length > 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const toggleRowExpand = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatKamas = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toLocaleString("fr-FR");
  };

  const totalBenefit = includedResults.reduce((sum, r) => sum + r.benefit, 0);
  const bestItem = useMemo(() => {
    if (!includedResults.length) return undefined;
    return includedResults.reduce((best, cur) => (cur.benefit > (best?.benefit ?? -Infinity) ? cur : best),
      undefined as ProfitabilityResult | undefined);
  }, [includedResults]);
  const profitableCount = includedResults.filter((r) => r.benefit > 0).length;

  const commitPriceChange = (id: number, raw: string) => {
    const clean = parseInt(raw.replace(/\D/g, "")) || 0;
    const nextInputs = { ...priceInputs, [id]: clean ? String(clean) : "" };
    setPriceInputs(nextInputs);
    onPriceInputsChange?.(nextInputs);
    onItemPricePersist?.(id, clean);
    setEditableResults((prev) => {
      const next = prev.map((res) => {
        if (res.item.id !== id) return res;
        const qty = res.quantity ?? quantities[id] ?? 1;
        const hdvPrice = clean;
        const revenue = hdvPrice * qty;
        const benefit = revenue - res.costTotal;
        const marginPercent = revenue > 0 ? (benefit / revenue) * 100 : 0;
        return { ...res, hdvPrice, benefit, marginPercent };
      });
      onResultsChange?.(next);
      return next;
    });
  };

  const updateResourceUnitPrice = (resourceKey: string | null, resourceId: number | undefined, newPrice: number) => {
    onResourcePricePersist?.(resourceId, newPrice);
    setEditableResults((prev) => {
      const next = prev.map((res) => {
        const resources = (res.resources ?? []).map((r) => {
          const matchesId = resourceId !== undefined && r.id === resourceId;
          const matchesKey = resourceKey ? getResourceKey(r) === resourceKey : false;
          if (!matchesId && !matchesKey) return r;
          const totalCost = (r.totalQuantity ?? 0) * newPrice;
          return { ...r, unitPrice: newPrice, totalCost };
        });
        const costTotal = resources.reduce((sum, r) => sum + r.totalCost, 0);
        const qty = res.quantity ?? quantities[res.item.id] ?? 1;
        const revenue = res.hdvPrice * qty;
        const benefit = revenue - costTotal;
        const marginPercent = revenue > 0 ? (benefit / revenue) * 100 : 0;
        return { ...res, resources, costTotal, benefit, marginPercent };
      });
      onResultsChange?.(next);
      return next;
    });
  };

  const openEditResource = (resource: Resource, resourceKey?: string) => {
    setEditResource({ id: resource.id, key: resourceKey ?? getResourceKey(resource), name: resource.name, unitPrice: resource.unitPrice });
    setEditResourceInput(resource.unitPrice ? String(resource.unitPrice) : "");
  };

  type AggregatedResource = Resource & { key: string };

  const getResourceKey = (res: { name?: string; id?: number }) => {
    if (res.name && res.name.trim()) return res.name.toLowerCase();
    return `res-${res.id ?? Math.random().toString(36).slice(2)}`;
  };

  const aggregatedResources = useMemo<AggregatedResource[]>(() => {
    const map = new Map<string, AggregatedResource>();
    editableResults.forEach((res) => {
      if (!includedIds.has(res.item.id)) return;
      const resources = res.resources ?? [];
      resources.forEach((r) => {
        const key = getResourceKey(r);
        const existing = map.get(key);
        const totalQuantity = (existing?.totalQuantity || 0) + (r.totalQuantity ?? 0);
        const totalCost = (existing?.totalCost || 0) + (r.totalCost ?? 0);
        if (existing) {
          map.set(key, {
            ...existing,
            totalQuantity,
            totalCost,
          });
        } else {
          map.set(key, {
            ...r,
            name: r.name || existing?.name || "Ressource",
            key,
            totalQuantity,
            totalCost,
          });
        }
      });
    });
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const diff = a.totalCost - b.totalCost;
      if (diff !== 0) return diff;
      return a.totalQuantity - b.totalQuantity;
    });
    return resourceSortDesc ? arr.reverse() : arr;
  }, [editableResults, resourceSortDesc, includedIds]);

  const aggregatedResourceUsage = useMemo(() => {
    const usage: Record<string, { itemId: number; itemName: string; quantity: number }[]> = {};
    editableResults.forEach((res) => {
      if (!includedIds.has(res.item.id)) return;
      (res.resources ?? []).forEach((r) => {
        const key = getResourceKey(r);
        const qty = r.totalQuantity ?? r.quantity ?? 0;
        if (!usage[key]) usage[key] = [];
        usage[key].push({ itemId: res.item.id, itemName: res.item.name, quantity: qty });
      });
    });
    return usage;
  }, [editableResults, includedIds]);

  const aggregatedTotalCostAll = useMemo(
    () => aggregatedResources.reduce((sum, r) => sum + r.totalCost, 0),
    [aggregatedResources],
  );

  const aggregatedTotalCost = useMemo(
    () => aggregatedResources
      .filter((r) => !acknowledgedResourceIds.has(r.key))
      .reduce((sum, r) => sum + r.totalCost, 0),
    [aggregatedResources, acknowledgedResourceIds],
  );

  const allAggregatedAcknowledged = aggregatedResources.length > 0
    && aggregatedResources.every((r) => acknowledgedResourceIds.has(r.key));

  useEffect(() => {
    setAcknowledgedResourceIds((prev) => {
      const existingIds = new Set(aggregatedResources.map((r) => r.key));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (existingIds.has(id)) next.add(id);
      });
      if (onAcknowledgedResourcesChange) {
        onAcknowledgedResourcesChange(Array.from(next));
      }
      return next;
    });
  }, [aggregatedResources, onAcknowledgedResourcesChange]);

  const toggleAcknowledgedItemResource = (itemId: number, resKey: string) => {
    setAcknowledgedItemResources((prev) => {
      const current = prev[itemId] ? new Set(prev[itemId]) : new Set<string>();
      if (current.has(resKey)) current.delete(resKey);
      else current.add(resKey);
      const next = { ...prev, [itemId]: current };
      if (onAcknowledgedItemResourcesChange) {
        const serialized: Record<number, string[]> = {};
        Object.entries(next).forEach(([id, set]) => {
          const arr = Array.from(set as Set<string>);
          if (arr.length) serialized[Number(id)] = arr;
        });
        onAcknowledgedItemResourcesChange(serialized);
      }
      return next;
    });
  };

  const computeExpandedCostStyle = (resources: Resource[]) => {
    const max = resources.reduce((m, r) => Math.max(m, r.totalCost), 0);
    return (cost: number) => {
      if (max <= 0) return { color: "hsl(var(--loss))" };
      const ratio = Math.min(1, cost / max);
      const start = [245, 210, 210];
      const end = [220, 38, 38];
      const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);
      const [r, g, b] = [mix(start[0], end[0]), mix(start[1], end[1]), mix(start[2], end[2])];
      return { color: `rgb(${r}, ${g}, ${b})` };
    };
  };

  const maxResourceCost = useMemo(() => {
    return aggregatedResources.reduce((max, r) => Math.max(max, r.totalCost), 0);
  }, [aggregatedResources]);

  const costColorStyle = (cost: number) => {
    if (maxResourceCost <= 0) return { color: "hsl(var(--loss))" };
    const ratio = Math.min(1, cost / maxResourceCost);
    // Map ratio to a two-stop gradient: light loss → full loss
    const start = [245, 210, 210]; // light red/pink
    const end = [220, 38, 38]; // darker red
    const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);
    const [r, g, b] = [mix(start[0], end[0]), mix(start[1], end[1]), mix(start[2], end[2])];
    return { color: `rgb(${r}, ${g}, ${b})` };
  };

  const exportToCsv = () => {
    const headers = ["Item", "Niveau", "Qté", "Coût Total", "Prix HDV", "Bénéfice", "Rendement"];
    const rows = sortedResults.map((r) => {
      const qty = r.quantity ?? quantities[r.item.id] ?? 1;
      const revenue = r.hdvPrice * qty;
      const multiplier = r.costTotal > 0 ? revenue / r.costTotal : 0;
      return [
        r.item.name,
        r.item.level,
        qty,
        r.costTotal,
        r.hdvPrice,
        r.benefit,
        `${multiplier.toFixed(1)}x`,
      ];
    });
    
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dofinvest_analyse.csv";
    a.click();
  };

  return (
    <>
      <div className="space-y-6 pb-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Total benefit */}
          <div className="card-dofus rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Bénéfice total potentiel</p>
          <p className={cn(
            "text-2xl font-bold font-heading",
            totalBenefit >= 0 ? "text-profit" : "text-loss"
          )}>
            {formatKamas(totalBenefit)} kamas
          </p>
        </div>

          {/* Total cost */}
          <div className="card-dofus rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Coût total des ressources</p>
            <p className="text-2xl font-bold font-heading text-loss">
            {formatKamas(aggregatedTotalCostAll)} kamas
            </p>
          </div>

        {/* Best item */}
        {bestItem && (
          <div className="card-dofus rounded-xl p-5 border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <p className="text-sm text-muted-foreground">Meilleur craft</p>
            </div>
            <p className="text-lg font-semibold text-primary truncate">{bestItem.item.name}</p>
            <p className="text-sm text-profit">+{formatKamas(bestItem.benefit)} k</p>
          </div>
        )}

        {/* Stats */}
        <div className="card-dofus rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">Rentabilité</p>
          <p className="text-2xl font-bold text-foreground">
            {profitableCount}/{results.length}
          </p>
          <p className="text-xs text-muted-foreground">items rentables</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button variant="outline" onClick={onBack}>
          ← Ajouter des items
        </Button>
        <Button variant="limeOutline" onClick={exportToCsv} className="gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
        {onSave && (
          <Button variant="lime" onClick={onSave} className="gap-2">
            Sauvegarder l'analyse
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 card-dofus rounded-xl">
        <span className="text-sm text-muted-foreground">Filtres:</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filterProfitableOnly}
            onChange={(e) => setFilterProfitableOnly(e.target.checked)}
            className="h-4 w-4"
          />
          Rentables uniquement
        </label>
        <select
          value={filterMinMultiplier ?? ""}
          onChange={(e) => setFilterMinMultiplier(e.target.value ? Number(e.target.value) : null)}
          className="bg-secondary border border-border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Tous rendements</option>
          <option value="1.5">≥ 1.5x</option>
          <option value="2">≥ 2x</option>
          <option value="3">≥ 3x</option>
          <option value="5">≥ 5x</option>
          <option value="10">≥ 10x</option>
        </select>
        <select
          value={filterItemType ?? ""}
          onChange={(e) => setFilterItemType(e.target.value || null)}
          className="bg-secondary border border-border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Tous types</option>
          {itemTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {(filterProfitableOnly || filterMinMultiplier !== null || filterItemType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterProfitableOnly(false);
              setFilterMinMultiplier(null);
              setFilterItemType(null);
            }}
          >
            Réinitialiser
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {sortedResults.length}/{editableResults.length} items
        </span>
      </div>

      {/* Table */}
      <div className="card-dofus rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-foreground">Item</TableHead>
              <TableHead className="text-center w-28">
                <div className="flex items-center justify-center gap-3 pl-2">
                  <input
                    type="checkbox"
                    checked={allIncluded}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const next = new Set(editableResults.map((r) => r.item.id));
                        setIncludedIds(next);
                        onIncludedIdsChange?.(Array.from(next));
                      } else {
                        setIncludedIds(new Set());
                        onIncludedIdsChange?.([]);
                      }
                    }}
                    className="h-4 w-4"
                  />
                  {typeof onQuantityChangeAll === "function" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Qté</span>
                      <input
                        type="number"
                        min={1}
                        placeholder="–"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newQty = Math.max(1, Number(e.target.value) || 1);
                          onQuantityChangeAll(newQty);
                        }}
                        className="input-dofus no-spin w-14 h-7 rounded px-2 text-[11px] text-right bg-secondary/60 border border-border focus:border-primary focus-visible:ring-0"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Qté</span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleSort("costTotal")}
              >
                <div className="flex items-center gap-1">
                  Coût
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleSort("hdvPrice")}
              >
                <div className="flex items-center gap-1">
                  Prix HDV
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleSort("benefit")}
              >
                <div className="flex items-center gap-1">
                  Bénéfice
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleSort("marginPercent")}
              >
                <div className="flex items-center gap-1">
                  Rend.
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((result, index) => (
              <Fragment key={result.item.id}>
                <TableRow
                  key={result.item.id}
                  className={cn(
                    "border-border cursor-pointer transition-colors",
                    result.benefit >= 0 ? "profit-row" : "loss-row",
                    !includedIds.has(result.item.id) && "opacity-50 bg-muted/30"
                  )}
                  onClick={() => toggleRowExpand(result.item.id)}
                >
                  <TableCell>
                  <div className="flex items-center gap-3">
                    {index === 0 && result.benefit > 0 && (
                      <Trophy className="w-5 h-5 text-primary animate-pulse-lime" />
                    )}
                    <img
                        src={result.item.iconUrl}
                        alt={result.item.name}
                        className="w-10 h-10 rounded-lg"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          const fallback = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(result.item.name)}`;
                          e.currentTarget.src = fallback;
                        }}
                      />
                    <div>
                      <p className="font-medium text-foreground">{result.item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Niv. {result.item.level} • {result.item.type}
                      </p>
                    </div>
                  </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includedIds.has(result.item.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setIncludedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(result.item.id);
                            else next.delete(result.item.id);
                            onIncludedIdsChange?.(Array.from(next));
                            return next;
                          });
                        }}
                        className="h-4 w-4"
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.target.blur()}
                      />
                      <span className="text-xs text-muted-foreground">Inclure</span>
                      <input
                        type="number"
                        min={1}
                        value={result.quantity ?? quantities[result.item.id] ?? 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newQty = Math.max(1, Number(e.target.value) || 1);
                          const prevQty = result.quantity ?? quantities[result.item.id] ?? 1;
                          const factor = newQty / prevQty;
                          onQuantityChange(result.item.id, newQty);
                          setEditableResults((prev) => {
                            const next = prev.map((r) => {
                              if (r.item.id !== result.item.id) return r;
                              const scaledResources = r.resources.map((res) => {
                                const totalQuantity = Math.round((res.totalQuantity ?? res.quantity ?? 0) * factor);
                                const totalCost = totalQuantity * res.unitPrice;
                                return { ...res, totalQuantity, totalCost };
                              });
                              const costTotal = scaledResources.reduce((sum, res) => sum + res.totalCost, 0);
                              const revenue = r.hdvPrice * newQty;
                              const benefit = revenue - costTotal;
                              const marginPercent = revenue > 0 ? (benefit / revenue) * 100 : 0;
                              return {
                                ...r,
                                quantity: newQty,
                                resources: scaledResources,
                                costTotal,
                                benefit,
                                marginPercent,
                              };
                            });
                            onResultsChange?.(next);
                            return next;
                          });
                        }}
                        className="input-dofus no-spin w-16 h-9 rounded px-3 text-sm text-right bg-secondary/60 border border-border focus:border-primary focus-visible:ring-0"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatKamas(result.costTotal)}
                  </TableCell>
                  <TableCell className="text-primary font-medium">
                    <input
                      type="text"
                      value={priceInputs[result.item.id] ?? (result.hdvPrice ? String(result.hdvPrice) : "")}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setPriceInputs((prev) => ({ ...prev, [result.item.id]: e.target.value }))}
                      onBlur={(e) => commitPriceChange(result.item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          commitPriceChange(result.item.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-24 bg-transparent border border-border rounded px-2 py-1 text-primary text-right text-sm focus:outline-none focus:border-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {result.benefit >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-profit" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-loss" />
                      )}
                      <span
                        className={cn(
                          "font-semibold",
                          result.benefit >= 0 ? "text-profit" : "text-loss"
                        )}
                      >
                        {result.benefit >= 0 ? "+" : ""}
                        {formatKamas(result.benefit)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const qty = result.quantity ?? quantities[result.item.id] ?? 1;
                      const revenue = result.hdvPrice * qty;
                      const multiplier = result.costTotal > 0 ? revenue / result.costTotal : 0;
                      const isProfit = multiplier >= 1;
                      return (
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            multiplier >= 2
                              ? "bg-profit/20 text-profit"
                              : isProfit
                              ? "bg-primary/20 text-primary"
                              : "bg-loss/20 text-loss"
                          )}
                        >
                          {multiplier.toFixed(1)}x
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {expandedRows.has(result.item.id) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded row - recipe details */}
                {expandedRows.has(result.item.id) && (
                  <TableRow className="bg-secondary/30 border-border">
                    <TableCell colSpan={7} className="py-4">
                      <div className="pl-4 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {(() => {
                          const sortDesc = expandedSortDesc[result.item.id] ?? true;
                            const sortedResources = [...(result.resources ?? [])].sort((a, b) => {
                              const diff = a.totalCost - b.totalCost;
                              return sortDesc ? -diff : diff;
                            });
                            const colorFn = computeExpandedCostStyle(sortedResources);
                            return sortedResources.map((res) => (
                              <div
                                key={`${getResourceKey(res)}-${result.item.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAcknowledgedItemResource(result.item.id, getResourceKey(res));
                                }}
                                className={cn(
                                  "group relative flex items-center gap-2 p-2 rounded-lg bg-background/50 cursor-pointer transition",
                                  (acknowledgedItemResources[result.item.id]?.has(getResourceKey(res))) && "opacity-50 grayscale"
                                )}
                              >
                                <button
                                  className="hidden group-hover:flex absolute top-1 right-1 text-[10px] px-2 py-1 rounded bg-secondary text-foreground border border-border"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditResource(res as Resource, getResourceKey(res));
                                  }}
                                >
                                  Modifier
                                </button>
                                <button
                                  className="hidden group-hover:flex absolute top-1 right-1 text-[10px] px-2 py-1 rounded bg-secondary text-foreground border border-border"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditResource(res as Resource, getResourceKey(res));
                                  }}
                                >
                                  Modifier
                                </button>
                                <img
                                  src={res.iconUrl}
                                  alt={res.name}
                                  className="w-8 h-8 rounded"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    const fallback = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(res.name)}`;
                                    e.currentTarget.src = fallback;
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-foreground truncate">
                                    {res.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {res.totalQuantity} × {formatKamas(res.unitPrice)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Coût</p>
                                  <p className="text-sm font-semibold" style={colorFn(res.totalCost)}>
                                    {formatKamas(res.totalCost)}
                                  </p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Aggregated resources summary */}
      {aggregatedResources.length > 0 && (
        <div className="card-dofus rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Ressources totales à acheter</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{aggregatedResources.length} ressources</span>
              <span className="text-sm font-semibold text-loss">
                Total: {formatKamas(aggregatedTotalCost)} kamas
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAcknowledgedResourceIds((prev) => {
                    if (allAggregatedAcknowledged) return new Set<string>();
                    return new Set(aggregatedResources.map((r) => r.key));
                  });
                  onAcknowledgedResourcesChange?.(
                    allAggregatedAcknowledged ? [] : aggregatedResources.map((r) => r.key)
                  );
                }}
              >
                {allAggregatedAcknowledged ? "Tout dégriser" : "Tout griser"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResourceSortDesc((prev) => !prev)}
              >
                Trier par coût {resourceSortDesc ? "↓" : "↑"}
              </Button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {aggregatedResources.map((res) => (
              <Tooltip key={res.key} delayDuration={50}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => {
                      setAcknowledgedResourceIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(res.key)) next.delete(res.key);
                        else next.add(res.key);
                        if (onAcknowledgedResourcesChange) {
                          onAcknowledgedResourcesChange(Array.from(next));
                        }
                        return next;
                      });
                    }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 cursor-pointer transition",
                      acknowledgedResourceIds.has(res.key) && "opacity-50 grayscale"
                    )}
                  >
                    <button
                      className="hidden group-hover:flex absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-secondary text-foreground border border-border"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditResource(res as Resource, res.key);
                      }}
                    >
                      Modifier
                    </button>
                    <img
                      src={res.iconUrl}
                      alt={res.name}
                      className="h-10 w-10 rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        const fallback = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(res.name)}`;
                        e.currentTarget.src = fallback;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{res.name}</p>
                      <p className="text-sm font-semibold text-primary flex items-center gap-2">
                        <span>{res.totalQuantity} unités</span>
                        <span className="text-xs text-muted-foreground">{formatKamas(res.unitPrice)} u</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Coût total</p>
                      <p className="font-semibold" style={costColorStyle(res.totalCost)}>
                        {formatKamas(res.totalCost)}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs space-y-1">
                  <p className="text-xs font-semibold">Utilisé par :</p>
                  {(aggregatedResourceUsage[res.key] ?? []).slice(0, 6).map((u) => (
                    <p key={`${res.key}-${u.itemId}`} className="text-xs text-muted-foreground truncate">
                      {u.itemName} — {u.quantity}x
                    </p>
                  ))}
                  {!(aggregatedResourceUsage[res.key] ?? []).length && (
                    <p className="text-xs text-muted-foreground">Aucun détail</p>
                  )}
                  {(aggregatedResourceUsage[res.key] ?? []).length > 6 && (
                    <p className="text-[10px] text-muted-foreground">+{(aggregatedResourceUsage[res.key] ?? []).length - 6} autres</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
      </div>
      <Dialog open={!!editResource} onOpenChange={(open) => { if (!open) setEditResource(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le prix</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{editResource?.name}</p>
            <Input
              type="number"
              inputMode="numeric"
              value={editResourceInput}
              onChange={(e) => setEditResourceInput(e.target.value)}
              placeholder="Prix unitaire (kamas)"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditResource(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!editResource) return;
                const clean = parseInt(editResourceInput.replace(/\D/g, "")) || 0;
                updateResourceUnitPrice(editResource.key ?? null, editResource.id, clean);
                setEditResource(null);
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfitabilityTable;
