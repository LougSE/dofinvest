import { useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { mockItems, mockPrices, mockHdvPrices } from "@/data/mockItems";
import { DofusItem } from "@/types/dofus";
import { Coins, Save, RefreshCw, Database } from "lucide-react";

const selectedItems: DofusItem[] = mockItems.slice(0, 4);

const formatKamas = (value: number) => value.toLocaleString("fr-FR");

const Prices = () => {
  const aggregatedResources = useMemo(() => {
    const map: Record<number, { name: string; iconUrl: string; totalQty: number }> = {};

    selectedItems.forEach((item) => {
      item.recipe?.forEach((ing) => {
        if (map[ing.itemId]) {
          map[ing.itemId].totalQty += ing.quantity;
        } else {
          map[ing.itemId] = {
            name: ing.name,
            iconUrl: ing.iconUrl,
            totalQty: ing.quantity,
          };
        }
      });
    });

    return Object.entries(map).map(([id, res]) => ({
      id: Number(id),
      ...res,
    }));
  }, []);

  const [resourcePrices, setResourcePrices] = useState<Record<number, number>>(() => {
    const defaults: Record<number, number> = {};
    aggregatedResources.forEach((res) => {
      defaults[res.id] = mockPrices[res.id] || 0;
    });
    return defaults;
  });

  const [itemPrices, setItemPrices] = useState<Record<number, number>>(() => {
    const defaults: Record<number, number> = {};
    selectedItems.forEach((item) => {
      defaults[item.id] = mockHdvPrices[item.id] || 0;
    });
    return defaults;
  });

  const totalResourceCost = aggregatedResources.reduce(
    (sum, res) => sum + (resourcePrices[res.id] || 0) * res.totalQty,
    0,
  );

  const handleResourceChange = (id: number, value: string) => {
    const cleanValue = parseInt(value.replace(/\D/g, "")) || 0;
    setResourcePrices((prev) => ({ ...prev, [id]: cleanValue }));
  };

  const handleItemPriceChange = (id: number, value: string) => {
    const cleanValue = parseInt(value.replace(/\D/g, "")) || 0;
    setItemPrices((prev) => ({ ...prev, [id]: cleanValue }));
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
                    <p className="text-xs text-muted-foreground">Quantité totale: {res.totalQty}</p>
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
                      {formatKamas((resourcePrices[res.id] || 0) * res.totalQty)} k
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              ))}
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
                {selectedItems.map((item) => (
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
              </div>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span>Sync locale par serveur (Abrak)</span>
                </div>
                <p>
                  Les prix saisis seront sauvegardés dans localStorage pour réutilisation lors de la prochaine analyse.
                  Pensez à ajuster si vous changez de serveur.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="lime" className="flex-1 gap-2">
                  <Save className="h-4 w-4" />
                  Sauvegarder les prix
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                  setResourcePrices(() => {
                    const defaults: Record<number, number> = {};
                    aggregatedResources.forEach((res) => {
                      defaults[res.id] = mockPrices[res.id] || 0;
                    });
                    return defaults;
                  });
                  setItemPrices(() => {
                    const defaults: Record<number, number> = {};
                    selectedItems.forEach((item) => {
                      defaults[item.id] = mockHdvPrices[item.id] || 0;
                    });
                    return defaults;
                  });
                }}>
                  <RefreshCw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            <div className="card-dofus rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">Check-list avant calcul</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Vérifiez les ressources communes (agrégation automatique).</li>
                <li>• Ajustez les prix HDV pour votre serveur.</li>
                <li>• Activez la sauvegarde locale pour garder vos tarifs.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Prices;
