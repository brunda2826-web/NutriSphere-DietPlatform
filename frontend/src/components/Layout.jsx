import { NavLink, Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
export default function Layout({ children }) {
  const { count } = useCart();
  const { user } = useAuth();
  const nav = [
    ["/products", "Browse"],
    ["/recommend", "Recommend"],
    ["/cart", `Cart${count ? ` (${count})` : ""}`],
    ["/profile", "Profile"],
  ];
  return (
    <div className="min-h-screen bg-bone">
      <header className="sticky top-0 z-30 bg-bone/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex gap-6 text-sm font-semibold">
            {nav.map(([to, l]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive ? "text-brand" : "text-ink-soft hover:text-brand"
                }
              >
                {l}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="md:hidden text-sm font-semibold text-brand">
              {user?.name?.split(" ")[0]}
            </div>
          </div>
        </div>
        <div className="md:hidden max-w-6xl mx-auto px-5 pb-3 flex justify-between text-xs font-semibold">
          {nav.map(([to, l]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "text-brand" : "text-ink-soft"
              }
            >
              {l}
            </NavLink>
          ))}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
