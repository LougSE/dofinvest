import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProfitabilityTable from "@/components/ProfitabilityTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProfitabilityResult, Resource } from "@/types/dofus";
import { Database, RefreshCw, Shield, Download } from "lucide-react";

const formatKamas = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString("fr-FR");
};

const readLastAnalysis = () => {
  // Try both datasets and pick the most recent (last written)
  const datasets: ("20" | "129")[] = ["20", "129"];
  let latest: { ts: number; data: any; dataset: "20" | "129" } | null = null;
  datasets.forEach((ds) => {
    const key = `dofinvest_last_analysis:Abrak:${ds}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const ts = parsed.timestamp || 0;
        if (!latest || ts > latest.ts) {
          latest = { ts, data: parsed, dataset: ds };
        }
      } catch (err) {
        console.error("Failed to parse last analysis", err);
      }
    }
  });
  return latest;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const last = useMemo(readLastAnalysis, []);

  const results: ProfitabilityResult[] = last?.data?.results || [];

  const resources: Resource[] = useMemo(() => {
    const map = new Map<number, Resource & { name: string; iconUrl: string }>();
    results.forEach((res) => {
      res.resources.forEach((r) => {
        const current = map.get(r.id);
        const totalQuantity = (current?.totalQuantity || 0) + r.totalQuantity;
        const unitPrice = r.unitPrice;
        map.set(r.id, {
          ...r,
          totalQuantity,
          totalCost: unitPrice * totalQuantity,
        });
      });
    });
    return Array.from(map.values());
  }, [results]);

  const totalCost = resources.reduce((sum, res) => sum + res.totalCost, 0);
  const totalBenefit = results.reduce((sum, res) => sum + res.benefit, 0);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary text-sm">
            <Database className="h-4 w-4" />
            <span>
              {last ? `Analyse chargée (${last.dataset})` : "Aucune analyse sauvegardée"}
            </span>
          </div>
          <h2 className="text-3xl font-heading font-bold text-foreground">Tableau de bord rentabilité</h2>
          <p className="text-muted-foreground max-w-3xl">
            Aperçu basé sur la dernière analyse sauvegardée (sélection et prix saisis). Recalculez via l'analyse pour mettre à jour.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {results.length} items analysés
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {resources.length} ressources agrégées
            </Badge>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="card-dofus rounded-xl p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Bénéfice potentiel</p>
            <p className="text-3xl font-heading font-bold text-profit">{formatKamas(totalBenefit)} kamas</p>
            <p className="text-xs text-muted-foreground">Basé sur la dernière analyse</p>
          </div>
          <div className="card-dofus rounded-xl p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Coût total des ressources</p>
            <p className="text-3xl font-heading font-bold text-loss">{formatKamas(totalCost)} kamas</p>
            <p className="text-xs text-muted-foreground">Ressources agrégées sur la sélection</p>
          </div>
          <div className="card-dofus rounded-xl p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Actions rapides</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="limeOutline" className="gap-2" onClick={() => navigate("/")}>
                <RefreshCw className="h-4 w-4" />
                Nouvelle analyse
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => navigate("/")}>
                <Download className="h-4 w-4" />
                Retour sélection
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
                    <p className="font-semibold text-loss">{formatKamas(res.totalCost)} kamas</p>
                  </div>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune ressource (pas d'analyse chargée)</p>
              )}
            </div>
          </div>

          <div className="card-dofus rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Cache & fallback</p>
                <p className="text-xs text-muted-foreground">Basé sur la dernière analyse sauvegardée</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Les données ci-dessus reflètent la dernière analyse (items/prix) enregistrée localement. Relancez une analyse pour mettre à jour ce tableau de bord.
            </p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              {last ? `Dataset ${last.dataset} • Cache local` : "Aucune analyse disponible"}
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
