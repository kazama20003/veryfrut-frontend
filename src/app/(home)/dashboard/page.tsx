import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table"
import { InventoryStatusChart } from "@/components/dashboard/inventory-status-chart"
import { SalesOverviewChart } from "@/components/dashboard/sales-overview-chart"
import { TopSellingProducts } from "@/components/dashboard/top-selling-products"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button size="sm" className="text-xs sm:text-sm">
          Descargar Reporte
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                +20.1%
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                +12.2%
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">2,345</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                +5.7%
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-medium">Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">152</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500 flex items-center">
                <ArrowDownIcon className="mr-1 h-3 w-3" />
                -3.2%
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Resumen de Ventas</CardTitle>
            <CardDescription className="text-xs">Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pt-0">
            <SalesOverviewChart />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Estado del Inventario</CardTitle>
            <CardDescription className="text-xs">Por categoría</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InventoryStatusChart />
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recientes */}
      <Card className="shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Pedidos Recientes</CardTitle>
          <CardDescription className="text-xs">573 pedidos este mes</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-0 sm:px-6">
          <RecentOrdersTable />
        </CardContent>
      </Card>

      {/* Productos más vendidos */}
      <Card className="shadow-sm mb-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Productos Más Vendidos</CardTitle>
          <CardDescription className="text-xs">Top 5 productos del mes</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <TopSellingProducts />
        </CardContent>
      </Card>
    </div>
  )
}
