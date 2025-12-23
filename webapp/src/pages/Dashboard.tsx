import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProfitabilityTable from "@/components/ProfitabilityTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { mockItems, mockPrices, mockHdvPrices } from "@/data/mockItems";
import { ProfitabilityResult, Resource } from "@/types/dofus";
import { Database, RefreshCw, Shield, Download } from "lucide-react";

const demoItems = mockItems.slice(0, 5);

const formatKamas = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString("fr-FR");
};

const buildResources = (): Resource[] => {
  const map: Record<number, Resource> = {};

  demoItems.forEach((item) => {
    item.recipe?.forEach((ing) => {
      if (map[ing.itemId]) {
        map[ing.itemId].totalQuantity += ing.quantity;
      } else {
        map[ing.itemId] = {
          id: ing.itemId,
          name: ing.name,
          iconUrl: ing.iconUrl,
          totalQuantity: ing.quantity,
          unitPrice: mockPrices[ing.itemId] || 0,
          totalCost: (mockPrices[ing.itemId] || 0) * ing.quantity,
        };
      }
    });
  });

  return Object.values(map).map((res) => ({
    ...res,
    totalCost: res.unitPrice * res.totalQuantity,
  }));
};

const buildResults = (resources: Resource[]): ProfitabilityResult[] => {
  return demoItems.map((item) => {
    const itemResources = item.recipe?.map((ing) => {
      const match = resources.find((r) => r.id === ing.itemId);
      const unitPrice = match?.unitPrice || mockPrices[ing.itemId] || 0;
      return {
        id: ing.itemId,
        name: match?.name || ing.name,
        iconUrl: match?.iconUrl || ing.iconUrl,
        unitPrice,
        totalQuantity: ing.quantity,
        totalCost: unitPrice * ing.quantity,
      };
    }) || [];

    const costTotal = itemResources.reduce((sum, res) => sum + res.totalCost, 0);
    const hdvPrice = mockHdvPrices[item.id] || 0;
    const benefit = hdvPrice - costTotal;
    const marginPercent = hdvPrice > 0 ? (benefit / hdvPrice) * 100 : 0;

    return { item, costTotal, hdvPrice, benefit, marginPercent, resources: itemResources };
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const resources = useMemo(buildResources, []);
  const results = useMemo(() => buildResults(resources), [resources]);

  const totalCost = resources.reduce((sum, res) => sum + res.totalCost, 0);
  const totalBenefit = results.reduce((sum, res) => sum + res.benefit, 0);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary text-sm">
            <Database className="h-4 w-4" />
            <span>Analyse prête — données mockées</span>
          </div>
          <h2 className="text-3xl font-heading font-bold text-foreground">Tableau de bord rentabilité</h2>
          <p className="text-muted-foreground max-w-3xl">
            Aperçu complet après saisie des prix: meilleures marges, coût global, ressources clés et export CSV. Cette page servira de base à l'intégration Dofapi et au cache local.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {demoItems.length} items analysés
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              Cache local activé
            </Badge>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="card-dofus rounded-xl p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Bénéfice potentiel</p>
            <p className="text-3xl font-heading font-bold text-profit">{formatKamas(totalBenefit)} kamas</p>
            <p className="text-xs text-muted-foreground">Inclut prix HDV moyen (mock)</p>
          </div>
          <div className="card-dofus rounded-xl p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Coût total des ressources</p>
            <p className="text-3xl font-heading font-bold text-foreground">{formatKamas(totalCost)} kamas</p>
            <p className="text-xs text-muted-foreground">Ressources agrégées sur la sélection</p>
          </div>
          <div className="card-dofus rounded-xl p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Actions rapides</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="limeOutline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recalculer
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="card-dofus rounded-xl p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Récap ressources</p>
                <h3 className="text-xl font-semibold text-foreground">Quantités & coûts cumulés</h3>
              </div>
              <Badge variant="outline" className="border-border text-muted-foreground">
                {resources.length} entrées
              </Badge>
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-2">
              {resources.map((res) => (
                <div key={res.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3">
                  <img src={res.iconUrl} alt={res.name} className="h-10 w-10 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{res.name}</p>
                    <p className="text-[11px] text-muted-foreground">{res.totalQuantity} unités</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Unitaire</p>
                    <p className="font-semibold text-primary">{formatKamas(res.unitPrice)} kamas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold text-foreground">{formatKamas(res.totalCost)} kamas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-dofus rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Cache & fallback</p>
                <p className="text-xs text-muted-foreground">Prévu pour Dofapi + localStorage</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Cette section affichera l'état des données stockées (recettes, images, prix). Pour l'instant, elle simule un cache prêt à l'emploi et un mode offline activé.
            </p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              ✓ Recettes en cache • ✓ Images icônes • ✓ Prix HDV simulés
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Retour à la sélection
            </Button>
          </div>
        </section>

        <section className="card-dofus rounded-xl p-5">
          <ProfitabilityTable results={results} onBack={() => navigate("/")} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
