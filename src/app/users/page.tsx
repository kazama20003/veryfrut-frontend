"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { ShoppingCart, Search, X, AlertTriangle, SlidersHorizontal } from "lucide-react"

import { api } from "@/lib/axiosInstance"
import { ProductCard } from "@/components/users/product-card"
import { ShoppingCartDrawer } from "@/components/users/shopping-cart-drawer"
import { useCart } from "@/components/users/use-cart"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Interfaces para los tipos de datos
interface UnitMeasurement {
  id: number
  name: string
  description: string
}

interface ProductUnit {
  id: number
  productId: number
  unitMeasurementId: number
  unitMeasurement: UnitMeasurement
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  categoryId: number
  createdAt: string
  updatedAt: string
  productUnits: ProductUnit[]
  rating?: number
}

interface Category {
  id: number
  name: string
  description: string
}

type SortOption = "name" | "price" | "newest" | "rating"

// Hook para detección de dispositivo móvil optimizado
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768)

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return { isMobile, isClient }
}

// Componente de skeleton para productos - Mejorado
const ProductSkeleton = () => (
  <div className="flex flex-col animate-pulse bg-white rounded-lg border border-border/40 overflow-hidden min-h-[380px]">
    {/* Imagen skeleton */}
    <div className="w-full aspect-square bg-gray-200" />

    {/* Contenido skeleton */}
    <div className="p-3 flex-1 flex flex-col">
      {/* Título */}
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />

      {/* Rating */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-3 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>

      {/* Descripción */}
      <div className="space-y-1 mb-3">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Sección de cantidad */}
      <div className="mt-auto">
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20 mx-auto mt-2" />
        </div>
      </div>
    </div>

    {/* Botón skeleton */}
    <div className="p-3 pt-0">
      <div className="h-10 bg-gray-200 rounded w-full" />
    </div>
  </div>
)

// Componente de filtros móviles mejorado
const MobileFiltersSheet = ({
  isOpen,
  onOpenChange,
  categories,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  disabled,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  activeFilter: number | null
  onFilterChange: (categoryId: number | null) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  disabled: boolean
}) => (
  <Sheet open={isOpen} onOpenChange={onOpenChange}>
    <SheetContent side="left" className="w-[90%] sm:w-[400px] p-0">
      <SheetHeader className="p-6 pb-4">
        <SheetTitle className="text-left">Filtros y Ordenamiento</SheetTitle>
      </SheetHeader>

      <div className="px-6 pb-6 space-y-6">
        {/* Categorías mejoradas en móvil */}
        <div>
          <h3 className="font-semibold mb-4 text-base text-gray-900 flex items-center">
            <SlidersHorizontal className="h-4 w-4 mr-2 text-green-600" />
            Filtrar por Categoría
          </h3>
          <div className="space-y-3">
            <Button
              variant={activeFilter === null ? "default" : "outline"}
              className={cn(
                "w-full justify-between h-12 text-left font-medium",
                activeFilter === null
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "hover:bg-green-50 hover:border-green-300",
              )}
              onClick={() => {
                onFilterChange(null)
                onOpenChange(false)
              }}
              disabled={disabled}
            >
              <span>Todos los productos</span>
              <Badge
                variant={activeFilter === null ? "secondary" : "outline"}
                className={cn("ml-2", activeFilter === null ? "bg-green-100 text-green-800" : "")}
              >
                {/* You'll need to pass total count here */}
                Todos
              </Badge>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeFilter === category.id ? "default" : "outline"}
                className={cn(
                  "w-full justify-between h-12 text-left font-medium",
                  activeFilter === category.id
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:border-green-300",
                )}
                onClick={() => {
                  onFilterChange(category.id)
                  onOpenChange(false)
                }}
                disabled={disabled}
              >
                <span>{category.name}</span>
                {activeFilter === category.id && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    Activo
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Ordenamiento mejorado en móvil */}
        <div>
          <h3 className="font-semibold mb-4 text-base text-gray-900 flex items-center">
            <Search className="h-4 w-4 mr-2 text-green-600" />
            Ordenar productos
          </h3>
          <div className="space-y-3">
            {[
              { value: "name" as SortOption, label: "Nombre (A-Z)", icon: "📝" },
              { value: "price" as SortOption, label: "Precio (menor a mayor)", icon: "💰" },
              { value: "newest" as SortOption, label: "Más recientes", icon: "🆕" },
              { value: "rating" as SortOption, label: "Mejor valorados", icon: "⭐" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "outline"}
                className={cn(
                  "w-full justify-between h-12 text-left font-medium",
                  sortBy === option.value
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:border-green-300",
                )}
                onClick={() => {
                  onSortChange(option.value)
                  onOpenChange(false)
                }}
                disabled={disabled}
              >
                <span className="flex items-center">
                  <span className="mr-3 text-lg">{option.icon}</span>
                  {option.label}
                </span>
                {sortBy === option.value && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    Activo
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
)

export default function ProductsPage() {
  // Estados para los datos
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [activeFilter, setActiveFilter] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isPageBlocked, setIsPageBlocked] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [mobileSearchValue, setMobileSearchValue] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  const { isMobile, isClient } = useIsMobile()

  // Hook para el carrito
  const {
    cart,
    addToCart,
    addToCartAsDuplicate,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart()

  // Función para cargar datos
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)

      const [productsResponse, categoriesResponse] = await Promise.all([api.get("/products"), api.get("/categories")])

      setProducts(productsResponse.data)
      setFilteredProducts(productsResponse.data)
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Error al cargar productos", {
        description: "No se pudieron cargar los productos. Por favor, intenta nuevamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Función de ordenamiento
  const sortProducts = useCallback((products: Product[], sortOption: SortOption) => {
    const sorted = [...products]

    switch (sortOption) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case "price":
        return sorted.sort((a, b) => a.price - b.price)
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "rating":
        return sorted.sort((a, b) => (b.rating || 5) - (a.rating || 5))
      default:
        return sorted
    }
  }, [])

  // Aplicar filtros y ordenamiento
  const applyFiltersAndSort = useCallback(
    (categoryId: number | null, query: string, sort: SortOption) => {
      let filtered = [...products]

      // Filtrar por categoría
      if (categoryId !== null) {
        filtered = filtered.filter((product) => product.categoryId === categoryId)
      }

      // Filtrar por búsqueda
      if (query.trim() !== "") {
        const searchTerms = query.toLowerCase().split(" ")
        filtered = filtered.filter((product) => {
          const productText = `${product.name} ${product.description}`.toLowerCase()
          return searchTerms.every((term) => productText.includes(term))
        })
      }

      // Ordenar
      filtered = sortProducts(filtered, sort)

      setFilteredProducts(filtered)
    },
    [products, sortProducts],
  )

  // Manejar cambio de filtro
  const handleFilterChange = useCallback(
    (categoryId: number | null) => {
      setActiveFilter(categoryId)
      applyFiltersAndSort(categoryId, searchQuery, sortBy)
    },
    [applyFiltersAndSort, searchQuery, sortBy],
  )

  // Manejar búsqueda
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      applyFiltersAndSort(activeFilter, query, sortBy)
    },
    [applyFiltersAndSort, activeFilter, sortBy],
  )

  // Manejar ordenamiento
  const handleSortChange = useCallback(
    (sort: SortOption) => {
      setSortBy(sort)
      applyFiltersAndSort(activeFilter, searchQuery, sort)
    },
    [applyFiltersAndSort, activeFilter, searchQuery],
  )

  // Búsqueda móvil
  const handleMobileSearch = useCallback(() => {
    setSearchQuery(mobileSearchValue)
    applyFiltersAndSort(activeFilter, mobileSearchValue, sortBy)
  }, [mobileSearchValue, activeFilter, sortBy, applyFiltersAndSort])

  const clearMobileSearch = useCallback(() => {
    setMobileSearchValue("")
    setSearchQuery("")
    applyFiltersAndSort(activeFilter, "", sortBy)
    mobileSearchInputRef.current?.focus()
  }, [activeFilter, sortBy, applyFiltersAndSort])

  // Remove these functions:
  // const isNewProduct = useCallback((createdAt: string) => {
  //   const productDate = new Date(createdAt)
  //   const now = new Date()
  //   const diffTime = Math.abs(now.getTime() - productDate.getTime())
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  //   return diffDays <= 7
  // }, [])

  // const isFeaturedProduct = useCallback((id: number) => {
  //   return id % 5 === 0
  // }, [])

  // Funciones del carrito
  const handleOpenCart = useCallback(() => {
    if (!isPageBlocked) setIsCartOpen(true)
  }, [isPageBlocked])

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false)
    setIsPageBlocked(false)
  }, [])

  const handlePageBlock = useCallback((blocked: boolean) => {
    setIsPageBlocked(blocked)
  }, [])

  const handleManualUnblock = useCallback(() => {
    setIsPageBlocked(false)
    setIsCartOpen(false)
    toast.success("Página desbloqueada", {
      description: "La interfaz ha sido desbloqueada correctamente.",
    })
  }, [])

  // Temporizador de seguridad
  useEffect(() => {
    if (!isPageBlocked) return

    const safetyTimer = setTimeout(() => {
      setIsPageBlocked(false)
      setIsCartOpen(false)
      toast.info("Desbloqueo automático", {
        description: "La página ha sido desbloqueada automáticamente.",
      })
    }, 5000)

    return () => clearTimeout(safetyTimer)
  }, [isPageBlocked])

  // Estadísticas memoizadas
  const stats = useMemo(
    () => ({
      total: products.length,
      filtered: filteredProducts.length,
      categories: categories.length,
      cartItems: getTotalItems(),
    }),
    [products.length, filteredProducts.length, categories.length, getTotalItems],
  )

  // Configuración de grid responsivo optimizado - Estático para evitar hidratación
  const gridClasses = "grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Header mejorado */}
        <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
          <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Productos Premium
              </h1>
              {!isLoading && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                  {stats.filtered} productos
                </Badge>
              )}
            </div>

            {/* Controles del header */}
            <div className="flex items-center gap-2">
              {/* Búsqueda móvil mejorada */}
              {isClient && isMobile && (
                <div
                  className={cn("relative transition-all duration-300 ease-in-out", isSearchFocused ? "w-44" : "w-36")}
                >
                  <Input
                    ref={mobileSearchInputRef}
                    type="search"
                    placeholder="Buscar productos..."
                    className="h-9 pl-9 pr-9 text-sm border-border/60 focus:border-green-500/60 rounded-lg"
                    value={mobileSearchValue}
                    onChange={(e) => setMobileSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMobileSearch()}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    disabled={isPageBlocked}
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  {mobileSearchValue && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={clearMobileSearch}
                      disabled={isPageBlocked}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* Filtros móviles */}
              {isClient && isMobile && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 relative"
                  onClick={() => setIsMobileFilterOpen(true)}
                  disabled={isPageBlocked}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilter !== null && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-600 rounded-full" />
                  )}
                </Button>
              )}

              {/* Botón de carrito */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 relative"
                onClick={handleOpenCart}
                disabled={isPageBlocked}
              >
                <ShoppingCart className="h-4 w-4" />
                {stats.cartItems > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-green-600 hover:bg-green-700">
                    {stats.cartItems > 99 ? "99+" : stats.cartItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {/* Alerta de bloqueo */}
          {isPageBlocked && (
            <Alert className="mb-6 bg-amber-50 border-amber-200 animate-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between text-amber-800">
                <span className="font-medium">Página temporalmente bloqueada</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-3 bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800"
                  onClick={handleManualUnblock}
                >
                  Desbloquear
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Controles mejorados para escritorio - Solo renderizar después de hidratación */}
          {isClient && !isMobile && (
            <div className="mb-8 space-y-6">
              {/* Primera fila: Filtros de categorías */}
              <div className="bg-white rounded-xl border border-border/40 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <SlidersHorizontal className="h-5 w-5 mr-2 text-green-600" />
                    Filtrar por Categoría
                  </h2>
                  {activeFilter !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange(null)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpiar filtro
                    </Button>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex gap-3 flex-wrap">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-11 w-32" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant={activeFilter === null ? "default" : "outline"}
                      className={cn(
                        "h-11 px-6 font-medium transition-all duration-200",
                        activeFilter === null
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                          : "hover:bg-green-50 hover:border-green-300 hover:text-green-700",
                      )}
                      onClick={() => handleFilterChange(null)}
                      disabled={isPageBlocked}
                    >
                      Todos los productos
                      {activeFilter === null && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                          {stats.total}
                        </Badge>
                      )}
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={activeFilter === category.id ? "default" : "outline"}
                        className={cn(
                          "h-11 px-6 font-medium transition-all duration-200",
                          activeFilter === category.id
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                            : "hover:bg-green-50 hover:border-green-300 hover:text-green-700",
                        )}
                        onClick={() => handleFilterChange(category.id)}
                        disabled={isPageBlocked}
                      >
                        {category.name}
                        {activeFilter === category.id && (
                          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                            {stats.filtered}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Segunda fila: Búsqueda y ordenamiento */}
              <div className="bg-white rounded-xl border border-border/40 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  {/* Sección de búsqueda */}
                  <div className="flex-1 max-w-2xl">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Search className="h-4 w-4 mr-2 text-green-600" />
                      Buscar productos
                    </h3>
                    {isLoading ? (
                      <Skeleton className="h-12 w-full max-w-lg" />
                    ) : (
                      <div className="relative max-w-lg">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="search"
                          placeholder="Buscar por nombre o descripción..."
                          className="h-12 pl-12 pr-12 text-base border-2 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          disabled={isPageBlocked}
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
                            onClick={() => handleSearch("")}
                            disabled={isPageBlocked}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sección de ordenamiento */}
                  <div className="ml-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Ordenar por</h3>
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value as SortOption)}
                      className="h-12 px-4 pr-10 rounded-lg border-2 border-gray-200 bg-white text-base focus:outline-none focus:border-green-500 focus:ring-green-500/20 min-w-[200px]"
                      disabled={isPageBlocked}
                    >
                      <option value="name">Nombre (A-Z)</option>
                      <option value="price">Precio (menor a mayor)</option>
                      <option value="newest">Más recientes</option>
                      <option value="rating">Mejor valorados</option>
                    </select>
                  </div>
                </div>

                {/* Estadísticas de resultados */}
                {!isLoading && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Mostrando {stats.filtered} de {stats.total} productos
                        {activeFilter !== null && (
                          <span className="ml-1">
                            en{" "}
                            <span className="font-medium text-green-600">
                              {categories.find((c) => c.id === activeFilter)?.name}
                            </span>
                          </span>
                        )}
                      </span>
                      {searchQuery && <span className="text-green-600 font-medium">Búsqueda: {searchQuery}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resultados de búsqueda */}
          {!isLoading && searchQuery && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800">
                    Resultados para: <span className="text-green-600">{searchQuery}</span>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {stats.filtered} {stats.filtered === 1 ? "producto encontrado" : "productos encontrados"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    setSearchQuery("")
                    setMobileSearchValue("")
                    applyFiltersAndSort(activeFilter, "", sortBy)
                  }}
                  disabled={isPageBlocked}
                >
                  <X className="mr-1 h-3 w-3" />
                  Limpiar
                </Button>
              </div>
            </div>
          )}

          {/* Grid de productos con mejor responsividad */}
          <div className={gridClasses}>
            {isLoading ? (
              Array.from({ length: isMobile ? 6 : 12 }).map((_, index) => <ProductSkeleton key={index} />)
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  disabled={isPageBlocked}
                  onAddToCart={addToCart}
                  onAddToCartAsDuplicate={addToCartAsDuplicate}
                  onUpdateCartItemQuantity={updateCartItemQuantity}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 p-4 rounded-full bg-muted/30">
                  <Search className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery
                    ? "Intenta con otros términos de búsqueda o ajusta los filtros"
                    : "No hay productos disponibles en esta categoría"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setMobileSearchValue("")
                    setActiveFilter(null)
                    applyFiltersAndSort(null, "", sortBy)
                  }}
                  disabled={isPageBlocked}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  Ver todos los productos
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Filtros móviles - Solo renderizar en cliente */}
      {isClient && (
        <MobileFiltersSheet
          isOpen={isMobileFilterOpen}
          onOpenChange={setIsMobileFilterOpen}
          categories={categories}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          disabled={isPageBlocked}
        />
      )}

      {/* Carrito de compras */}
      <ShoppingCartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        totalPrice={getTotalPrice()}
        onPageBlock={handlePageBlock}
      />
    </>
  )
}
