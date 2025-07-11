"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { format, addDays } from "date-fns"
import { FileSpreadsheet, FileIcon as FilePdf, Loader2 } from "lucide-react"
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
import { api } from "@/lib/axiosInstance"
import type { DateRange } from "react-day-picker"
import { Input } from "@/components/ui/input"

// Update the interfaces to match the backend structure
interface Area {
  id: number
  name: string
  companyId?: number
  color: string // Now required hexadecimal color
}

interface Company {
  id: number
  name: string
  areas?: Area[]
  color?: string // Color de la empresa
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

// Interfaz para el tipo de celda de Excel con estilos
interface StyledCell {
  v: string | number // valor
  t: string // tipo
  s: {
    font?: {
      bold?: boolean
      color?: { rgb: string }
      sz?: number // Cambiado de size a sz
      name?: string // Añadido nombre de fuente
    }
    fill?: {
      fgColor: { rgb: string }
    }
    alignment?: {
      horizontal: string
      vertical?: string
      wrapText?: boolean
    }
    border?: {
      top?: { style: string; color?: { rgb: string } }
      left?: { style: string; color?: { rgb: string } }
      bottom?: { style: string; color?: { rgb: string } }
      right?: { style: string; color?: { rgb: string } }
    }
  }
}

// Replace the existing ReportGenerator component with this updated version
export function ReportGenerator() {
  const [reportType, setReportType] = useState<"day" | "range">("day")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportDate, setReportDate] = useState<string>(format(new Date(), "dd/MM/yyyy"))
  const [hasData, setHasData] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  // Estados para datos reales
  const [companies, setCompanies] = useState<Company[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productQuantities, setProductQuantities] = useState<{ [areaId: number]: { [productId: number]: number } }>({})
  const [categories, setCategories] = useState<{ [id: number]: ProductCategory }>({})
  const [areasWithOrders, setAreasWithOrders] = useState<number[]>([])

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar usuarios, compañías, productos y unidades de medida
        const [companiesResponse, productsResponse, unitMeasurementsResponse, categoriesResponse] = await Promise.all([
          api.get("/company"),
          api.get("/products"),
          api.get("/unit-measurements"),
          api.get("/categories"),
        ])

        const companiesData = companiesResponse.data
        const productsData = productsResponse.data
        const unitMeasurementsData = unitMeasurementsResponse.data
        const categoriesData = categoriesResponse.data || []

        // Procesar categorías
        const categoriesMap: { [id: number]: ProductCategory } = {}
        categoriesData.forEach((category: ProductCategory) => {
          categoriesMap[category.id] = category
        })
        setCategories(categoriesMap)

        // Procesar compañías - ya no necesitamos asignar colores aquí
        const processedCompanies = Array.isArray(companiesData) ? companiesData : [companiesData]
        setCompanies(processedCompanies)

        // Extraer todas las áreas de las compañías - ahora usan el color hexadecimal del área
        const allAreas: Area[] = []
        processedCompanies.forEach((company: Company) => {
          if (company.areas && Array.isArray(company.areas)) {
            // Las áreas ya vienen con su color hexadecimal
            allAreas.push(...company.areas)
          }
        })
        setAreas(allAreas)

        // Asignar unidades de medida a los productos
        const productsWithUnits = productsData.map((product: Product) => {
          const unitMeasurement = unitMeasurementsData.find(
            (unit: UnitMeasurement) => unit.id === product.unitMeasurementId,
          )
          return {
            ...product,
            unitMeasurement,
            category: categoriesMap[product.categoryId || 0],
          }
        })
        setProducts(productsWithUnits)
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos", {
          description: "No se pudieron cargar los datos necesarios para el reporte.",
        })
      }
    }

    loadInitialData()
  }, [])

  // Función para convertir color hexadecimal a RGB para Excel
  const hexToRgb = (hex: string): string => {
    // Remover el # si está presente
    const cleanHex = hex.replace("#", "")
    // Si es un color de 3 caracteres, expandirlo a 6
    const fullHex =
      cleanHex.length === 3
        ? cleanHex
            .split("")
            .map((char) => char + char)
            .join("")
        : cleanHex
    return fullHex.toUpperCase()
  }

  // Función para determinar si el texto debe ser blanco o negro basado en el color de fondo
  const getTextColor = (): string => {
    // Siempre usar texto negro
    return "000000"
  }

  // Función para obtener observaciones por área
  const getObservationsByArea = () => {
    const observationsByArea: { [areaId: number]: string[] } = {}
    orders.forEach((order) => {
      if (order.observation && order.observation.trim()) {
        const areaId = order.areaId || order.area?.id
        if (areaId) {
          if (!observationsByArea[areaId]) {
            observationsByArea[areaId] = []
          }
          // Evitar duplicados en la misma área
          if (!observationsByArea[areaId].includes(order.observation)) {
            observationsByArea[areaId].push(order.observation)
          }
        }
      }
    })
    return observationsByArea
  }

  // Generar y descargar Excel - CORREGIDO para replicar exactamente el preview
  const downloadExcel = async () => {
    try {
      // Verificar si hay datos para generar el Excel
      if (!hasData) {
        toast.error("No hay datos para generar el Excel", {
          description: "No se encontraron órdenes para el período seleccionado.",
        })
        return
      }

      // Importar xlsx-js-style dinámicamente
      const XLSX_STYLE = await import("xlsx-js-style")

      // Crear un nuevo libro de Excel
      const wb = XLSX_STYLE.utils.book_new()

      // Crear datos para el Excel con estilos
      const excelData: StyledCell[][] = []

      // Estilo base para todas las celdas
      const baseStyle = {
        font: { name: "Calibri", sz: 11, bold: false },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      }

      // Obtener productos agrupados por categoría (igual que el preview)
      const productsByCategory = getProductsForReport()

      // Filtrar compañías que tienen áreas con pedidos (igual que el preview)
      const companiesWithOrders = companies.filter((company) => {
        const companyAreas = getAreasByCompany()[company.id] || []
        return companyAreas.some((area: Area) => areasWithOrders.includes(area.id))
      })

      // MANTENER EL ORDEN ESPECÍFICO (igual que el preview)
      const categoryOrder = [1, 2, 5, 3, 4]

      // Crear array ordenado de categorías que existen
      const orderedCategoryEntries: Array<[string, Product[]]> = categoryOrder
        .filter((categoryId) => productsByCategory[categoryId])
        .map((categoryId) => [categoryId.toString(), productsByCategory[categoryId] as Product[]])

      // Agregar cualquier categoría adicional que no esté en el orden específico
      Object.entries(productsByCategory).forEach(([categoryIdStr, categoryProducts]) => {
        const categoryId = Number.parseInt(categoryIdStr)
        if (!categoryOrder.includes(categoryId)) {
          orderedCategoryEntries.push([categoryIdStr, categoryProducts as Product[]])
        }
      })

      // Procesar cada categoría (replicando exactamente el preview)
      orderedCategoryEntries.forEach(([categoryIdStr, categoryProducts]) => {
        const categoryId = Number.parseInt(categoryIdStr)
        const categoryName = categories[categoryId]?.name || `Categoría ${categoryId}`

        // Filtrar solo productos con pedidos (igual que el preview)
        const productsWithOrders = categoryProducts
          .filter((product: Product) => {
            // Verificar si hay algún pedido para este producto en cualquier área
            for (const areaId in productQuantities) {
              if (productQuantities[areaId][product.id]) {
                return true
              }
            }
            return false
          })
          .sort((a: Product, b: Product) => a.name.localeCompare(b.name)) // Ordenar alfabéticamente

        // Si no hay productos con pedidos en esta categoría, omitir
        if (productsWithOrders.length === 0) return

        // Agregar fila de fecha (igual que el preview)
        const dateRow: StyledCell[] = [
          {
            v: `fecha: ${reportDate}`,
            t: "s",
            s: {
              ...baseStyle,
              font: { ...baseStyle.font, bold: true },
              fill: { fgColor: { rgb: "FFFFFF" } },
            },
          },
        ]
        // Rellenar el resto de columnas para la fecha
        companiesWithOrders.forEach(() => {
          dateRow.push({
            v: "",
            t: "s",
            s: {
              ...baseStyle,
              fill: { fgColor: { rgb: "FFFFFF" } },
            },
          })
        })
        excelData.push(dateRow)

        // Preparar la fila de encabezados de compañías (igual que el preview)
        const companyRow: StyledCell[] = [
          {
            v: categoryName.toUpperCase(),
            t: "s",
            s: {
              ...baseStyle,
              font: { ...baseStyle.font, bold: true },
              fill: { fgColor: { rgb: "F2F2F2" } },
            },
          },
        ]

        // Agregar compañías a la fila de encabezado (igual que el preview)
        companiesWithOrders.forEach((company) => {
          // Filtrar solo áreas con pedidos para verificar si la empresa tiene pedidos
          const companyAreas =
            getAreasByCompany()[company.id]?.filter((area: Area) => areasWithOrders.includes(area.id)) || []
          if (companyAreas.length === 0) {
            return // Saltar esta compañía si no tiene áreas con pedidos
          }

          // Usar el color de la empresa si está disponible, sino el color de la primera área
          const companyColor = company.color ? hexToRgb(company.color) : hexToRgb(companyAreas[0]?.color || "#CCCCCC")

          // Agregar la compañía
          companyRow.push({
            v: company.name.toUpperCase(),
            t: "s",
            s: {
              ...baseStyle,
              font: { ...baseStyle.font, bold: true, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: companyColor } },
              alignment: { horizontal: "center" },
            },
          })
        })

        excelData.push(companyRow)

        // Agregar productos de esta categoría (igual que el preview)
        productsWithOrders.forEach((product: Product) => {
          const productRow: StyledCell[] = [
            {
              v: product.name,
              t: "s",
              s: {
                ...baseStyle,
                fill: { fgColor: { rgb: "FFFFFF" } },
                alignment: { horizontal: "left" },
              },
            },
          ]

          // Agregar cantidades por empresa (igual que el preview)
          companiesWithOrders.forEach((company) => {
            const companyAreas =
              getAreasByCompany()[company.id]?.filter((area: Area) => areasWithOrders.includes(area.id)) || []
            if (companyAreas.length === 0) {
              return // Saltar esta compañía si no tiene áreas con pedidos
            }

            // Obtener todas las cantidades de las áreas de esta empresa para este producto
            const quantityDisplay = getProductQuantityForExcel(product.id, company.id)
            productRow.push({
              v: quantityDisplay || "",
              t: "s",
              s: {
                ...baseStyle,
                alignment: { horizontal: "left" },
              },
            })
          })

          excelData.push(productRow)
        })

        // Agregar fila de totales para esta categoría (igual que el preview)
        const totalRow: StyledCell[] = [
          {
            v: "TOTAL",
            t: "s",
            s: {
              ...baseStyle,
              font: { ...baseStyle.font, bold: true },
              fill: { fgColor: { rgb: "FFFFFF" } },
              alignment: { horizontal: "left" },
            },
          },
        ]

        companiesWithOrders.forEach((company) => {
          const companyAreas =
            getAreasByCompany()[company.id]?.filter((area: Area) => areasWithOrders.includes(area.id)) || []
          if (companyAreas.length === 0) {
            return // Saltar esta compañía si no tiene áreas con pedidos
          }

          // Calcular total contando productos únicos para esta categoría en toda la empresa
          const total = calculateCompanyTotalByCategory(company.id, categoryId)
          totalRow.push({
            v: total ? `${total}` : "0",
            t: "s",
            s: {
              ...baseStyle,
              font: { ...baseStyle.font, bold: true },
              alignment: { horizontal: "left" },
              fill: { fgColor: { rgb: "FFFFFF" } },
            },
          })
        })

        excelData.push(totalRow)

        // Agregar fila vacía para separación entre categorías
        excelData.push([])
      })

      // Agregar sección de observaciones al final (igual que el preview)
      const observationsByArea = getObservationsByArea()
      const hasObservations = Object.keys(observationsByArea).length > 0

      if (hasObservations) {
        // Fila de observaciones
        const observationRow: StyledCell[] = [
          {
            v: "OBSERVACION",
            t: "s",
            s: {
              ...baseStyle,
              font: { ...baseStyle.font, bold: true },
              fill: { fgColor: { rgb: "FFFF00" } }, // Amarillo
              alignment: { horizontal: "left" },
            },
          },
        ]

        // Agregar observaciones por empresa (igual que el preview)
        companiesWithOrders.forEach((company) => {
          const companyAreas =
            getAreasByCompany()[company.id]?.filter((area: Area) => areasWithOrders.includes(area.id)) || []
          if (companyAreas.length === 0) {
            return
          }

          // Combinar observaciones de todas las áreas de la empresa
          const allObservations: string[] = []
          companyAreas.forEach((area) => {
            const areaObservations = observationsByArea[area.id] || []
            allObservations.push(...areaObservations)
          })

          // Eliminar duplicados y unir
          const uniqueObservations = [...new Set(allObservations)]
          const observationText = uniqueObservations.join("; ")

          observationRow.push({
            v: observationText,
            t: "s",
            s: {
              ...baseStyle,
              fill: { fgColor: { rgb: "FFFF99" } }, // Amarillo claro
              alignment: { horizontal: "left", wrapText: true },
            },
          })
        })

        excelData.push(observationRow)
      }

      // Crear hoja de cálculo
      const ws = XLSX_STYLE.utils.aoa_to_sheet(excelData)

      // Definir anchos de columna
      const wscols = [
        { wch: 40 }, // Nombre del producto/categoría
      ]

      // Agregar anchos para las columnas de empresas
      companiesWithOrders.forEach(() => {
        wscols.push({ wch: 25 }) // Ancho para empresa
      })

      ws["!cols"] = wscols

      // Agregar hoja al libro con nombre único
      XLSX_STYLE.utils.book_append_sheet(wb, ws, "Reporte de Productos")

      // Generar archivo y descargar
      XLSX_STYLE.writeFile(wb, `Reporte_Productos_${reportDate.replace(/\//g, "-").replace(/\s/g, "_")}.xlsx`)

      toast.success("Reporte generado", {
        description: "El archivo Excel se ha descargado correctamente.",
      })
    } catch (error) {
      console.error("Error al generar Excel:", error)
      toast.error("Error al generar Excel", {
        description: "No se pudo generar el archivo Excel.",
      })
    }
  }

  // Simular descarga de PDF
  const downloadPDF = () => {
    toast.success("Reporte generado", {
      description: "El archivo PDF se ha descargado correctamente.",
    })
  }

  // Modificar la función getProductsForReport para agrupar por categoría
  const getProductsForReport = () => {
    // Si tenemos productos reales, usarlos agrupados por categoría
    if (products.length > 0) {
      // Agrupar productos por categoría
      const productsByCategory: { [categoryId: number]: Product[] } = {}
      products.forEach((product) => {
        const categoryId = product.categoryId || 0
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = []
        }
        productsByCategory[categoryId].push(product)
      })

      // Ordenar productos alfabéticamente dentro de cada categoría
      Object.keys(productsByCategory).forEach((categoryId) => {
        productsByCategory[Number(categoryId)].sort((a: Product, b: Product) => a.name.localeCompare(b.name))
      })

      // ORDEN ESPECÍFICO REQUERIDO: 1=Verduras, 2=Frutas, 5=Hierbas, 3=IGV, 4=Otros
      const categoryOrder = [1, 2, 5, 3, 4]
      const orderedCategories: { [categoryId: number]: Product[] } = {}

      // Aplicar el orden específico - FORZAR este orden exacto
      categoryOrder.forEach((categoryId) => {
        if (productsByCategory[categoryId] && productsByCategory[categoryId].length > 0) {
          orderedCategories[categoryId] = productsByCategory[categoryId]
        }
      })

      // Agregar cualquier categoría que no esté en el orden específico al final
      Object.keys(productsByCategory).forEach((categoryIdStr) => {
        const categoryId = Number(categoryIdStr)
        if (!categoryOrder.includes(categoryId) && productsByCategory[categoryId].length > 0) {
          orderedCategories[categoryId] = productsByCategory[categoryId]
        }
      })

      return orderedCategories
    }

    // Datos de demostración mínimos con el orden correcto y propiedades completas
    const demoData: { [categoryId: number]: Product[] } = {}
    // IMPORTANTE: Crear el objeto en el orden específico requerido
    // 1=Verduras, 2=Frutas, 5=Hierbas, 3=IGV, 4=Otros
    demoData[1] = [
      {
        id: 1,
        name: "Acelga",
        price: 0,
        unitMeasurementId: 1,
        unitMeasurement: { id: 1, name: "kg-mz", abbreviation: "kg-mz" },
        categoryId: 1,
      },
    ]
    demoData[2] = [
      {
        id: 4,
        name: "Manzana",
        price: 0,
        unitMeasurementId: 2,
        unitMeasurement: { id: 2, name: "kg", abbreviation: "kg" },
        categoryId: 2,
      },
    ]
    demoData[5] = [
      {
        id: 6,
        name: "Huatacay",
        price: 0,
        unitMeasurementId: 1,
        unitMeasurement: { id: 1, name: "kg-mz", abbreviation: "kg-mz" },
        categoryId: 5,
      },
    ]
    demoData[3] = [
      {
        id: 8,
        name: "IGV Product",
        price: 0,
        unitMeasurementId: 2,
        unitMeasurement: { id: 2, name: "kg", abbreviation: "kg" },
        categoryId: 3,
      },
    ]
    demoData[4] = [
      {
        id: 9,
        name: "Otros Product",
        price: 0,
        unitMeasurementId: 1,
        unitMeasurement: { id: 1, name: "kg-mz", abbreviation: "kg-mz" },
        categoryId: 4,
      },
    ]

    return demoData
  }

  // NUEVA FUNCIÓN: Obtener cantidad de producto por empresa (combinando todas las áreas) con colores
  const getProductQuantityByCompany = (productId: number, companyId: number) => {
    const companyAreas = getAreasByCompany()[companyId]?.filter((area: Area) => areasWithOrders.includes(area.id)) || []
    if (companyAreas.length === 0) {
      return ""
    }

    const quantities: Array<{ quantity: string; color: string; areaName: string }> = []

    // Buscar cantidades en cada área de la empresa
    companyAreas.forEach((area) => {
      if (productQuantities[area.id] && productQuantities[area.id][productId]) {
        // Buscar en las órdenes los items con este productId y areaId
        for (const order of orders) {
          if (order.areaId === area.id) {
            for (const item of order.orderItems) {
              if (item.productId === productId) {
                const unit = item.unitMeasurement?.name || ""
                quantities.push({
                  quantity: `${item.quantity}${unit}`,
                  color: area.color,
                  areaName: area.name,
                })
              }
            }
          }
        }

        // Si no encontramos nada en las órdenes, usar la cantidad del estado
        if (quantities.filter((q) => q.areaName === area.name).length === 0 && productQuantities[area.id][productId]) {
          const product = products.find((p) => p.id === productId)
          const unit = product?.unitMeasurement?.name || ""
          quantities.push({
            quantity: `${productQuantities[area.id][productId]}${unit}`,
            color: area.color,
            areaName: area.name,
          })
        }
      }
    })

    // Crear HTML con colores para cada cantidad
    return quantities
      .map((item) => {
        return `<span style="color: ${item.color}; font-weight: bold;">${item.quantity}</span>`
      })
      .join(" + ")
  }

  // NUEVA FUNCIÓN: Obtener cantidad de producto por empresa para Excel (sin formato HTML)
  const getProductQuantityForExcel = (productId: number, companyId: number) => {
    const companyAreas = getAreasByCompany()[companyId]?.filter((area: Area) => areasWithOrders.includes(area.id)) || []
    if (companyAreas.length === 0) {
      return ""
    }

    const quantities: string[] = []

    // Buscar cantidades en cada área de la empresa
    companyAreas.forEach((area) => {
      if (productQuantities[area.id] && productQuantities[area.id][productId]) {
        // Buscar en las órdenes los items con este productId y areaId
        for (const order of orders) {
          if (order.areaId === area.id) {
            for (const item of order.orderItems) {
              if (item.productId === productId) {
                const unit = item.unitMeasurement?.name || ""
                quantities.push(`${item.quantity}${unit}`)
              }
            }
          }
        }

        // Si no encontramos nada en las órdenes, usar la cantidad del estado
        if (quantities.length === 0 && productQuantities[area.id][productId]) {
          const product = products.find((p) => p.id === productId)
          const unit = product?.unitMeasurement?.name || ""
          quantities.push(`${productQuantities[area.id][productId]}${unit}`)
        }
      }
    })

    // Unir con + si hay múltiples cantidades
    return quantities.join(" + ")
  }

  // NUEVA FUNCIÓN: Calcular totales por categoría para toda la empresa
  const calculateCompanyTotalByCategory = (companyId: number, categoryId: number) => {
    const companyAreas = getAreasByCompany()[companyId]?.filter((area: Area) => areasWithOrders.includes(area.id)) || []
    if (companyAreas.length === 0) return 0

    let productCount = 0
    const categoryProducts = products.filter((p) => p.categoryId === categoryId)

    // Contar productos únicos que tienen pedidos en cualquier área de la empresa
    categoryProducts.forEach((product) => {
      let hasOrderInCompany = false
      companyAreas.forEach((area) => {
        if (
          productQuantities[area.id] &&
          productQuantities[area.id][product.id] &&
          productQuantities[area.id][product.id] > 0
        ) {
          hasOrderInCompany = true
        }
      })
      if (hasOrderInCompany) {
        productCount += 1
      }
    })

    return productCount
  }

  // Agrupar áreas por compañía
  const getAreasByCompany = () => {
    const areasByCompany: { [companyId: number]: Area[] } = {}
    companies.forEach((company) => {
      areasByCompany[company.id] = []
    })
    areas.forEach((area) => {
      if (area.companyId && areasByCompany[area.companyId]) {
        areasByCompany[area.companyId].push(area)
      }
    })
    return areasByCompany
  }

  // NUEVA FUNCIÓN: Renderizar tabla de observaciones por empresa
  const renderObservationsTable = () => {
    const observationsByArea = getObservationsByArea()
    const hasObservations = Object.keys(observationsByArea).length > 0

    if (!hasObservations) {
      return null
    }

    // Filtrar compañías que tienen áreas con pedidos
    const companiesWithOrders = companies.filter((company) => {
      const companyAreas = getAreasByCompany()[company.id] || []
      return companyAreas.some((area) => areasWithOrders.includes(area.id))
    })

    return (
      <div className="mb-8">
        <h4 className="text-md font-medium mb-2">Observaciones</h4>
        <div className="rounded-md border overflow-hidden">
          <div className="max-h-[200px] overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-white">
                  <th className="px-4 py-2 text-left border bg-yellow-200 sticky left-0 z-20">OBSERVACION</th>
                  {companiesWithOrders.map((company) => {
                    const companyAreas =
                      getAreasByCompany()[company.id]?.filter((area) => areasWithOrders.includes(area.id)) || []
                    if (companyAreas.length === 0) {
                      return null
                    }

                    // Usar el color de la empresa si está disponible, sino el color de la primera área
                    const companyColor = company.color || companyAreas[0]?.color || "#CCCCCC"
                    const textColor = getTextColor()

                    return (
                      <th
                        key={company.id}
                        className="px-4 py-2 text-center border uppercase"
                        style={{
                          backgroundColor: companyColor,
                          color: textColor,
                        }}
                      >
                        {company.name}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border font-medium bg-yellow-50 sticky left-0 z-10">Detalle</td>
                  {companiesWithOrders.map((company) => {
                    const companyAreas =
                      getAreasByCompany()[company.id]?.filter((area) => areasWithOrders.includes(area.id)) || []
                    if (companyAreas.length === 0) {
                      return null
                    }

                    // Combinar observaciones de todas las áreas de la empresa
                    const allObservations: string[] = []
                    companyAreas.forEach((area) => {
                      const areaObservations = observationsByArea[area.id] || []
                      allObservations.push(...areaObservations)
                    })

                    // Eliminar duplicados y unir
                    const uniqueObservations = [...new Set(allObservations)]
                    const observationText = uniqueObservations.join("; ")

                    return (
                      <td key={company.id} className="px-4 py-2 border bg-yellow-50 min-w-[120px] text-left">
                        {observationText}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Modificar la función generatePreview para asegurar que use las fechas seleccionadas
  const generatePreview = async () => {
    setIsLoading(true)
    setHasData(false)
    setShowReport(false)

    try {
      // Establecer la fecha del reporte según el tipo seleccionado
      let orders: Order[] = []
      let apiUrl = ""

      if (reportType === "day" && selectedDate) {
        // Para reportes de un solo día, necesitamos el inicio y fin del día
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        // Formatear fechas en ISO8601
        const startDateISO = startOfDay.toISOString()
        const endDateISO = endOfDay.toISOString()

        setReportDate(format(selectedDate, "dd/MM/yyyy"))

        // Usar la ruta correcta para filtrar por fecha
        console.log(`Cargando órdenes para la fecha: ${format(selectedDate, "yyyy-MM-dd")}`)
        apiUrl = `/orders/filter?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`
      } else if (reportType === "range" && dateRange.from && dateRange.to) {
        // Para reportes de rango, usamos desde el inicio del primer día hasta el final del último día
        const startOfRange = new Date(dateRange.from)
        startOfRange.setHours(0, 0, 0, 0)
        const endOfRange = new Date(dateRange.to)
        endOfRange.setHours(23, 59, 59, 999)

        // Formatear fechas en ISO8601
        const startDateISO = startOfRange.toISOString()
        const endDateISO = endOfRange.toISOString()

        setReportDate(`${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`)

        // Usar la ruta correcta para filtrar por rango de fechas
        console.log(
          `Cargando órdenes para el rango: ${format(dateRange.from, "yyyy-MM-dd")} a ${format(dateRange.to, "yyyy-MM-dd")}`,
        )
        apiUrl = `/orders/filter?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`
      }

      if (apiUrl) {
        const ordersResponse = await api.get(apiUrl)
        orders = ordersResponse.data
        console.log("Órdenes cargadas:", orders.length)
      } else {
        console.error("No se pudo determinar la URL de la API")
        toast.error("Error al generar vista previa", {
          description: "No se pudo determinar el período para el reporte.",
        })
        setIsLoading(false)
        return
      }

      // Verificar si hay órdenes
      if (!orders || orders.length === 0) {
        toast.warning("No hay órdenes", {
          description: "No se encontraron órdenes para el período seleccionado.",
        })
        setIsLoading(false)
        return
      }

      // Cargar datos completos para cada orden
      const ordersWithDetails = await Promise.all(
        orders.map(async (order: Order) => {
          try {
            // Obtener datos del usuario si no están incluidos
            let user = order.user
            if (!user && order.userId) {
              try {
                const userResponse = await api.get(`/users/${order.userId}`)
                user = userResponse.data
              } catch (error) {
                console.error(`Error al cargar usuario ${order.userId}:`, error)
              }
            }

            // Obtener datos de productos para cada item
            const orderItemsWithProducts = await Promise.all(
              order.orderItems.map(async (item: OrderItem) => {
                try {
                  // Si el producto no está incluido, cargarlo
                  let product = item.product
                  if (!product && item.productId) {
                    const productResponse = await api.get(`/products/${item.productId}`)
                    product = productResponse.data

                    // Obtener unidad de medida si no está incluida
                    if (product && product.unitMeasurementId && !product.unitMeasurement) {
                      try {
                        const unitResponse = await api.get(`/unit-measurements/${product.unitMeasurementId}`)
                        product.unitMeasurement = unitResponse.data
                      } catch (error) {
                        console.error(`Error al cargar unidad de medida ${product.unitMeasurementId}:`, error)
                      }
                    }
                  }

                  return { ...item, product }
                } catch (error) {
                  console.error(`Error al cargar producto ${item.productId}:`, error)
                  return item
                }
              }),
            )

            // Obtener área si no está incluida
            let area = order.area
            if (!area && order.areaId) {
              const foundArea = areas.find((a) => a.id === order.areaId)
              if (foundArea) {
                area = foundArea
              }
            } else if (!area && user?.areas && user.areas.length > 0) {
              // Si no hay areaId pero el usuario tiene áreas, usar la primera
              area = user.areas[0]
            }

            return {
              ...order,
              user,
              area,
              orderItems: orderItemsWithProducts,
            }
          } catch (error) {
            console.error(`Error al cargar detalles para orden ${order.id}:`, error)
            return order
          }
        }),
      )

      setOrders(ordersWithDetails)

      // Procesar datos para el reporte - cantidades de productos por área
      const quantities: { [areaId: number]: { [productId: number]: number } } = {}
      const areasWithOrdersIds: number[] = []

      // Inicializar estructura para todas las áreas
      areas.forEach((area) => {
        quantities[area.id] = {}
      })

      // Agrupar productos por área basado en las órdenes
      ordersWithDetails.forEach((order) => {
        const areaId =
          order.areaId ||
          order.area?.id ||
          (order.user?.areas && order.user.areas.length > 0 ? order.user.areas[0].id : null)

        if (areaId) {
          if (!quantities[areaId]) {
            quantities[areaId] = {}
          }

          // Registrar esta área como una con pedidos
          if (!areasWithOrdersIds.includes(areaId)) {
            areasWithOrdersIds.push(areaId)
          }

          order.orderItems.forEach((item) => {
            if (item.productId) {
              // Create a unique key that includes both product ID and unit measurement ID
              const productKey = item.productId
              if (!quantities[areaId][productKey]) {
                quantities[areaId][productKey] = 0
              }
              quantities[areaId][productKey] += item.quantity
            }
          })
        }
      })

      setProductQuantities(quantities)
      setAreasWithOrders(areasWithOrdersIds)

      // Verificar si hay datos para mostrar
      let hasAnyData = false
      for (const areaId in quantities) {
        if (Object.keys(quantities[areaId]).length > 0) {
          hasAnyData = true
          break
        }
      }

      if (!hasAnyData) {
        toast.warning("No hay datos para mostrar", {
          description: "No se encontraron productos en las órdenes para el período seleccionado.",
        })
        setIsLoading(false)
        return
      }

      // Indicar que hay datos disponibles
      setHasData(true)

      // Mostrar el reporte
      setShowReport(true)
    } catch (error) {
      console.error("Error al generar vista previa:", error)
      toast.error("Error al generar vista previa", {
        description: "No se pudieron cargar los datos para el reporte.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // NUEVA FUNCIÓN: Renderizar tablas por categoría con columnas de empresa
  const renderCategoryTables = () => {
    const productsByCategory = getProductsForReport()

    // ORDEN ESPECÍFICO: 1=Verduras, 2=Frutas, 5=Hierbas, 3=IGV, 4=Otros
    const categoryOrder = [1, 2, 5, 3, 4]

    // Crear array ordenado de categorías que existen
    const orderedCategoryEntries: Array<[string, Product[]]> = categoryOrder
      .filter((categoryId) => productsByCategory[categoryId])
      .map((categoryId) => [categoryId.toString(), productsByCategory[categoryId] as Product[]])

    // Agregar cualquier categoría adicional que no esté en el orden específico
    Object.entries(productsByCategory).forEach(([categoryIdStr, categoryProducts]) => {
      const categoryId = Number(categoryIdStr)
      if (!categoryOrder.includes(categoryId)) {
        orderedCategoryEntries.push([categoryIdStr, categoryProducts as Product[]])
      }
    })

    return orderedCategoryEntries.map(([categoryIdStr, categoryProducts]) => {
      const categoryId = Number.parseInt(categoryIdStr)
      const categoryName = categories[categoryId]?.name || `Categoría ${categoryId}`

      // Filtrar solo productos con pedidos
      const productsWithOrders = (categoryProducts as Product[])
        .filter((product: Product) => {
          // Verificar si hay algún pedido para este producto en cualquier área
          for (const areaId in productQuantities) {
            if (productQuantities[areaId][product.id]) {
              return true
            }
          }
          return false
        })
        .sort((a: Product, b: Product) => a.name.localeCompare(b.name)) // Ordenar alfabéticamente

      // Si no hay productos con pedidos en esta categoría, no mostrar la tabla
      if (productsWithOrders.length === 0) return null

      // Filtrar compañías que tienen áreas con pedidos
      const companiesWithOrders = companies.filter((company) => {
        const companyAreas = getAreasByCompany()[company.id] || []
        return companyAreas.some((area) => areasWithOrders.includes(area.id))
      })

      if (companiesWithOrders.length === 0) return null

      return (
        <div key={categoryId} className="mb-8">
          <h4 className="text-md font-medium mb-2">{categoryName}</h4>
          <div className="rounded-md border overflow-hidden">
            <div className="max-h-[350px] overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th colSpan={companiesWithOrders.length + 1} className="px-4 py-2 text-left border bg-white">
                      fecha: {reportDate}
                    </th>
                  </tr>
                  {/* Fila de compañías */}
                  <tr className="bg-white">
                    <th className="px-4 py-2 text-left border bg-gray-100 sticky left-0 z-20">
                      {categoryName.toUpperCase()}
                    </th>
                    {companiesWithOrders.map((company) => {
                      const companyAreas =
                        getAreasByCompany()[company.id]?.filter((area) => areasWithOrders.includes(area.id)) || []
                      if (companyAreas.length === 0) {
                        return null
                      }

                      // Usar el color de la empresa si está disponible, sino el color de la primera área
                      const companyColor = company.color || companyAreas[0]?.color || "#CCCCCC"
                      const textColor = getTextColor()

                      return (
                        <th
                          key={company.id}
                          className="px-4 py-2 text-center border uppercase"
                          style={{
                            backgroundColor: companyColor,
                            color: textColor,
                          }}
                        >
                          {company.name}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {productsWithOrders.map((product: Product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-2 text-left border bg-white sticky left-0">{product.name}</td>
                      {companiesWithOrders.map((company) => {
                        const companyAreas =
                          getAreasByCompany()[company.id]?.filter((area) => areasWithOrders.includes(area.id)) || []
                        if (companyAreas.length === 0) {
                          return null
                        }

                        return (
                          <td key={`${product.id}-${company.id}`} className="px-4 py-2 text-left border">
                            <span
                              dangerouslySetInnerHTML={{ __html: getProductQuantityByCompany(product.id, company.id) }}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-2 text-left border font-medium bg-white sticky left-0">TOTAL</td>
                    {companiesWithOrders.map((company) => {
                      const companyAreas =
                        getAreasByCompany()[company.id]?.filter((area) => areasWithOrders.includes(area.id)) || []
                      if (companyAreas.length === 0) {
                        return null
                      }

                      return (
                        <td key={`total-${company.id}`} className="px-4 py-2 text-left border font-medium">
                          {calculateCompanyTotalByCategory(company.id, categoryId)}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    })
  }

  // Función para manejar la entrada manual de fecha
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const [year, month, day] = dateValue.split("-").map(Number)
      const newDate = new Date(year, month - 1, day)
      setSelectedDate(newDate)
      setShowReport(false)
      setHasData(false)
      console.log("Fecha seleccionada manualmente:", format(newDate, "yyyy-MM-dd"))
    }
  }

  // Función para manejar la entrada manual de rango de fechas
  const handleDateRangeInputChange = (type: "from" | "to", e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const [year, month, day] = dateValue.split("-").map(Number)
      const newDate = new Date(year, month - 1, day)
      if (type === "from") {
        setDateRange((prev) => ({ ...prev, from: newDate }))
      } else {
        setDateRange((prev) => ({ ...prev, to: newDate }))
      }
      setShowReport(false)
      setHasData(false)
      console.log(`Fecha ${type} seleccionada manualmente:`, format(newDate, "yyyy-MM-dd"))
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          id="report-generator-dialog"
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent"
          onClick={() => setIsDialogOpen(true)}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Generar Reporte</span>
          <span className="sm:hidden">Reporte</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Productos</DialogTitle>
          <DialogDescription>
            Selecciona el período para generar el reporte de productos por empresas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Tipo de reporte</label>
              <Select
                value={reportType}
                onValueChange={(value) => {
                  setReportType(value as "day" | "range")
                  // Resetear el reporte al cambiar el tipo
                  setShowReport(false)
                  setHasData(false)
                }}
              >
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
                <div className="flex flex-col gap-2">
                  <Input
                    type="date"
                    value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                    onChange={handleDateInputChange}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    Fecha seleccionada: {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Ninguna"}
                  </div>
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
                      value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                      onChange={(e) => handleDateRangeInputChange("from", e)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                    <Input
                      type="date"
                      value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                      onChange={(e) => handleDateRangeInputChange("to", e)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Rango seleccionado: {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Ninguna"} -{" "}
                  {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Ninguna"}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                console.log(
                  "Generando reporte con fecha:",
                  reportType === "day"
                    ? format(selectedDate || new Date(), "yyyy-MM-dd")
                    : `${format(dateRange.from || new Date(), "yyyy-MM-dd")} a ${format(dateRange.to || new Date(), "yyyy-MM-dd")}`,
                )
                generatePreview()
              }}
              disabled={
                isLoading ||
                (reportType === "day" && !selectedDate) ||
                (reportType === "range" && (!dateRange.from || !dateRange.to))
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Reporte"
              )}
            </Button>
          </div>

          {/* Vista previa del reporte */}
          {showReport && (
            <div className="mt-4 space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Reporte de Productos por Empresa</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={downloadExcel} className="gap-1 bg-transparent">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Excel</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadPDF} className="gap-1 bg-transparent">
                    <FilePdf className="h-4 w-4" />
                    <span>PDF</span>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {renderCategoryTables()}
                {renderObservationsTable()}
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="mb-2">Reporte para: {reportDate}</div>
                <div className="text-xs">
                  <strong>Nota:</strong> Las cantidades están coloreadas por área dentro de cada empresa. Cada color
                  representa un área diferente.
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-2" />
                <p className="text-muted-foreground">Generando reporte...</p>
              </div>
            </div>
          ) : (
            !showReport && (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">
                  {reportType === "day"
                    ? "Selecciona un día y haz clic en 'Generar Reporte' para ver los resultados"
                    : "Selecciona un rango de fechas y haz clic en 'Generar Reporte' para ver los resultados"}
                </p>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
