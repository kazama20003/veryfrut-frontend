"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { format, addDays } from "date-fns"
import { FileSpreadsheet, Loader2, Calendar, Download } from "lucide-react"
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
import { ReportPreview } from "./report-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OrderItem {
  id?: number
  orderId?: number
  productId: number
  quantity: number
  price: number
  unitMeasurementId?: number
  unitMeasurement?: {
    id: number
    name: string
  }
  product?: {
    id: number
    name: string
    price: number
  }
}

interface Order {
  id: number
  userId?: number
  user?: {
    id: number
    firstName: string
    lastName: string
  }
  areaId?: number
  area?: {
    id: number
    name: string
    color?: string
  }
  totalAmount: number
  status: string
  observation?: string
  orderItems?: OrderItem[]
  createdAt?: string
}

export function OrderReportGenerator() {
  const [reportType, setReportType] = useState<"day" | "range">("day")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: ordersData } = useOrdersQuery({ page: 1, limit: 10000 })

  const hexToRgb = (hex: string): string => {
    const cleanHex = hex.replace("#", "")
    const fullHex =
      cleanHex.length === 3
        ? cleanHex
            .split("")
            .map((char) => char + char)
            .join("")
        : cleanHex
    return fullHex.toUpperCase()
  }

  const generateExcelReport = async () => {
    if (orders.length === 0) {
      toast.error("No hay datos", {
        description: "No se encontraron órdenes para el período seleccionado.",
      })
      return
    }

    try {
      const ExcelJS = await import("exceljs")
      const Workbook = ExcelJS.default.Workbook

      const workbook = new Workbook()
      const ws = workbook.addWorksheet("Reporte")

      // Extraer empresas únicas en orden de aparición
      const companiesMap = new Map<number, { name: string; color: string }>()
      orders.forEach((order) => {
        if (order.company && !companiesMap.has(order.company.id)) {
          companiesMap.set(order.company.id, {
            name: order.company.name,
            color: order.company.color || "#3B82F6",
          })
        }
      })
      const companies = Array.from(companiesMap.entries()).map(([id, data]) => ({ id, ...data }))

      // Agrupar productos por categoría (usando la categoría del producto si existe)
      interface ProductData {
        name: string
        categoryId?: number
        categoryName: string
      }
      const productsMap = new Map<string, ProductData>()
      orders.forEach((order) => {
        order.orderItems?.forEach((item) => {
          const productName = item.product?.name || "N/A"
          if (!productsMap.has(productName)) {
            productsMap.set(productName, {
              name: productName,
              categoryId: item.product?.categoryId,
              categoryName: item.product?.category?.name || "OTROS",
            })
          }
        })
      })

      // Agrupar productos por categoría
      const productsByCategory = new Map<string, ProductData[]>()
      Array.from(productsMap.values()).forEach((product) => {
        if (!productsByCategory.has(product.categoryName)) {
          productsByCategory.set(product.categoryName, [])
        }
        productsByCategory.get(product.categoryName)!.push(product)
      })

      const categories = Array.from(productsByCategory.entries())

      let currentRow = 1
      const totalColumns = companies.length + 1

      // Encabezados: Productos en col 1, Empresas en el resto
      ws.getCell(currentRow, 1).value = "PRODUCTO"
      ws.getCell(currentRow, 1).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF000000" } }
      ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } }
      ws.getCell(currentRow, 1).alignment = { horizontal: "center", vertical: "middle" }

      companies.forEach((company, index) => {
        const cellIndex = index + 2
        const cell = ws.getCell(currentRow, cellIndex)
        cell.value = company.name.toUpperCase()
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${hexToRgb(company.color)}` } }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        }
      })
      ws.getRow(currentRow).height = 25
      currentRow++

      // Procesar cada categoría
      categories.forEach(([categoryName, products]) => {
        const categoryStartRow = currentRow

        // Procesar productos de la categoría
        products.forEach((product) => {
          ws.getCell(currentRow, 1).value = product.name
          ws.getCell(currentRow, 1).font = { name: "Calibri", size: 10 }
          ws.getCell(currentRow, 1).alignment = { horizontal: "left", vertical: "middle" }
          ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } }

          // Obtener cantidad para cada empresa
          companies.forEach((company, index) => {
            const cellIndex = index + 2
            const companyOrders = orders.filter((o) => o.company?.id === company.id)
            const items = companyOrders.flatMap((o) => o.orderItems || [])
            const matchingItems = items.filter((item) => item.product?.name === product.name)

            let displayText = ""
            if (matchingItems.length > 0) {
              displayText = matchingItems
                .map((item) => {
                  const qty = item.quantity
                  const unit = item.unitMeasurement?.name || ""
                  return `${qty}${unit}`
                })
                .join("\n")
            }

            const cell = ws.getCell(currentRow, cellIndex)
            cell.value = displayText || ""
            cell.font = { name: "Calibri", size: 10 }
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${hexToRgb(company.color)}` } }
            cell.border = {
              top: { style: "thin", color: { argb: "FFE0E0E0" } },
              left: { style: "thin", color: { argb: "FFE0E0E0" } },
              bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
              right: { style: "thin", color: { argb: "FFE0E0E0" } },
            }
          })
          ws.getRow(currentRow).height = 18
          currentRow++
        })

        // Fila de TOTAL para esta categoría
        ws.getCell(currentRow, 1).value = "TOTAL"
        ws.getCell(currentRow, 1).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF000000" } }
        ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } }

        companies.forEach((company, index) => {
          const cellIndex = index + 2
          const companyOrders = orders.filter((o) => o.company?.id === company.id)
          const categoryItems = companyOrders.flatMap((o) => o.orderItems || []).filter((item) => {
            const productName = item.product?.name || "N/A"
            return products.some((p) => p.name === productName)
          })

          const totalCount = categoryItems.length

          const cell = ws.getCell(currentRow, cellIndex)
          cell.value = totalCount
          cell.font = { name: "Calibri", size: 11, bold: true }
          cell.alignment = { horizontal: "center", vertical: "middle" }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${hexToRgb(company.color)}` } }
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          }
        })
        ws.getRow(currentRow).height = 20
        currentRow += 2
      })

      // Fila de OBSERVACIONES
      ws.getCell(currentRow, 1).value = "OBSERVACION"
      ws.getCell(currentRow, 1).font = { name: "Calibri", size: 11, bold: true }
      ws.getCell(currentRow, 1).alignment = { horizontal: "left", vertical: "top" }
      ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } }

      companies.forEach((company, index) => {
        const cellIndex = index + 2
        const observations = orders
          .filter((o) => o.company?.id === company.id && o.observation)
          .map((o) => o.observation)
          .filter((obs) => obs)
          .join("\n")

        const cell = ws.getCell(currentRow, cellIndex)
        cell.value = observations
        cell.font = { name: "Calibri", size: 9 }
        cell.alignment = { horizontal: "left", vertical: "top", wrapText: true }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })
      ws.getRow(currentRow).height = 30
      currentRow++

      // Configurar anchos de columna
      const columnWidths = [40, ...Array(companies.length).fill(18)]
      ws.columns = columnWidths.map((width) => ({ width }))

      // Generar archivo - Usar buffer para navegador
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      
      const fileName =
        reportType === "day"
          ? `Reporte_Ordenes_${format(selectedDate, "dd-MM-yyyy")}.xlsx`
          : `Reporte_Ordenes_${format(dateRange.from || new Date(), "dd-MM-yyyy")}_al_${format(dateRange.to || new Date(), "dd-MM-yyyy")}.xlsx`

      // Descargar usando URL.createObjectURL
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Excel descargado", {
        description: `El archivo ${fileName} se ha descargado correctamente.`,
      })

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al generar Excel:", error)
      toast.error("Error al generar Excel", {
        description: "No se pudo generar el archivo Excel.",
      })
    }
  }

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

      let allOrders: Order[] = []
      if (ordersData && ordersData.items) {
        allOrders = ordersData.items
      }

      const filteredOrders = allOrders.filter((order) => {
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs sm:text-sm bg-transparent px-2 sm:px-4 py-2 h-9 sm:h-10" variant="outline">
          <FileSpreadsheet className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Generar Reporte</span>
          <span className="sm:hidden">Reporte</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[95vh] w-[95vw] rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">Generar Reporte de Órdenes</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Selecciona el período para generar el reporte en Excel</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="config" className="text-xs sm:text-sm">
              Configuración
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs sm:text-sm" disabled={!showReport}>
              Vista Previa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Tipo de Reporte</label>
              <Select value={reportType} onValueChange={(value: "day" | "range") => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Un día específico</SelectItem>
                  <SelectItem value="range">Rango de fechas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "day" ? (
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Seleccionar fecha</label>
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Desde</label>
                  <Input
                    type="date"
                    value={format(dateRange.from || new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Hasta</label>
                  <Input
                    type="date"
                    value={format(dateRange.to || new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            {showReport && orders.length > 0 && <ReportPreview orders={orders} />}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-2 sm:pt-4">
          <Button onClick={generateReport} disabled={isLoading} className="flex-1 text-xs sm:text-sm py-2 sm:py-2.5 h-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Calendar className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Generar Reporte
              </>
            )}
          </Button>
        </div>

        {showReport && orders.length > 0 && (
          <div className="border-t pt-3 sm:pt-4">
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted rounded">
              <p className="text-xs sm:text-sm font-medium">Órdenes encontradas: {orders.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total: S/. {orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <Button onClick={generateExcelReport} className="w-full text-xs sm:text-sm py-2 sm:py-2.5 h-auto gap-2">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Descargar Excel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
