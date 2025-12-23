import { useState, useEffect } from "react";
import { DofusItem, Resource, RecipeIngredient } from "@/types/dofus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Coins, ArrowRight, Package } from "lucide-react";
import { mockPrices, mockHdvPrices } from "@/data/mockItems";

interface PriceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: DofusItem[];
  onConfirm: (resources: Resource[], hdvPrices: { [key: number]: number }) => void;
}

const PriceInputModal = ({
  isOpen,
  onClose,
  selectedItems,
  onConfirm,
}: PriceInputModalProps) => {
  const [step, setStep] = useState<"resources" | "hdv">("resources");
  const [resourcePrices, setResourcePrices] = useState<{ [key: number]: number }>({});
  const [hdvPrices, setHdvPrices] = useState<{ [key: number]: number }>({});

  // Aggregate all unique resources from selected items
  const aggregatedResources = selectedItems.reduce<{ [key: number]: RecipeIngredient & { totalQty: number } }>((acc, item) => {
    item.recipe?.forEach((ingredient) => {
      if (acc[ingredient.itemId]) {
        acc[ingredient.itemId].totalQty += ingredient.quantity;
      } else {
        acc[ingredient.itemId] = { ...ingredient, totalQty: ingredient.quantity };
      }
    });
    return acc;
  }, {});

  const resourceList = Object.values(aggregatedResources);

  // Initialize with mock prices
  useEffect(() => {
    const initialResourcePrices: { [key: number]: number } = {};
    resourceList.forEach((res) => {
      initialResourcePrices[res.itemId] = mockPrices[res.itemId] || 0;
    });
    setResourcePrices(initialResourcePrices);

    const initialHdvPrices: { [key: number]: number } = {};
    selectedItems.forEach((item) => {
      initialHdvPrices[item.id] = mockHdvPrices[item.id] || 0;
    });
    setHdvPrices(initialHdvPrices);
  }, [selectedItems]);

  const handleResourcePriceChange = (id: number, value: string) => {
    const numValue = parseInt(value.replace(/\D/g, "")) || 0;
    setResourcePrices((prev) => ({ ...prev, [id]: numValue }));
  };

  const handleHdvPriceChange = (id: number, value: string) => {
    const numValue = parseInt(value.replace(/\D/g, "")) || 0;
    setHdvPrices((prev) => ({ ...prev, [id]: numValue }));
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
      unitPrice: resourcePrices[res.itemId] || 0,
      totalCost: (resourcePrices[res.itemId] || 0) * res.totalQty,
    }));
    onConfirm(resources, hdvPrices);
    onClose();
  };

  const totalResourceCost = resourceList.reduce(
    (sum, res) => sum + (resourcePrices[res.itemId] || 0) * res.totalQty,
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
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{res.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Quantité totale: {res.totalQty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={formatKamas(resourcePrices[res.itemId] || 0)}
                      onChange={(e) => handleResourcePriceChange(res.itemId, e.target.value)}
                      className="w-28 text-right input-dofus"
                    />
                    <span className="text-xs text-primary">k</span>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-medium text-foreground">
                      {formatKamas((resourcePrices[res.itemId] || 0) * res.totalQty)} k
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              ))}
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
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Niv. {item.level} • {item.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Prix HDV:</span>
                    <Input
                      type="text"
                      value={formatKamas(hdvPrices[item.id] || 0)}
                      onChange={(e) => handleHdvPriceChange(item.id, e.target.value)}
                      className="w-36 text-right input-dofus"
                    />
                    <span className="text-xs text-primary">k</span>
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
              <Button variant="lime" onClick={() => setStep("hdv")} className="flex-1 gap-2">
                Suivant
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="lime" onClick={handleConfirm} className="flex-1 gap-2">
                <Package className="w-4 h-4" />
                Calculer la rentabilité
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceInputModal;
