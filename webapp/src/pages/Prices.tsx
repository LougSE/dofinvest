import { useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Coins, Save, RefreshCw, Database } from "lucide-react";
import { useItemsSearch } from "@/hooks/useItemsSearch";
import { usePrices } from "@/hooks/usePrices";
import { DofusItem, Resource } from "@/types/dofus";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const formatKamas = (value: number) => value.toLocaleString("fr-FR");

const Prices = () => {
  const [datasetVersion, setDatasetVersion] = useState<"20" | "129">("20");
  const [server] = useState("Abrak");
  const { items: searchResults } = useItemsSearch({ query: "", craftableOnly: true, page: 1, dataset: datasetVersion });
  const [selection, setSelection] = useState<DofusItem[]>([]);
  const { resourcePrices, itemPrices, setResourcePrices, setItemPrices, savePrices, resetPrices } = usePrices(server, datasetVersion);

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
    setResourcePrices((prev) => ({ ...prev, [id]: cleanValue }));
  };

  const handleItemPriceChange = (id: number, value: string) => {
    const cleanValue = parseInt(value.replace(/\D/g, "")) || 0;
    setItemPrices((prev) => ({ ...prev, [id]: cleanValue }));
  };

  const handleSave = () => {
    savePrices(resourcePrices, itemPrices);
  };

  const handleReset = () => {
    resetPrices();
    setResourcePrices({});
    setItemPrices({});
  };

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
                  Les prix saisis sont sauvegardés dans localStorage par serveur et version de jeu. Ils seront préremplis lors de la prochaine analyse.
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
      </main>
    </div>
  );
};

export default Prices;
