import { Coins, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const Header = () => {
  const navItems = [
    { label: "Recherche", to: "/" },
    { label: "Prix", to: "/prices" },
    { label: "Tableau", to: "/dashboard" },
  ];

  return (
    <header className="header-dark py-4 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime-light via-primary to-lime-dark flex items-center justify-center shadow-lg lime-glow">
                <Coins className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-profit flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-lime-gradient">
                Dofinvest
              </h1>
              <p className="text-muted-foreground text-sm">
                Calculateur de rentabilité des crafts
              </p>
            </div>
            </div>

          {/* Nav + Server Selector */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary transition-colors"
                  activeClassName="bg-secondary text-foreground border border-border"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="card-dofus rounded-full px-5 py-2.5 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-profit animate-pulse" />
              <span className="text-sm font-medium text-foreground">Serveur: Abrak</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
