import { useEffect, useMemo, useState } from "react";
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
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfitabilityTableProps {
  results: ProfitabilityResult[];
  onBack: () => void;
  onSave?: () => void;
  quantities: Record<number, number>;
  onQuantityChange: (id: number, qty: number) => void;
}

type SortKey = "benefit" | "marginPercent" | "hdvPrice" | "costTotal";

const ProfitabilityTable = ({ results, onBack, onSave, quantities, onQuantityChange }: ProfitabilityTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("marginPercent");
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editableResults, setEditableResults] = useState<ProfitabilityResult[]>(results);
  const [resourceSortDesc, setResourceSortDesc] = useState(true);
  const [includedIds, setIncludedIds] = useState<Set<number>>(new Set(results.map((r) => r.item.id)));
  const [expandedSortDesc, setExpandedSortDesc] = useState<Record<number, boolean>>({});
  const [acknowledgedResourceIds, setAcknowledgedResourceIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setEditableResults(results);
    setIncludedIds(new Set(results.map((r) => r.item.id)));
    setAcknowledgedResourceIds(new Set());
  }, [results]);

  const sortedResults = [...editableResults].sort((a, b) => {
    const multiplier = sortDesc ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

  const includedResults = useMemo(
    () => editableResults.filter((r) => includedIds.has(r.item.id)),
    [editableResults, includedIds],
  );

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

  const handlePriceChange = (id: number, value: string) => {
    const clean = parseInt(value.replace(/\D/g, "")) || 0;
    setEditableResults((prev) =>
      prev.map((res) => {
        if (res.item.id !== id) return res;
        const qty = res.quantity ?? quantities[id] ?? 1;
        const hdvPrice = clean;
        const revenue = hdvPrice * qty;
        const benefit = revenue - res.costTotal;
        const marginPercent = revenue > 0 ? (benefit / revenue) * 100 : 0;
        return { ...res, hdvPrice, benefit, marginPercent };
      }),
    );
  };

  const aggregatedResources = useMemo(() => {
    const map = new Map<number, Resource & { name: string; iconUrl: string }>();
    editableResults.forEach((res) => {
      if (!includedIds.has(res.item.id)) return;
      res.resources.forEach((r) => {
        const current = map.get(r.id);
        const totalQuantity = (current?.totalQuantity || 0) + r.totalQuantity;
        const unitPrice = r.unitPrice;
        map.set(r.id, {
          ...r,
          totalQuantity,
          totalCost: unitPrice * totalQuantity,
        });
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

  const aggregatedTotalCost = useMemo(
    () => aggregatedResources.reduce((sum, r) => sum + r.totalCost, 0),
    [aggregatedResources],
  );

  useEffect(() => {
    setAcknowledgedResourceIds((prev) => {
      const existingIds = new Set(aggregatedResources.map((r) => r.id));
      const next = new Set<number>();
      prev.forEach((id) => {
        if (existingIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [aggregatedResources]);

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
    const headers = ["Item", "Niveau", "Coût Total", "Prix HDV", "Bénéfice", "Marge %"];
    const rows = sortedResults.map((r) => [
      r.item.name,
      r.item.level,
      r.costTotal,
      r.hdvPrice,
      r.benefit,
      `${r.marginPercent.toFixed(1)}%`,
    ]);
    
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dofinvest_analyse.csv";
    a.click();
  };

  return (
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
            {formatKamas(aggregatedTotalCost)} kamas
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
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onBack}>
            ← Nouvelle analyse
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

      {/* Table */}
      <div className="card-dofus rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-foreground">Item</TableHead>
              <TableHead className="text-center">Qté</TableHead>
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
                  Marge
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((result, index) => (
              <>
                <TableRow
                  key={result.item.id}
                  className={cn(
                    "border-border cursor-pointer transition-colors",
                    result.benefit >= 0 ? "profit-row" : "loss-row"
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
                            return next;
                          });
                        }}
                        className="h-4 w-4"
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
                          setEditableResults((prev) =>
                            prev.map((r) => {
                              if (r.item.id !== result.item.id) return r;
                              const scaledResources = r.resources.map((res) => ({
                                ...res,
                                totalQuantity: res.totalQuantity * factor,
                                totalCost: res.totalCost * factor,
                              }));
                              const costTotal = r.costTotal * factor;
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
                            }),
                          );
                        }}
                        className="input-dofus w-16 h-9 rounded px-3 text-sm text-right bg-secondary/60 border border-border focus:border-primary focus-visible:ring-0"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatKamas(result.costTotal)}
                  </TableCell>
                  <TableCell className="text-primary font-medium">
                    <input
                      type="text"
                      value={formatKamas(result.hdvPrice)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handlePriceChange(result.item.id, e.target.value)}
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
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        result.marginPercent >= 30
                          ? "bg-profit/20 text-profit"
                          : result.marginPercent >= 0
                          ? "bg-primary/20 text-primary"
                          : "bg-loss/20 text-loss"
                      )}
                    >
                      {result.marginPercent.toFixed(1)}%
                    </span>
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground">Recette de craft</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSortDesc((prev) => ({
                                ...prev,
                                [result.item.id]: !prev[result.item.id],
                              }));
                            }}
                          >
                            Trier par coût {expandedSortDesc[result.item.id] ? "↓" : "↑"}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {(() => {
                          const sortDesc = expandedSortDesc[result.item.id] ?? true;
                            const sortedResources = [...result.resources].sort((a, b) => {
                              const diff = a.totalCost - b.totalCost;
                              return sortDesc ? -diff : diff;
                            });
                            const colorFn = computeExpandedCostStyle(sortedResources);
                            return sortedResources.map((res) => (
                              <div
                                key={res.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                              >
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
              </>
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
              <div
                key={res.id}
                onClick={() => {
                  setAcknowledgedResourceIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(res.id)) next.delete(res.id);
                    else next.add(res.id);
                    return next;
                  });
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 cursor-pointer transition",
                  acknowledgedResourceIds.has(res.id) && "opacity-50 grayscale"
                )}
              >
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
                  <p className="text-sm font-semibold text-primary">{res.totalQuantity} unités</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Coût total</p>
                  <p className="font-semibold" style={costColorStyle(res.totalCost)}>
                    {formatKamas(res.totalCost)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitabilityTable;
