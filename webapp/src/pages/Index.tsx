import { useState, useMemo } from "react";
import { DofusItem, Resource, ProfitabilityResult } from "@/types/dofus";
import { mockItems } from "@/data/mockItems";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import ItemGrid from "@/components/ItemGrid";
import SelectionPanel from "@/components/SelectionPanel";
import PriceInputModal from "@/components/PriceInputModal";
import ProfitabilityTable from "@/components/ProfitabilityTable";
import { Sparkles } from "lucide-react";

type ViewState = "search" | "results";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [craftableOnly, setCraftableOnly] = useState(true);
  const [selectedItems, setSelectedItems] = useState<DofusItem[]>([]);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("search");
  const [results, setResults] = useState<ProfitabilityResult[]>([]);

  // Filter items based on search and craftable filter
  const filteredItems = useMemo(() => {
    return mockItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCraftable = craftableOnly ? item.isCraftable : true;
      return matchesSearch && matchesCraftable;
    });
  }, [searchQuery, craftableOnly]);

  const handleSelectItem = (item: DofusItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleRemoveItem = (item: DofusItem) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleAnalyze = () => {
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
    setSelectedItems([]);
    setResults([]);
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

              {/* Search */}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onFilterCraftable={setCraftableOnly}
                craftableOnly={craftableOnly}
              />

              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredItems.length} item{filteredItems.length > 1 ? "s" : ""} trouvé{filteredItems.length > 1 ? "s" : ""}
                </p>
              </div>

              {/* Item grid */}
              <ItemGrid
                items={filteredItems}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
              />

              {/* Selection panel */}
              <SelectionPanel
                selectedItems={selectedItems}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearAll}
                onAnalyze={handleAnalyze}
              />

              {/* Price input modal */}
              <PriceInputModal
                isOpen={isPriceModalOpen}
                onClose={() => setIsPriceModalOpen(false)}
                selectedItems={selectedItems}
                onConfirm={handleConfirmPrices}
              />

              {/* Bottom padding for selection panel */}
              {selectedItems.length > 0 && <div className="h-32" />}
            </div>
          ) : (
            <ProfitabilityTable results={results} onBack={handleBackToSearch} />
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
