import { useState } from "react";
import { ProfitabilityResult } from "@/types/dofus";
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
}

type SortKey = "benefit" | "marginPercent" | "hdvPrice" | "costTotal";

const ProfitabilityTable = ({ results, onBack }: ProfitabilityTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("benefit");
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const sortedResults = [...results].sort((a, b) => {
    const multiplier = sortDesc ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

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

  const totalBenefit = results.reduce((sum, r) => sum + r.benefit, 0);
  const bestItem = sortedResults[0];
  const profitableCount = results.filter((r) => r.benefit > 0).length;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Table */}
      <div className="card-dofus rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-foreground">Item</TableHead>
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
                      />
                      <div>
                        <p className="font-medium text-foreground">{result.item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Niv. {result.item.level} • {result.item.type}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatKamas(result.costTotal)}
                  </TableCell>
                  <TableCell className="text-primary font-medium">
                    {formatKamas(result.hdvPrice)}
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
                    <TableCell colSpan={6} className="py-4">
                      <div className="pl-4">
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Recette de craft:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {result.resources.map((res) => (
                            <div
                              key={res.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                            >
                              <img
                                src={res.iconUrl}
                                alt={res.name}
                                className="w-8 h-8 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground truncate">
                                  {res.name}
                                </p>
                              <p className="text-xs text-muted-foreground">
                                {res.totalQuantity} × {formatKamas(res.unitPrice)} ={" "}
                                <span className="text-primary">{formatKamas(res.totalCost)}</span>
                              </p>
                            </div>
                          </div>
                        ))}
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
    </div>
  );
};

export default ProfitabilityTable;
