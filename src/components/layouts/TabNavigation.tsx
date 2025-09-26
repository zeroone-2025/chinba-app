import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const TabNavigation = () => {
  const location = useLocation();

  const tabs = [
    { path: "/", label: "만나자" },
    { path: "/mohat", label: "뭐했니" },
    { path: "/jababa", label: "잡아봐" },
  ];

  return (
    <nav className="bg-background border-b border-border/60 px-6 py-2">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-primary/20 text-primary shadow-sm shadow-primary/15 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/70 hover:shadow-sm hover:scale-102"
              )}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;
