import { DofusItem } from "@/types/dofus";
import ItemCard from "./ItemCard";
import { Package } from "lucide-react";

interface ItemGridProps {
  items: DofusItem[];
  selectedItems: DofusItem[];
  onSelectItem: (item: DofusItem) => void;
}

const ItemGrid = ({ items, selectedItems, onSelectItem }: ItemGridProps) => {
  const isSelected = (item: DofusItem) => 
    selectedItems.some(selected => selected.id === item.id);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Aucun item trouvé
        </h3>
        <p className="text-muted-foreground text-sm">
          Essayez un autre terme de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-scale-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ItemCard
            item={item}
            isSelected={isSelected(item)}
            onSelect={onSelectItem}
          />
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;
