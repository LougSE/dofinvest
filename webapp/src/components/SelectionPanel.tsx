import { DofusItem } from "@/types/dofus";
import { Button } from "@/components/ui/button";
import { X, Calculator, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionPanelProps {
  selectedItems: DofusItem[];
  onRemoveItem: (item: DofusItem) => void;
  onClearAll: () => void;
  onAnalyze: () => void;
}

const SelectionPanel = ({
  selectedItems,
  onRemoveItem,
  onClearAll,
  onAnalyze,
}: SelectionPanelProps) => {
  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="container mx-auto px-4 pb-4">
        <div className="card-dofus rounded-2xl p-4 border-t-2 border-primary/50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Selected items preview */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-foreground">
                  {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} sélectionné{selectedItems.length > 1 ? "s" : ""}
                </span>
                <button
                  onClick={onClearAll}
                  className="text-xs text-muted-foreground hover:text-loss transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Tout effacer
                </button>
              </div>

            {/* Items chips */}
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full",
                    "bg-secondary border border-border text-sm",
                    "group hover:border-loss/50 transition-all"
                  )}
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    className="w-5 h-5 rounded"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      const fallback = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}`;
                      e.currentTarget.src = fallback;
                    }}
                  />
                  <span className="text-foreground max-w-[120px] truncate">
                    {item.name}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item)}
                    className="text-muted-foreground hover:text-loss transition-colors"
                  >
                    <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyze button */}
            <Button
              variant="lime"
              size="lg"
              onClick={onAnalyze}
              className="w-full md:w-auto gap-2 font-heading"
            >
              <Calculator className="w-5 h-5" />
              Analyser la sélection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionPanel;
