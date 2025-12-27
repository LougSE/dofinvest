import { useState, useMemo, useEffect } from "react";
import { DofusItem, Resource, RecipeIngredient } from "@/types/dofus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Coins, ArrowRight, Package } from "lucide-react";
import { useRecipes } from "@/hooks/useRecipes";
import { usePrices } from "@/hooks/usePrices";
import { cn } from "@/lib/utils";

interface PriceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: DofusItem[];
  onConfirm: (resources: Resource[], hdvPrices: { [key: number]: number }) => void;
  server: string;
  dataset: "20" | "129";
}

const PriceInputModal = ({
  isOpen,
  onClose,
  selectedItems,
  onConfirm,
  server,
  dataset,
}: PriceInputModalProps) => {
  const [step, setStep] = useState<"resources" | "hdv">("resources");
  const itemIds = useMemo(() => Array.from(new Set(selectedItems.map((item) => item.id))).filter(Boolean), [selectedItems]);
  const { recipes, isLoading: recipesLoading } = useRecipes(itemIds, dataset);
  const { resourcePrices, itemPrices, setResourcePrices, setItemPrices, savePrices, resetPrices } = usePrices(server, dataset);
  const [lockedResources, setLockedResources] = useState<Record<number, boolean>>({});
  const [lockedItems, setLockedItems] = useState<Record<number, boolean>>({});

  const aggregatedResources = useMemo(() => {
    try {
      return selectedItems.reduce<{ [key: number]: RecipeIngredient & { totalQty: number } }>((acc, item) => {
        const recipe = recipes[item.id] || item.recipe || [];
        recipe.forEach((ingredient) => {
          if (!ingredient || ingredient.itemId === undefined || ingredient.itemId === null || ingredient.itemId === 0) return;
          if (acc[ingredient.itemId]) {
            acc[ingredient.itemId].totalQty += ingredient.quantity;
          } else {
            acc[ingredient.itemId] = { ...ingredient, totalQty: ingredient.quantity } as RecipeIngredient & { totalQty: number };
          }
        });
        return acc;
      }, {});
    } catch (err) {
      console.error("aggregate resources failed", { err, selectedItems, recipes });
      return {};
    }
  }, [recipes, selectedItems]);

  const resourceList = Object.values(aggregatedResources);

  // Reset locks when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLockedResources({});
      setLockedItems({});
    }
  }, [isOpen]);

  const isLockedResource = (id: number) => {
    const manual = lockedResources[id];
    if (manual !== undefined) return manual;
    return false;
  };

  const isLockedItem = (id: number) => {
    const manual = lockedItems[id];
    if (manual !== undefined) return manual;
    return false;
  };

  const handleResourcePriceChange = (id: number, value: string) => {
    if (isLockedResource(id)) return;
    const numValue = parseInt(value.replace(/\D/g, "")) || 0;
    setResourcePrices((prev) => ({ ...prev, [id]: numValue }));
  };

  const handleHdvPriceChange = (id: number, value: string) => {
    if (isLockedItem(id)) return;
    const numValue = parseInt(value.replace(/\D/g, "")) || 0;
    setItemPrices((prev) => ({ ...prev, [id]: numValue }));
  };

  const formatKamas = (value: number) => {
    return value.toLocaleString("fr-FR");
  };

  const handleConfirm = () => {
    const resources: Resource[] = resourceList.map((res) => ({
      id: res.itemId,
      name: res.name,
      iconUrl: res.iconUrl,
      totalQuantity: res.totalQty,
      unitPrice: resourcePrices[res.itemId] ?? 0,
      totalCost: (resourcePrices[res.itemId] ?? 0) * res.totalQty,
    }));
    savePrices(resourcePrices, itemPrices);
    onConfirm(resources, itemPrices);
    onClose();
  };

  const totalResourceCost = resourceList.reduce(
    (sum, res) => sum + (resourcePrices[res.itemId] ?? 0) * res.totalQty,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-primary flex items-center gap-2">
            <Coins className="w-6 h-6" />
            {step === "resources" ? "Prix des Ressources" : "Prix HDV des Items"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Saisie des prix ressources et HDV avant calcul de rentabilité.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === "resources" ? "bg-primary" : "bg-muted"
            }`}
          />
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === "hdv" ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh] pr-2">
          {step === "resources" ? (
            <div className="space-y-3">
              {resourceList.map((res) => (
                <div
                  key={res.itemId}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <img
                    src={res.iconUrl}
                    alt={res.name}
                    className="w-10 h-10 rounded"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      const fallback = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(res.name)}`;
                      e.currentTarget.src = fallback;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{res.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Quantité totale: {res.totalQty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const isLocked = isLockedResource(res.itemId);
                      return (
                        <>
                          <Input
                            type="text"
                            value={formatKamas(resourcePrices[res.itemId] ?? 0)}
                            onChange={(e) => handleResourcePriceChange(res.itemId, e.target.value)}
                            className={cn(
                              "w-28 text-right input-dofus",
                              isLocked && "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                            readOnly={isLocked}
                          />
                          <span className="text-xs text-primary">k</span>
                          {isLocked && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLockedResources((prev) => ({ ...prev, [res.itemId]: false }));
                              }}
                            >
                              Modifier
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-medium text-foreground">
                      {formatKamas((resourcePrices[res.itemId] ?? 0) * res.totalQty)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              ))}
              {resourceList.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-6">
                  {recipesLoading ? "Chargement des recettes..." : "Aucune recette disponible"}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      const fallback = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}`;
                      e.currentTarget.src = fallback;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Niv. {item.level} • {item.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const isLocked = isLockedItem(item.id);
                      return (
                        <>
                          <Input
                            type="text"
                            value={formatKamas(itemPrices[item.id] ?? 0)}
                            onChange={(e) => handleHdvPriceChange(item.id, e.target.value)}
                            className={cn(
                              "w-36 text-right input-dofus",
                              isLocked && "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                            readOnly={isLocked}
                          />
                          <span className="text-xs text-primary">k</span>
                          {isLocked && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLockedItems((prev) => ({ ...prev, [item.id]: false }));
                              }}
                            >
                              Modifier
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          {step === "resources" && (
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Coût total des ressources:</span>
              <span className="text-lg font-bold text-primary">
                {formatKamas(totalResourceCost)} kamas
              </span>
            </div>
          )}

          <div className="flex gap-3">
            {step === "hdv" && (
              <Button variant="outline" onClick={() => setStep("resources")}>
                Retour
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            {step === "resources" ? (
                <Button variant="lime" onClick={() => setStep("hdv")} className="flex-1 gap-2" disabled={recipesLoading}>
                Suivant
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="lime" onClick={handleConfirm} className="flex-1 gap-2">
                <Package className="w-4 h-4" />
                Calculer la rentabilité
              </Button>
            )}
              <Button
                variant="outline"
                onClick={() => {
                  resetPrices();
                  setResourcePrices({});
                setItemPrices({});
              }}
              className="flex-1"
            >
              Réinitialiser les prix
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceInputModal;
