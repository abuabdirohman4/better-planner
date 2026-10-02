"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GridIcon, TaskIcon, CalenderIcon, CheckCircleIcon, ListIcon } from "@/lib/icons";
import MenuSheet from "./MenuSheet";
import Spinner from "@/components/ui/spinner/Spinner";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <GridIcon />,
    activeIcon: <GridIcon />,
  },
  {
    href: "/execution/daily-sync",
    label: "Daily Sync",
    icon: <TaskIcon />,
    activeIcon: <TaskIcon />,
  },
  {
    href: "/habits/today",
    label: "Habit Tracker",
    icon: <CheckCircleIcon />,
    activeIcon: <CheckCircleIcon />,
  },
  {
    href: "/execution/weekly-sync",
    label: "Weekly Sync",
    icon: <CalenderIcon />,
    activeIcon: <CalenderIcon />,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [loadingRoutes, setLoadingRoutes] = useState<Set<string>>(new Set());
  
  // Handle navigation with loading state
  const handleNavigation = useCallback((path: string) => {
    if (path === pathname) return; // Don't navigate if already on the page
    
    setLoadingRoutes(prev => new Set(prev).add(path));
    
    router.push(path);
  }, [pathname, router]);
  
  // Clear loading state when navigation completes
  useEffect(() => {
    setLoadingRoutes(new Set());
  }, [pathname]);
  
  // Prefetch all routes on component mount for better performance
  useEffect(() => {
    navItems.forEach(item => {
      router.prefetch(item.href);
    });
  }, [router]);
  
  // Check if a route is currently loading
  const isLoadingRoute = useCallback((path: string) => {
    return loadingRoutes.has(path);
  }, [loadingRoutes]);

  const inMainTabs = navItems.some((i) =>
    i.href.startsWith("/habits/") ? pathname.startsWith("/habits/") : pathname.startsWith(i.href)
  );
  const menuActive = menuOpen || !inMainTabs;

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-lg md:hidden">
      {/* Safe area untuk iPhone dengan home indicator */}
      <div className="pb-safe">
        <div className="flex items-center justify-around px-1 py-1">
          {navItems.map((item) => {
            // /habits/today and /habits/monthly are sibling tabs of one nav entry
            const isActive = !menuOpen && (item.href.startsWith("/habits/")
              ? pathname.startsWith("/habits/")
              : pathname.startsWith(item.href));
            const isRouteLoading = isLoadingRoute(item.href);
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                disabled={isRouteLoading}
                className={cn(
                  "bottom-nav-item",
                  isActive ? "bottom-nav-item-active" : "bottom-nav-item-inactive",
                  isRouteLoading ? "opacity-70 cursor-wait" : ""
                )}
              >
                <div className={cn(
                  "bottom-nav-icon",
                  isActive ? "bottom-nav-icon-active" : "bottom-nav-icon-inactive"
                )}>
                  {isRouteLoading ? (
                    <Spinner size={16} />
                  ) : (
                    isActive ? item.activeIcon : item.icon
                  )}
                </div>
                <span className={cn(
                  "bottom-nav-label",
                  isActive ? "bottom-nav-label-active" : "bottom-nav-label-inactive"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            data-testid="bottom-nav-menu"
            className={cn("bottom-nav-item", menuActive ? "bottom-nav-item-active" : "bottom-nav-item-inactive")}
          >
            <div className={cn("bottom-nav-icon", menuActive ? "bottom-nav-icon-active" : "bottom-nav-icon-inactive")}>
              <ListIcon />
            </div>
            <span className={cn("bottom-nav-label", menuActive ? "bottom-nav-label-active" : "bottom-nav-label-inactive")}>
              Menu
            </span>
          </button>
        </div>
      </div>
    </nav>
    <MenuSheet open={menuOpen} onClose={closeMenu} />
    </>
  );
}
