import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import POSPage from "@/pages/POS";
import OrdersPage from "@/pages/Orders";
import MenuPage from "@/pages/Menu";
import AnalyticsPage from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";
import { PinGate } from "@/components/pin-gate";

const queryClient = new QueryClient();

function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <div className="no-print contents">
          <AppSidebar />
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PinGate>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<POSPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PinGate>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
