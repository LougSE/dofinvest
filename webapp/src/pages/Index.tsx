import { useState, useMemo } from "react";
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

type ViewState = "search" | "results";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [craftableOnly, setCraftableOnly] = useState(true);
  const [selectedItems, setSelectedItems] = useState<DofusItem[]>([]);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("search");
  const [results, setResults] = useState<ProfitabilityResult[]>([]);
  const [datasetVersion, setDatasetVersion] = useState<"20" | "129">("20");
  const [savedAnalyses, setSavedAnalyses] = useState<
    { id: string; name: string; date: string; items: DofusItem[]; results: ProfitabilityResult[] }
  >([]);
  const server = "Abrak";

  const { items: searchResults, isLoading: isSearchLoading, error: searchError, isOfflineFallback, minQueryMet } = useItemsSearch({
    query: searchQuery,
    craftableOnly,
    page: 1,
    dataset: datasetVersion,
  });

  // Filter items based on search and craftable filter
  const filteredItems = useMemo(() => {
    return searchResults;
  }, [searchResults]);

  const handleSelectItem = (item: DofusItem) => {
    try {
      setSelectedItems((prev) => {
        const isSelected = prev.some((i) => i.id === item.id);
        const next = isSelected ? prev.filter((i) => i.id !== item.id) : [...prev, item];
        console.log("selection updated", { count: next.length, selectedIds: next.map((i) => i.id) });
        return next;
      });
    } catch (err) {
      console.error("handleSelectItem failed", { err, item });
    }
  };

  const handleRemoveItem = (item: DofusItem) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleAnalyze = () => {
    console.log("analyze click", { selectedCount: selectedItems.length, selectedIds: selectedItems.map((i) => i.id) });
    if (selectedItems.length === 0) return;
    setIsPriceModalOpen(true);
  };

  const handleConfirmPrices = (
    resources: Resource[],
    hdvPrices: { [key: number]: number }
  ) => {
    // Calculate profitability for each selected item
    const profitResults: ProfitabilityResult[] = selectedItems.map((item) => {
      // Get resources for this specific item
      const itemResources = item.recipe?.map((ingredient) => {
        const resource = resources.find((r) => r.id === ingredient.itemId);
        return {
          id: ingredient.itemId,
          name: ingredient.name,
          iconUrl: ingredient.iconUrl,
          totalQuantity: ingredient.quantity,
          unitPrice: resource?.unitPrice || 0,
          totalCost: (resource?.unitPrice || 0) * ingredient.quantity,
        };
      }) || [];

      const costTotal = itemResources.reduce((sum, r) => sum + r.totalCost, 0);
      const hdvPrice = hdvPrices[item.id] || 0;
      const benefit = hdvPrice - costTotal;
      const marginPercent = hdvPrice > 0 ? (benefit / hdvPrice) * 100 : 0;

      return {
        item,
        costTotal,
        hdvPrice,
        benefit,
        marginPercent,
        resources: itemResources,
      };
    });

    setResults(profitResults);
    setViewState("results");
    setIsPriceModalOpen(false);
  };

  const handleBackToSearch = () => {
    setViewState("search");
    setResults([]);
  };

  const handleSaveAnalysis = () => {
    const id = `${Date.now()}`;
    const name = `Analyse ${savedAnalyses.length + 1}`;
    const date = new Date().toLocaleString();
    setSavedAnalyses((prev) => [...prev, { id, name, date, items: selectedItems, results }]);
  };

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
                />
              </div>

              {!minQueryMet && (
                <p className="text-center text-sm text-muted-foreground">
                  Saisissez au moins 2 caractères pour rechercher.
                </p>
              )}

              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredItems.length} item{filteredItems.length > 1 ? "s" : ""} trouvé{filteredItems.length > 1 ? "s" : ""}
                </p>
              </div>

              {/* Item grid */}
              {minQueryMet && (
                <ItemGrid
                  items={filteredItems}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                />
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
