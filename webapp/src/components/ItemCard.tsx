import { DofusItem } from "@/types/dofus";
import { Check, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: DofusItem;
  isSelected: boolean;
  onSelect: (item: DofusItem) => void;
}

const ItemCard = ({ item, isSelected, onSelect }: ItemCardProps) => {
  return (
    <div
      onClick={() => onSelect(item)}
      className={cn(
        "group relative cursor-pointer rounded-lg p-4 transition-all duration-300",
        "card-dofus hover:border-primary/60",
        isSelected && "lime-border ring-2 ring-primary/30"
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          "absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          isSelected
            ? "bg-primary border-primary"
            : "border-muted-foreground/50 group-hover:border-primary/50"
        )}
      >
        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
      </div>

      {/* Item Icon */}
      <div className="relative mb-4">
        <div className={cn(
          "w-16 h-16 mx-auto rounded-lg overflow-hidden transition-all duration-300",
          "bg-secondary border border-border",
          "group-hover:shadow-lg group-hover:shadow-primary/20",
          isSelected && "shadow-lg shadow-primary/30"
        )}>
          <img
            src={item.iconUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Craftable badge */}
        {item.isCraftable && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-secondary border border-border flex items-center gap-1">
            <Hammer className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground">Craft</span>
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">{item.type}</span>
          <span className="text-primary">Niv. {item.level}</span>
        </div>
      </div>

      {/* Recipe count */}
      {item.recipe && (
        <div className="mt-3 pt-3 border-t border-border/50 text-center">
          <span className="text-xs text-muted-foreground">
            {item.recipe.length} ressources
          </span>
        </div>
      )}
    </div>
  );
};

export default ItemCard;
