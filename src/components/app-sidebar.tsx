import { Link, useLocation } from "react-router-dom";
import { Coffee, LayoutDashboard, ShoppingCart, ClipboardList, BookOpenText, Armchair, Moon, Sun } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";


const baseItems = [
  { title: "Caisse", url: "/", icon: ShoppingCart },
  { title: "Commandes", url: "/orders", icon: ClipboardList },
  { title: "Tables", url: "/tables", icon: Armchair, tablesOnly: true },
  { title: "Menu", url: "/menu", icon: BookOpenText },
  { title: "Analytique", url: "/analytics", icon: LayoutDashboard },
];

export function AppSidebar() {
  const path = useLocation().pathname;
  const { theme, toggle } = useTheme();
  const items = baseItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Coffee className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Brew House</span>
            <span className="text-xs text-muted-foreground">Caisse &amp; Analytique</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Espace de travail</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={path === it.url} tooltip={it.title}>
                    <Link to={it.url}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-2">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="group-data-[collapsible=icon]:hidden">
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
