import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Search, ShoppingCart, User2, LayoutDashboard, ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useSettings } from "@/hooks/useMarketplace";

const NAV = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/categories", label: "Categories" },
  { to: "/vendors", label: "Vendors" },
  { to: "/nearby", label: "Nearby" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const { user, isAdmin, vendor, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const name = settings?.name ?? "RealTreats Marketplace";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/marketplace", search: { q: term || undefined } as never });
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {settings?.announcement ? (
        <div className="bg-primary px-4 py-2 text-center text-xs text-primary-foreground">{settings.announcement}</div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-6">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <img
                  src="/realtreats-logo.png"
                  alt={`${name} logo`}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-contain"
                />
                <span className="font-display text-base font-semibold">{name}</span>
              </Link>
              <nav className="mt-8 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {n.label}
                  </Link>
                ))}
                <Link to="/sell" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  Sell on {name}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <img
              src="/realtreats-logo.png"
              alt={`${name} logo`}
              width={36}
              height={36}
              fetchPriority="high"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="font-display text-base font-semibold leading-tight sm:text-lg">{name}</span>
          </Link>


          <form onSubmit={submit} className="ml-4 hidden flex-1 items-center md:flex">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products, vendors, categories"
                className="pl-9"
                aria-label="Search the marketplace"
              />
            </div>
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Cart">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 ? (
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">{count}</Badge>
                ) : null}
              </Link>
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account menu">
                    <User2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/account">My account</Link>
                  </DropdownMenuItem>
                  {vendor ? (
                    <DropdownMenuItem asChild>
                      <Link to="/vendor">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Vendor dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to="/sell">Become a vendor</Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
        <form onSubmit={submit} className="border-t border-border px-4 py-2 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search the marketplace"
              className="pl-9"
              aria-label="Search the marketplace"
            />
          </div>
        </form>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-base font-semibold">{name}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {settings?.tagline ?? "Discover great products from trusted local vendors."}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Shop</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Sell</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/sell">Become a vendor</Link>
              </li>
              <li>
                <Link to="/vendor">Vendor dashboard</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {settings?.support_email ? <li>{settings.support_email}</li> : null}
              {settings?.support_phone ? <li>{settings.support_phone}</li> : null}
              <li>
                {settings?.default_city}, {settings?.default_country}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
