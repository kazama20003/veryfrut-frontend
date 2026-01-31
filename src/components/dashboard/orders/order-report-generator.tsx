"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { format, addDays } from "date-fns"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"
import { Input } from "@/components/ui/input"
import { useOrdersQuery } from "@/lib/api/hooks/useOrder"

// Update the interfaces to match the backend structure
interface Area {
  id: number
  name: string
  companyId?: number
  color: string // Now required hexadecimal color
}

interface User {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  role?: string
  areas?: Area[]
}

interface Product {
  id: number
  name: string
  price: number
  unitMeasurementId: number
  unitMeasurement?: UnitMeasurement
  categoryId?: number
  category?: ProductCategory
}

interface ProductCategory {
  id: number
  name: string
}

interface UnitMeasurement {
  id: number
  name: string
  abbreviation?: string
  description?: string
}

interface OrderItem {
  id?: number
  orderId?: number
  productId: number
  quantity: number
  price: number
  unitMeasurementId?: number
  unitMeasurement?: UnitMeasurement
  product?: Product
}

interface Order {
  id: number
  userId: number
  user?: User
  areaId?: number
  area?: Area
  totalAmount: number
  status: string
  observation?: string
  orderItems: OrderItem[]
  createdAt?: string
}

// Replace the existing ReportGenerator component with this updated version
export function OrderReportGenerator() {
  const [reportType, setReportType] = useState<"day" | "range">("day")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  // Usar hooks para obtener datos
  const { data: ordersData = [] } = useOrdersQuery({ page: 1, limit: 1000 })

  // Generar y descargar Excel
  const downloadExcel = async () => {
    if (orders.length === 0) {
      toast.error("No hay datos para exportar", {
        description: "Genera un reporte primero.",
      })
      return
    }

    try {
      // Importar xlsx dinámicamente
      const XLSX = await import("xlsx")

      // Preparar datos para Excel
      const headers = [
        "ID Orden",
        "Producto",
        "Cantidad",
        "Unidad",
        "Precio Unit.",
        "Subtotal",
        "Área",
        "Cliente",
        "Estado",
        "Fecha",
        "Observación",
      ]

      const excelData: (string | number)[][] = [headers as unknown as string[]]

      // Procesar cada orden y sus items
      orders.forEach((order) => {
        if (order.orderItems && order.orderItems.length > 0) {
          order.orderItems.forEach((item) => {
            const subtotal = item.quantity * item.price
            const areaName = order.area?.name || "Desconocido"
            const clientName = order.user ? `${order.user.firstName} ${order.user.lastName}` : "Sin cliente"

            excelData.push([
              `#${order.id}`,
              item.product?.name || "Producto desconocido",
              item.quantity,
              item.unitMeasurement?.name || "Unidad",
              item.price.toFixed(2),
              subtotal.toFixed(2),
              areaName,
              clientName,
              order.status,
              format(new Date(order.createdAt || ""), "dd/MM/yyyy HH:mm"),
              order.observation || "",
            ])
          })
        }
      })

      // Crear hoja de cálculo
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      // Definir anchos de columna
      const wscols = [
        { wch: 10 }, // ID Orden
        { wch: 30 }, // Producto
        { wch: 12 }, // Cantidad
        { wch: 12 }, // Unidad
        { wch: 15 }, // Precio Unit.
        { wch: 15 }, // Subtotal
        { wch: 20 }, // Área
        { wch: 25 }, // Cliente
        { wch: 12 }, // Estado
        { wch: 18 }, // Fecha
        { wch: 50 }, // Observación
      ]
      ws["!cols"] = wscols

      // Crear libro y agregar hoja
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Órdenes")

      // Generar nombre de archivo
      const fileName =
        reportType === "day"
          ? `Reporte_Ordenes_${format(selectedDate, "dd-MM-yyyy")}.xlsx`
          : `Reporte_Ordenes_${format(dateRange.from || new Date(), "dd-MM-yyyy")}_al_${format(dateRange.to || new Date(), "dd-MM-yyyy")}.xlsx`

      // Descargar archivo
      XLSX.writeFile(wb, fileName)

      toast.success("Excel descargado", {
        description: `El archivo ${fileName} se ha descargado correctamente.`,
      })
    } catch (error) {
      console.error("Error al generar Excel:", error)
      toast.error("Error al generar Excel", {
        description: "No se pudo generar el archivo Excel.",
      })
    }
  }

  // Generar reporte
  const generateReport = async () => {
    setIsLoading(true)
    setOrders([])
    setShowReport(false)

    try {
      let startDate: Date
      let endDate: Date

      if (reportType === "day") {
        startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(selectedDate)
        endDate.setHours(23, 59, 59, 999)
      } else {
        startDate = new Date(dateRange.from || new Date())
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(dateRange.to || new Date())
        endDate.setHours(23, 59, 59, 999)
      }

      // Filtrar órdenes por fecha
      const allOrders = Array.isArray(ordersData) ? ordersData : []
      const filteredOrders = allOrders.filter((order: Order) => {
        if (!order.createdAt) return false
        const orderDate = new Date(order.createdAt)
        return orderDate >= startDate && orderDate <= endDate
      })

      setOrders(filteredOrders)

      if (filteredOrders.length === 0) {
        toast.warning("No hay datos", {
          description: "No se encontraron órdenes para el período seleccionado.",
        })
      } else {
        setShowReport(true)
        toast.success("Reporte generado", {
          description: `Se encontraron ${filteredOrders.length} órdenes.`,
        })
      }
    } catch (error) {
      console.error("Error al generar reporte:", error)
      toast.error("Error al generar reporte", {
        description: "No se pudieron cargar los datos del reporte.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para manejar cambio de fecha
  const handleDateChange = (type: "selected" | "from" | "to", value: string) => {
    const date = new Date(value)

    if (type === "selected") {
      setSelectedDate(date)
    } else if (type === "from") {
      setDateRange((prev) => ({ ...prev, from: date }))
    } else if (type === "to") {
      setDateRange((prev) => ({ ...prev, to: date }))
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setIsDialogOpen(true)}>
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Generar Reporte</span>
          <span className="sm:hidden">Reporte</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Órdenes</DialogTitle>
          <DialogDescription>Selecciona el período para generar un reporte de las órdenes del sistema.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tipo de reporte</label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as "day" | "range")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Por día</SelectItem>
                <SelectItem value="range">Por rango de fechas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "day" ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Seleccionar día</label>
              <Input
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(e) => handleDateChange("selected", e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Fecha seleccionada: {format(selectedDate, "dd/MM/yyyy")}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Seleccionar rango de fechas</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
                  <Input
                    type="date"
                    value={format(dateRange.from || new Date(), "yyyy-MM-dd")}
                    onChange={(e) => handleDateChange("from", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                  <Input
                    type="date"
                    value={format(dateRange.to || new Date(), "yyyy-MM-dd")}
                    onChange={(e) => handleDateChange("to", e.target.value)}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Rango seleccionado: {format(dateRange.from || new Date(), "dd/MM/yyyy")} - {format(dateRange.to || new Date(), "dd/MM/yyyy")}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Reporte"
              )}
            </Button>

            <Button
              onClick={downloadExcel}
              disabled={orders.length === 0}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>

          {/* Vista previa de datos */}
          {showReport && orders.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">
                Vista previa ({orders.reduce((acc, order) => acc + (order.orderItems?.length || 0), 0)} items)
              </h3>
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">Orden</th>
                        <th className="px-2 py-1 text-left">Producto</th>
                        <th className="px-2 py-1 text-center">Cant.</th>
                        <th className="px-2 py-1 text-left">Unidad</th>
                        <th className="px-2 py-1 text-right">Subtotal</th>
                        <th className="px-2 py-1 text-left">Área</th>
                        <th className="px-2 py-1 text-left">Cliente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 10).map((order) =>
                        order.orderItems?.map((item, itemIndex) => (
                          <tr key={`${order.id}-${itemIndex}`} className="border-t">
                            <td className="px-2 py-1">#{order.id}</td>
                            <td className="px-2 py-1 truncate max-w-[150px]">{item.product?.name}</td>
                            <td className="px-2 py-1 text-center">{item.quantity}</td>
                            <td className="px-2 py-1">{item.unitMeasurement?.name}</td>
                            <td className="px-2 py-1 text-right">S/. {(item.quantity * item.price).toFixed(2)}</td>
                            <td className="px-2 py-1">{order.area?.name}</td>
                            <td className="px-2 py-1 truncate max-w-[120px]">
                              {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Sin cliente"}
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
