"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu"

import { DropdownMenuContent } from "@/components/ui/dropdown-menu"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { DropdownMenu } from "@/components/ui/dropdown-menu"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Calendar,
  Filter,
  Search,
  Truck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { api } from "@/lib/axiosInstance"
import { OrderStatus } from "@/types/order"
import { toast } from "sonner"

// Importar el componente ReportGenerator
import { ReportGenerator } from "@/components/dashboard/orders/report-generator"

// Definir interfaces para los tipos
interface User {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  areaId?: number
}

// Update the Order interface to match the backend structure
interface Order {
  id: number
  userId: number
  customerId?: number // Keep for backward compatibility
  customer?: User
  areaId?: number
  totalAmount: number
  status: OrderStatus
  orderItems: OrderItem[] // Replace any with proper type
  createdAt?: string
}

// Add OrderItem interface
interface OrderItem {
  id?: number
  productId: number
  productName?: string
  quantity: number
  price: number
  total?: number
}

interface UsersMap {
  [key: number]: User
}

// Componente para mostrar el estado del pedido
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case OrderStatus.CREATED:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Pendiente</span>
        </Badge>
      )
    case OrderStatus.PROCESS:
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
          <Truck className="h-3 w-3" />
          <span>En proceso</span>
        </Badge>
      )
    case OrderStatus.DELIVERED:
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3" />
          <span>Entregado</span>
        </Badge>
      )
    default:
      return <Badge>{status}</Badge>
  }
}

// Fix the customer reference in the OrderCard component
function OrderCard({ order, onDelete }: { order: Order; onDelete: (id: number) => void }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedido #{order.id}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex justify-between">
          <p className="text-sm font-medium">Cliente:</p>
          <p className="text-sm">
            {order.customer
              ? `${order.customer.firstName} ${order.customer.lastName}`
              : `Cliente #${order.userId || order.customerId || "N/A"}`}
          </p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm font-medium">Fecha:</p>
          <p className="text-sm">
            {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy", { locale: es }) : "N/A"}
          </p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm font-medium">Estado:</p>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex justify-between">
          <p className="text-sm font-medium">Productos:</p>
          <p className="text-sm">
            {order.orderItems.length} {order.orderItems.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <div className="flex justify-between gap-2">
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link href={`/dashboard/orders/${order.id}`}>
              <Edit className="mr-1 h-3 w-3" />
              Editar
            </Link>
          </Button>
          <Button size="sm" variant="destructive" className="flex-1" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-1 h-3 w-3" />
            Eliminar
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el pedido #{order.id} y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onDelete(order.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const ordersPerPage = 10

  // Fix the fetchData function to handle both userId and customerId
  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersResponse, usersResponse] = await Promise.all([api.get("/orders"), api.get("/users")])

      // Crear un mapa de usuarios para acceso rápido
      const usersMap: UsersMap = usersResponse.data.reduce((acc: UsersMap, user: User) => {
        acc[user.id] = user
        return acc
      }, {})

      // Asignar los datos de usuario a cada orden
      const ordersWithUsers = ordersResponse.data.map((order: Order) => {
        // Use userId if available, otherwise fall back to customerId
        const userId = order.userId || order.customerId
        return {
          ...order,
          customer: userId ? usersMap[userId] : null,
        }
      })

      setOrders(ordersWithUsers)
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("No se pudieron cargar las órdenes. Por favor, intenta de nuevo más tarde.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Función para eliminar un pedido
  const handleDeleteOrder = async (id: number) => {
    setIsDeleting(true)
    try {
      await api.delete(`/orders/${id}`)
      setOrders(orders.filter((order) => order.id !== id))
      toast.success("Pedido eliminado", {
        description: `El pedido #${id} ha sido eliminado correctamente.`,
      })
      setOrderToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (err) {
      console.error("Error al eliminar el pedido:", err)
      toast.error("Error al eliminar", {
        description: "No se pudo eliminar el pedido. Por favor, intenta de nuevo.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Preparar la eliminación de un pedido
  const confirmDelete = (id: number) => {
    setOrderToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  // Filtrar pedidos por búsqueda y estado
  const filteredOrders = orders.filter((order) => {
    const customerName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase() : ""
    const customerEmail = order.customer?.email?.toLowerCase() || ""

    const matchesSearch =
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase()) ||
      customerEmail.includes(searchTerm.toLowerCase()) ||
      order.orderItems.some(
        (item) =>
          (item.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.productId).includes(searchTerm),
      )

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "created" && order.status === OrderStatus.CREATED) ||
      (selectedStatus === "process" && order.status === OrderStatus.PROCESS) ||
      (selectedStatus === "delivered" && order.status === OrderStatus.DELIVERED)

    return matchesSearch && matchesStatus
  })

  // Ordenar pedidos
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime()
    const dateB = new Date(b.createdAt || 0).getTime()

    switch (sortOrder) {
      case "oldest":
        return dateA - dateB
      case "total-asc":
        return a.totalAmount - b.totalAmount
      case "total-desc":
        return b.totalAmount - a.totalAmount
      default: // newest
        return dateB - dateA
    }
  })

  // Calcular pedidos para la página actual
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder)

  // Calcular total de páginas
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar órdenes</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => fetchOrders()}>
          Intentar de nuevo
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pedidos</h1>
        <div className="flex gap-2">
          <ReportGenerator />
          <Button size="sm" className="text-xs sm:text-sm" asChild>
            <Link href="/dashboard/orders/new">
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Pedido</span>
              <span className="sm:hidden">Nuevo</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex overflow-x-auto pb-2 sm:pb-0">
            <Tabs defaultValue="all" value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
              <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="created">Pendientes</TabsTrigger>
                <TabsTrigger value="process">En proceso</TabsTrigger>
                <TabsTrigger value="delivered">Entregados</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar pedidos..."
                className="w-full pl-8 h-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Calendar className="mr-2 h-4 w-4" />
                    Fecha
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Truck className="mr-2 h-4 w-4" />
                    Método de envío
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                  <SelectItem value="total-asc">Total: Menor a Mayor</SelectItem>
                  <SelectItem value="total-desc">Total: Mayor a Menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            {sortedOrders.length} resultados para &quot;{searchTerm}&quot;
          </div>
        )}

        {/* Vista móvil: Tarjetas */}
        <div className="md:hidden space-y-3">
          {currentOrders.length > 0 ? (
            currentOrders.map((order) => <OrderCard key={order.id} order={order} onDelete={handleDeleteOrder} />)
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No se encontraron pedidos</p>
            </div>
          )}
        </div>

        {/* Vista desktop: Tabla */}
        <div className="hidden md:block">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Lista de pedidos</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Productos</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="px-4 py-3 text-sm">#{order.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium">
                              {order.customer
                                ? `${order.customer.firstName} ${order.customer.lastName}`
                                : `Cliente #${order.userId || order.customerId}`}
                            </p>
                            {order.customer?.email && (
                              <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy", { locale: es }) : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {order.orderItems.length} {order.orderItems.length === 1 ? "producto" : "productos"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8" asChild>
                              <Link href={`/dashboard/orders/${order.id}`}>
                                <Edit className="mr-1 h-3 w-3" />
                                Editar
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              onClick={() => confirmDelete(order.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No se encontraron pedidos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "cursor-not-allowed opacity-50" : ""}
                />
              </PaginationItem>
              {/* Mostrar la primera página */}
              {currentPage > 2 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(1)
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
              )}
              {/* Mostrar los puntos suspensivos si hay más de dos páginas entre la primera y la actual */}
              {currentPage > 3 && <PaginationEllipsis />}

              {/* Mostrar la página anterior, la actual y la siguiente */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
                if (pageNumber >= 1 && pageNumber <= totalPages) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(pageNumber)
                        }}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }
                return null
              })}

              {/* Mostrar los puntos suspensivos si hay más de dos páginas entre la última y la actual */}
              {currentPage < totalPages - 2 && <PaginationEllipsis />}

              {/* Mostrar la última página */}
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(totalPages)
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el pedido #{orderToDelete} y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
