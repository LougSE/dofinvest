import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterCraftable: (craftableOnly: boolean) => void;
  craftableOnly: boolean;
}

const SearchBar = ({ value, onChange, onFilterCraftable, craftableOnly }: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-full transition-all duration-300",
          "card-dofus",
          isFocused && "ring-2 ring-primary/50 shadow-[0_0_30px_hsl(82,85%,50%,0.2)]"
        )}
      >
        {/* Search Icon */}
        <div className="pl-4">
          <Search className={cn(
            "w-5 h-5 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        {/* Input */}
        <Input
          type="text"
          placeholder="Rechercher un item (Arc Dragoeuf, Coiffe, Cape...)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />

        {/* Clear button */}
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Filter button */}
        <Button
          variant={craftableOnly ? "lime" : "outline"}
          size="sm"
          onClick={() => onFilterCraftable(!craftableOnly)}
          className="mr-2 gap-2"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Craftables</span>
        </Button>
      </div>

      {/* Search hints */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">Suggestions:</span>
        {["Arc", "Coiffe", "Cape", "Anneau"].map((hint) => (
          <button
            key={hint}
            onClick={() => onChange(hint)}
            className="px-3 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all duration-200 border border-border/50 hover:border-primary/30"
          >
            {hint}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
