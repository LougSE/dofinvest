import { DofusItem, RecipeIngredient } from "@/types/dofus";

// Mock data for demonstration - will be replaced by API calls
export const mockItems: DofusItem[] = [
  {
    id: 1,
    name: "Arc Dragoeuf",
    level: 60,
    type: "Arc",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=arc1&backgroundColor=1e3a8a",
    isCraftable: true,
    recipe: [
      { itemId: 101, name: "Os de Pékeualak", quantity: 30, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=os1" },
      { itemId: 102, name: "Cuir de Dragoeuf", quantity: 15, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cuir1" },
      { itemId: 103, name: "Bois d'Orme", quantity: 40, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=bois1" },
      { itemId: 104, name: "Ficelle en Lin", quantity: 20, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=fil1" },
    ],
  },
  {
    id: 2,
    name: "Arc Adie",
    level: 45,
    type: "Arc",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=arc2&backgroundColor=dc2626",
    isCraftable: true,
    recipe: [
      { itemId: 103, name: "Bois d'Orme", quantity: 25, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=bois1" },
      { itemId: 105, name: "Plume de Tofu", quantity: 50, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=plume1" },
      { itemId: 106, name: "Cuir Souple", quantity: 10, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cuir2" },
    ],
  },
  {
    id: 3,
    name: "Coiffe du Bouftou Royal",
    level: 80,
    type: "Coiffe",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=coiffe1&backgroundColor=fbbf24",
    isCraftable: true,
    recipe: [
      { itemId: 107, name: "Laine de Bouftou", quantity: 100, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=laine1" },
      { itemId: 108, name: "Corne de Bouftou", quantity: 5, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=corne1" },
      { itemId: 109, name: "Fil d'Or", quantity: 15, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=fil2" },
    ],
  },
  {
    id: 4,
    name: "Cape du Piou Rouge",
    level: 30,
    type: "Cape",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cape1&backgroundColor=dc2626",
    isCraftable: true,
    recipe: [
      { itemId: 110, name: "Plume de Piou Rouge", quantity: 80, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=plume2" },
      { itemId: 111, name: "Tissu Rouge", quantity: 20, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=tissu1" },
    ],
  },
  {
    id: 5,
    name: "Amulette du Bwork",
    level: 55,
    type: "Amulette",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=amu1&backgroundColor=22c55e",
    isCraftable: true,
    recipe: [
      { itemId: 112, name: "Dent de Bwork", quantity: 10, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=dent1" },
      { itemId: 113, name: "Chaîne en Or", quantity: 1, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=chaine1" },
      { itemId: 114, name: "Pierre Précieuse", quantity: 3, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=pierre1" },
    ],
  },
  {
    id: 6,
    name: "Anneau du Craqueleur",
    level: 100,
    type: "Anneau",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=anneau1&backgroundColor=8b5cf6",
    isCraftable: true,
    recipe: [
      { itemId: 115, name: "Fragment de Craqueleur", quantity: 25, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=frag1" },
      { itemId: 116, name: "Rubis", quantity: 5, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=rubis1" },
      { itemId: 117, name: "Or Fondu", quantity: 50, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=or1" },
    ],
  },
  {
    id: 7,
    name: "Baguette de Glace",
    level: 70,
    type: "Baguette",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=baguette1&backgroundColor=3b82f6",
    isCraftable: true,
    recipe: [
      { itemId: 118, name: "Bois Glacé", quantity: 30, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=boisg1" },
      { itemId: 119, name: "Cristal de Glace", quantity: 15, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cristal1" },
      { itemId: 120, name: "Éclat Magique", quantity: 8, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=eclat1" },
    ],
  },
  {
    id: 8,
    name: "Bottes du Mulou",
    level: 40,
    type: "Bottes",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=bottes1&backgroundColor=a855f7",
    isCraftable: true,
    recipe: [
      { itemId: 121, name: "Cuir de Mulou", quantity: 20, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=cuirm1" },
      { itemId: 122, name: "Griffe de Mulou", quantity: 8, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=griffe1" },
      { itemId: 123, name: "Semelle Renforcée", quantity: 2, iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=semelle1" },
    ],
  },
];

export const mockPrices: { [key: number]: number } = {
  // Resources prices (kamas)
  101: 2000,  // Os de Pékeualak
  102: 8500,  // Cuir de Dragoeuf
  103: 500,   // Bois d'Orme
  104: 200,   // Ficelle en Lin
  105: 150,   // Plume de Tofu
  106: 3000,  // Cuir Souple
  107: 100,   // Laine de Bouftou
  108: 25000, // Corne de Bouftou
  109: 5000,  // Fil d'Or
  110: 80,    // Plume de Piou Rouge
  111: 1500,  // Tissu Rouge
  112: 12000, // Dent de Bwork
  113: 50000, // Chaîne en Or
  114: 35000, // Pierre Précieuse
  115: 8000,  // Fragment de Craqueleur
  116: 75000, // Rubis
  117: 2500,  // Or Fondu
  118: 1200,  // Bois Glacé
  119: 15000, // Cristal de Glace
  120: 45000, // Éclat Magique
  121: 4500,  // Cuir de Mulou
  122: 18000, // Griffe de Mulou
  123: 25000, // Semelle Renforcée
};

export const mockHdvPrices: { [key: number]: number } = {
  1: 2100000,  // Arc Dragoeuf
  2: 450000,   // Arc Adie
  3: 850000,   // Coiffe du Bouftou Royal
  4: 125000,   // Cape du Piou Rouge
  5: 380000,   // Amulette du Bwork
  6: 1500000,  // Anneau du Craqueleur
  7: 920000,   // Baguette de Glace
  8: 340000,   // Bottes du Mulou
};
