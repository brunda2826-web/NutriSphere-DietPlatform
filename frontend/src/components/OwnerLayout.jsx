import { NavLink, Link } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function OwnerLayout({ children }) {
  const { logout } = useAuth();

  const nav = [
    ["/owner", "Home"],
    ["/owner/orders", "Orders"],
    ["/owner/products", "Products"],
    ["/owner/customers", "Customers"],
    ["/owner/reviews", "Reviews"],
    ["/owner/subscriptions", "Subscriptions"],
    ["/owner/delivery", "Delivery Area"],
  ];

  return (
    <div className="min-h-screen bg-bone">
      <header className="sticky top-0 z-30 bg-bone/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">
          <Logo />

          <nav className="hidden md:flex gap-5 text-sm font-semibold">
            {nav.map(([to, l]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/owner"}
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

            <button
              onClick={() => {
                logout();
                location.href = "/login";
              }}
              className="btn-outline text-xs"
            >
              Logout
            </button>
          </div>q12
        </div>

        <div className="md:hidden max-w-6xl mx-auto px-5 pb-3 flex gap-4 overflow-auto text-xs font-semibold">
          {nav.map(([to, l]) => (
            <NavLink key={to} to={to}>
              {l}
            </NavLink>
          ))}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
