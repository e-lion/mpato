import { Dashboard } from "@/components/app/Dashboard";
import {
  getCurrentStoreId,
  getDashboardStats,
  getRecentSales,
  getTopProducts,
  getWeekSales,
} from "@/lib/data/queries";

export default async function DashboardPage() {
  const storeId = await getCurrentStoreId();
  if (!storeId) {
    return (
      <Dashboard
        stats={{ salesToday: 0, ordersToday: 0, newCustomers: 0, lowStock: 0, mpesaToday: 0, cashToday: 0 }}
        sales={[]}
        week={[]}
        topProducts={[]}
      />
    );
  }
  const [stats, sales, week, topProducts] = await Promise.all([
    getDashboardStats(storeId),
    getRecentSales(storeId, 5),
    getWeekSales(storeId),
    getTopProducts(storeId, 4),
  ]);
  return (
    <Dashboard stats={stats} sales={sales} week={week} topProducts={topProducts} />
  );
}
