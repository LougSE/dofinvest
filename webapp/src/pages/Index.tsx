import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { DofusItem, Resource, ProfitabilityResult } from "@/types/dofus";
import { useItemsSearch } from "@/hooks/useItemsSearch";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import ItemGrid from "@/components/ItemGrid";
import SelectionPanel from "@/components/SelectionPanel";
import PriceInputModal from "@/components/PriceInputModal";
import ProfitabilityTable from "@/components/ProfitabilityTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ViewState = "search" | "results";

interface SavedAnalysis {
  id: string;
  name: string;
  date: string;
  items: DofusItem[];
  results: ProfitabilityResult[];
  dataset: "20" | "129";
  quantities: Record<number, number>;
  includedIds: number[];
  priceInputs: Record<number, string>;
  acknowledgedResources?: string[];
  acknowledgedItemResources?: Record<number, string[]>;
}

const Index = () => {
  const tagOptions = [
    { label: "Tous", value: "all" },
    { label: "Ressource", value: "ressource" },
    { label: "Amulette", value: "amulette" },
    { label: "Anneau", value: "anneau" },
    { label: "Chapeau", value: "chapeau" },
    { label: "Cape", value: "cape" },
    { label: "Ceinture", value: "ceinture" },
    { label: "Bottes", value: "bottes" },
    { label: "Arme", value: "arme" },
    { label: "Baguette", value: "baguette" },
    { label: "Bâton", value: "bâton" },
    { label: "Arc", value: "arc" },
    { label: "Épée", value: "épée" },
    { label: "Dague", value: "dague" },
    { label: "Masse", value: "masse" },
    { label: "Hache", value: "hache" },
    { label: "Pelle", value: "pelle" },
    { label: "Outil", value: "outil" },
    { label: "Trophée", value: "trophée" },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [craftableOnly, setCraftableOnly] = useState(true);
  const [selectedItems, setSelectedItems] = useState<DofusItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("search");
  const [results, setResults] = useState<ProfitabilityResult[]>([]);
  const [latestEditableResults, setLatestEditableResults] = useState<ProfitabilityResult[]>([]);
  const [datasetVersion, setDatasetVersion] = useState<"20" | "129">(() => {
    try {
      const pref = localStorage.getItem("dofinvest_last_dataset:Abrak");
      if (pref === "20" || pref === "129") return pref;
    } catch (err) {
      console.error("Failed to read dataset pref", err);
    }
    return "20";
  });
  const [tagFilter, setTagFilter] = useState("all");
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [priceInputsState, setPriceInputsState] = useState<Record<number, string>>({});
  const [includedIdsState, setIncludedIdsState] = useState<number[]>([]);
  const [ackResourcesState, setAckResourcesState] = useState<string[]>([]);
  const [ackItemResourcesState, setAckItemResourcesState] = useState<Record<number, string[]>>({});
  const [hasRestoredLastAnalysis, setHasRestoredLastAnalysis] = useState(false);
  const server = "Abrak";
  const PAGE_SIZE = 60;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const lastAnalysisKey = useMemo(() => `dofinvest_last_analysis:${server}:${datasetVersion}`, [server, datasetVersion]);
  const persistDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lastAnalysisKey);
      if (!raw) {
        setHasRestoredLastAnalysis(false);
        setSelectedItems([]);
      setResults([]);
      setLatestEditableResults([]);
      setQuantities({});
      setIncludedIdsState([]);
      setPriceInputsState({});
      setAckResourcesState([]);
      setAckItemResourcesState({});
      return;
    }
    const parsed = JSON.parse(raw);
    setSelectedItems(parsed.items || []);
    setResults(parsed.results || []);
    setLatestEditableResults(parsed.results || []);
    setIncludedIdsState(parsed.includedIds || (parsed.results || []).map((r: ProfitabilityResult) => r.item.id));
      const qtyMap: Record<number, number> = {};
    (parsed.results || []).forEach((r: ProfitabilityResult) => {
      qtyMap[r.item.id] = r.quantity ?? 1;
    });
    setQuantities(qtyMap);
    setPriceInputsState(parsed.priceInputs || {});
    setAckResourcesState(parsed.acknowledgedResources || []);
    setAckItemResourcesState(parsed.acknowledgedItemResources || {});
    setHasRestoredLastAnalysis(true);
  } catch (err) {
    console.error("Failed to load last analysis", err);
    setHasRestoredLastAnalysis(false);
  }
  }, [lastAnalysisKey]);

  useEffect(() => {
    try {
      localStorage.setItem("dofinvest_last_dataset:Abrak", datasetVersion);
    } catch (err) {
      console.error("Failed to persist dataset pref", err);
    }
  }, [datasetVersion]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`dofinvest_saved_analyses:${server}:${datasetVersion}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedAnalyses(parsed || []);
      }
    } catch (err) {
      console.error("Failed to load saved analyses", err);
    }
  }, [server, datasetVersion]);

  const { items: searchResults, isLoading: isSearchLoading, error: searchError, isOfflineFallback, minQueryMet } = useItemsSearch({
    query: searchQuery,
    craftableOnly,
    page: 1,
    dataset: datasetVersion,
  });

  // Filter items based on search and craftable filter
  const filteredItems = useMemo(() => {
    const tag = tagFilter.trim().toLowerCase();
    if (!tag || tag === "all") return searchResults;
    return searchResults.filter((item) => item.type.toLowerCase().includes(tag));
  }, [searchResults, tagFilter]);

  const persistLastAnalysis = useCallback(
    ({
      items,
      resultsToPersist,
      quantitiesToPersist,
      includedIds,
      priceInputs,
      acknowledgedResources,
      acknowledgedItemResources,
    }: {
      items: DofusItem[];
      resultsToPersist: ProfitabilityResult[];
      quantitiesToPersist: Record<number, number>;
      includedIds: number[];
      priceInputs: Record<number, string>;
      acknowledgedResources?: string[];
      acknowledgedItemResources?: Record<number, string[]>;
    }) => {
      if (!resultsToPersist.length) return;
      try {
        localStorage.setItem(
          lastAnalysisKey,
          JSON.stringify({
            items,
            results: resultsToPersist,
            quantities: quantitiesToPersist,
            includedIds,
            priceInputs,
            acknowledgedResources,
            acknowledgedItemResources,
            timestamp: Date.now(),
          }),
        );
      } catch (err) {
        console.error("Failed to persist last analysis", err);
      }
    },
    [lastAnalysisKey],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, tagFilter, datasetVersion, craftableOnly, filteredItems.length]);

  useEffect(() => {
    if (!loaderRef.current) return;
    if (visibleCount >= filteredItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
        }
      },
      { rootMargin: "200px 0px", threshold: 0.1 },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filteredItems.length, visibleCount]);

  const handleSelectItem = (item: DofusItem) => {
    try {
      setSelectedItems((prev) => {
        const isSelected = prev.some((i) => i.id === item.id);
        const next = isSelected ? prev.filter((i) => i.id !== item.id) : [...prev, item];
        console.log("selection updated", { count: next.length, selectedIds: next.map((i) => i.id) });
        return next;
      });
      setQuantities((prev) => {
        if (prev[item.id]) return prev;
        return { ...prev, [item.id]: 1 };
      });
    } catch (err) {
      console.error("handleSelectItem failed", { err, item });
    }
  };

  const handleRemoveItem = (item: DofusItem) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedItems([]);
    setQuantities({});
  };

  const handleAnalyze = () => {
    console.log("analyze click", { selectedCount: selectedItems.length, selectedIds: selectedItems.map((i) => i.id) });
    if (selectedItems.length === 0) return;
    setIsPriceModalOpen(true);
  };

  const handleQuantityChange = (itemId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleConfirmPrices = (
    resources: Resource[],
    hdvPrices: { [key: number]: number }
  ) => {
    // Calculate profitability for each selected item
    const profitResults: ProfitabilityResult[] = selectedItems.map((item) => {
      const qty = quantities[item.id] ?? 1;
      // Get resources for this specific item
      const itemResources = item.recipe?.map((ingredient) => {
        const resource = resources.find((r) => r.id === ingredient.itemId);
        return {
          id: ingredient.itemId,
          name: ingredient.name,
          iconUrl: ingredient.iconUrl,
          totalQuantity: ingredient.quantity * qty,
          unitPrice: resource?.unitPrice || 0,
          totalCost: (resource?.unitPrice || 0) * ingredient.quantity * qty,
        };
      }) || [];

      const costTotal = itemResources.reduce((sum, r) => sum + r.totalCost, 0);
      const hdvPrice = hdvPrices[item.id] || 0; // per item
      const revenue = hdvPrice * qty;
      const benefit = revenue - costTotal;
      const marginPercent = revenue > 0 ? (benefit / revenue) * 100 : 0;

      return {
        item,
        quantity: qty,
        costTotal,
        hdvPrice,
        benefit,
        marginPercent,
        resources: itemResources,
      };
    });

    setResults(profitResults);
    setLatestEditableResults(profitResults);
    setViewState("results");
    setIsPriceModalOpen(false);
    setIncludedIdsState(profitResults.map((r) => r.item.id));
    const nextPriceInputs: Record<number, string> = {};
    profitResults.forEach((r) => {
      nextPriceInputs[r.item.id] = r.hdvPrice ? String(r.hdvPrice) : "";
    });
    setPriceInputsState(nextPriceInputs);

    persistLastAnalysis({
      items: selectedItems,
      resultsToPersist: profitResults,
      quantitiesToPersist: quantities,
      includedIds: profitResults.map((r) => r.item.id),
      priceInputs: nextPriceInputs,
      acknowledgedResources: ackResourcesState,
      acknowledgedItemResources: ackItemResourcesState,
    });
    schedulePersist();
  };

  const handleBackToSearch = () => {
    setViewState("search");
  };

  const handleDismissRestoredAnalysis = () => {
    setHasRestoredLastAnalysis(false);
    setResults([]);
    setLatestEditableResults([]);
    setSelectedItems([]);
    setQuantities({});
    setIncludedIdsState([]);
    setPriceInputsState({});
    setAckResourcesState([]);
    setAckItemResourcesState({});
    setAckResourcesState([]);
    setAckItemResourcesState({});
    try {
      localStorage.removeItem(lastAnalysisKey);
    } catch (err) {
      console.error("Failed to clear last analysis", err);
    }
  };

  const handleSaveAnalysis = () => {
    const id = `${Date.now()}`;
    const name = `Analyse ${savedAnalyses.length + 1}`;
    const date = new Date().toLocaleString();
      const payload: SavedAnalysis = {
        id,
        name,
        date,
        items: selectedItems,
        results: latestEditableResults.length ? latestEditableResults : results,
        dataset: datasetVersion,
        quantities,
        includedIds: includedIdsState.length ? includedIdsState : (latestEditableResults.length ? latestEditableResults : results).map((r) => r.item.id),
        priceInputs: priceInputsState,
        acknowledgedResources: ackResourcesState,
        acknowledgedItemResources: ackItemResourcesState,
      };
    setSavedAnalyses((prev) => {
      const next = [...prev, payload];
      try {
        localStorage.setItem(`dofinvest_saved_analyses:${server}:${datasetVersion}`, JSON.stringify(next));
      } catch (err) {
        console.error("Failed to persist saved analyses", err);
      }
      return next;
    });
  };

  const handleLoadAnalysis = (analysis: SavedAnalysis) => {
    if (analysis.dataset && analysis.dataset !== datasetVersion) {
      setDatasetVersion(analysis.dataset);
    }
    setSelectedItems(analysis.items || []);
    setResults(analysis.results || []);
    setLatestEditableResults(analysis.results || []);
    setQuantities(analysis.quantities || {});
    setIncludedIdsState(analysis.includedIds || []);
    setPriceInputsState(analysis.priceInputs || {});
    setAckResourcesState(analysis.acknowledgedResources || []);
    setAckItemResourcesState(analysis.acknowledgedItemResources || {});
    setViewState("results");
    persistLastAnalysis({
      items: analysis.items,
      resultsToPersist: analysis.results,
      quantitiesToPersist: analysis.quantities,
      includedIds: analysis.includedIds,
      priceInputs: analysis.priceInputs,
      acknowledgedResources: analysis.acknowledgedResources,
      acknowledgedItemResources: analysis.acknowledgedItemResources,
    });
    schedulePersist();
  };

  useEffect(() => {
    return () => {
      if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    };
  }, []);

  const schedulePersist = useCallback(() => {
    if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    persistDebounceRef.current = setTimeout(() => {
      if (viewState !== "results") return;
      const resultsToPersist = latestEditableResults.length ? latestEditableResults : results;
      if (!resultsToPersist.length) return;
      const included = includedIdsState.length ? includedIdsState : resultsToPersist.map((r) => r.item.id);
      persistLastAnalysis({
        items: selectedItems,
        resultsToPersist,
        quantitiesToPersist: quantities,
        includedIds: included,
        priceInputs: priceInputsState,
        acknowledgedResources: ackResourcesState,
        acknowledgedItemResources: ackItemResourcesState,
      });
    }, 300);
  }, [viewState, latestEditableResults, results, includedIdsState, selectedItems, quantities, priceInputsState, ackResourcesState, ackItemResourcesState, persistLastAnalysis]);

  return (
    <div className="min-h-screen relative">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-8">
      {viewState === "search" ? (
        <div className="space-y-8">
              {/* Hero section */}
              <section className="text-center max-w-3xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span>Calculez vos profits de craft en quelques clics</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-cinzel font-bold text-foreground mb-4">
                  Sélectionnez vos items à analyser
                </h2>
                <p className="text-muted-foreground">
                  Recherchez et sélectionnez les items que vous souhaitez crafter, 
                  puis entrez les prix du HDV pour calculer votre rentabilité.
                </p>
              </section>

              {/* Dataset & Search */}
              <div className="grid gap-4 md:grid-cols-[240px,1fr] items-start">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Version du jeu</p>
                  <Select value={datasetVersion} onValueChange={(v) => setDatasetVersion(v as "20" | "129") }>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">Dofus 2.0</SelectItem>
                      <SelectItem value="129">Dofus 1.29 (Retro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onFilterCraftable={setCraftableOnly}
                  craftableOnly={craftableOnly}
                  onSelectTag={(tag) => setTagFilter(tag)}
                  activeTag={tagFilter}
                />
              </div>

              {hasRestoredLastAnalysis && viewState === "search" && results.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Analyse précédente
                  </Badge>
                  <span className="text-sm text-muted-foreground flex-1 min-w-[200px]">
                    Une analyse sauvegardée est prête à être reprise.
                  </span>
                  <Button variant="limeOutline" size="sm" onClick={() => setViewState("results")}>
                    Ouvrir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDismissRestoredAnalysis}>
                    Ignorer
                  </Button>
                </div>
              )}

              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredItems.length} item{filteredItems.length > 1 ? "s" : ""} trouvé{filteredItems.length > 1 ? "s" : ""}
                </p>
              </div>

              {/* Item grid */}
              <ItemGrid
                items={filteredItems.slice(0, visibleCount)}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
              />

              {filteredItems.length > visibleCount && (
                <div ref={loaderRef} className="flex justify-center py-6 text-sm text-muted-foreground">
                  Chargement...
                </div>
              )}

              {isSearchLoading && (
                <p className="text-center text-sm text-muted-foreground">Chargement des items...</p>
              )}

              {searchError && (
                <p className="text-center text-sm text-loss">{searchError}</p>
              )}

              {isOfflineFallback && (
                <p className="text-center text-xs text-muted-foreground">
                  Mode démo (cache local) — vérifiez votre connexion Dofapi.
                </p>
              )}

              {/* Selection panel */}
              <SelectionPanel
                selectedItems={selectedItems}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearAll}
                onAnalyze={handleAnalyze}
              />

              {/* Price input modal */}
              {isPriceModalOpen && (
                <PriceInputModal
                  isOpen={isPriceModalOpen}
                  onClose={() => setIsPriceModalOpen(false)}
                  selectedItems={selectedItems}
                  onConfirm={handleConfirmPrices}
                  server={server}
                  dataset={datasetVersion}
                />
              )}

              {/* Bottom padding for selection panel */}
              {selectedItems.length > 0 && <div className="h-32" />}
            </div>
          ) : (
            <div className="space-y-6">
      <ProfitabilityTable
        results={results}
        onBack={handleBackToSearch}
        onSave={selectedItems.length > 0 && results.length > 0 ? handleSaveAnalysis : undefined}
        quantities={quantities}
        onQuantityChange={(id, qty) => {
          handleQuantityChange(id, qty);
          schedulePersist();
        }}
        onQuantityChangeAll={(qty) => {
          setQuantities((prev) => {
            const next: Record<number, number> = {};
            Object.keys(prev).forEach((key) => {
              next[Number(key)] = qty;
            });
            return next;
          });
          setResults((prev) => {
            return prev.map((r) => {
              const prevQty = r.quantity ?? 1;
              const factor = qty / prevQty;
              const resources = (r.resources ?? []).map((res) => {
                const totalQuantity = (res.totalQuantity ?? 0) * factor;
                const totalCost = totalQuantity * res.unitPrice;
                return { ...res, totalQuantity, totalCost };
              });
              const costTotal = resources.reduce((sum, res) => sum + res.totalCost, 0);
              const revenue = r.hdvPrice * qty;
              const benefit = revenue - costTotal;
              const marginPercent = revenue > 0 ? (benefit / revenue) * 100 : 0;
              return { ...r, quantity: qty, resources, costTotal, benefit, marginPercent };
            });
          });
          setLatestEditableResults((prev) => {
            return prev.map((r) => {
              const prevQty = r.quantity ?? 1;
              const factor = qty / prevQty;
              const resources = (r.resources ?? []).map((res) => {
                const totalQuantity = (res.totalQuantity ?? 0) * factor;
                const totalCost = totalQuantity * res.unitPrice;
                return { ...res, totalQuantity, totalCost };
              });
              const costTotal = resources.reduce((sum, res) => sum + res.totalCost, 0);
              const revenue = r.hdvPrice * qty;
              const benefit = revenue - costTotal;
              const marginPercent = revenue > 0 ? (benefit / revenue) * 100 : 0;
              return { ...r, quantity: qty, resources, costTotal, benefit, marginPercent };
            });
          });
          schedulePersist();
        }}
        initialIncludedIds={includedIdsState}
        onIncludedIdsChange={(ids) => {
          setIncludedIdsState(ids);
          schedulePersist();
        }}
        initialPriceInputs={priceInputsState}
        onPriceInputsChange={(inputs) => {
          setPriceInputsState(inputs);
          schedulePersist();
        }}
        initialAcknowledgedResources={ackResourcesState}
        onAcknowledgedResourcesChange={(keys) => {
          setAckResourcesState(keys);
          schedulePersist();
        }}
        initialAcknowledgedItemResources={ackItemResourcesState}
        onAcknowledgedItemResourcesChange={(map) => {
          setAckItemResourcesState(map);
          schedulePersist();
        }}
        onResultsChange={(next) => {
          setResults(next);
          setLatestEditableResults(next);
          schedulePersist();
        }}
      />

              {savedAnalyses.length > 0 && (
                <Card className="card-dofus">
                  <CardHeader>
                    <CardTitle className="text-foreground">Analyses sauvegardées</CardTitle>
                  </CardHeader>
                    <CardContent className="space-y-3">
                      {savedAnalyses.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-lg border border-border bg-background/50 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{a.name}</span>
                            <span className="text-xs text-muted-foreground">{a.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {a.items.length} items • {a.results.length} résultats
                          </p>
                          <Separator className="my-2" />
                          <div className="flex flex-wrap gap-2">
                            {a.items.map((item) => (
                              <span
                                key={item.id}
                                className="px-2 py-1 text-xs rounded-full bg-secondary/60 border border-border text-foreground"
                              >
                                {item.name}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button size="sm" variant="outline" onClick={() => handleLoadAnalysis(a)}>
                              Charger
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-border/30 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Dofinvest — Optimisez vos crafts sur tous les serveurs Dofus
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Données via Dofapi.fr • Fait avec ❤️ pour la communauté
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
