"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { ShoppingCart, Star, Tag, Clock, Award, Plus, Minus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, selectedUnitId: number, quantity: number) => void
  isNew?: boolean
  isFeatured?: boolean
  disabled?: boolean
}

// Componente para mostrar estrellas de valoración
const StarRating = ({ rating }: { rating: number }) => {
  // Asegurarse de que el rating esté entre 0 y 5
  const safeRating = Math.min(5, Math.max(0, rating))

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3 w-3 mr-0.5",
            star <= safeRating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200",
          )}
        />
      ))}
    </div>
  )
}

// Función para formatear números con coma como separador decimal
const formatQuantity = (quantity: number): string => {
  if (quantity % 1 === 0) {
    return quantity.toFixed(0)
  } else {
    // Reemplazar punto por coma en el número con 2 decimales
    return quantity.toFixed(2).replace(".", ",")
  }
}

export function ProductCard({
  product,
  onAddToCart,
  isNew = false,
  isFeatured = false,
  disabled = false,
}: ProductCardProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<number>(
    product.productUnits.length > 0 ? product.productUnits[0].unitMeasurement.id : 0,
  )
  const [quantity, setQuantity] = useState<number>(1)
  const [quantityInput, setQuantityInput] = useState<string>("1")
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    // Comprobar al cargar y al cambiar el tamaño de la ventana
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Todos los productos tienen 5 estrellas (máxima calidad)
  const productRating = 5.0

  const handleAddToCart = () => {
    if (selectedUnitId && !disabled && quantity > 0) {
      onAddToCart(product, selectedUnitId, quantity)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0.25) {
      // Redondear a múltiplos de 0.25
      const roundedQuantity = Math.round(newQuantity * 4) / 4
      setQuantity(roundedQuantity)
      setQuantityInput(formatQuantity(roundedQuantity))
    }
  }

  const handleQuantityInputChange = (value: string) => {
    // Permitir números con coma como separador decimal
    const normalizedValue = value.replace(",", ".")
    const regex = /^\d*\.?\d{0,2}$/

    if (regex.test(normalizedValue) || value === "") {
      setQuantityInput(value)

      if (value !== "") {
        const numValue = Number.parseFloat(normalizedValue)
        if (!isNaN(numValue) && numValue > 0) {
          const roundedValue = Math.round(numValue * 4) / 4
          setQuantity(roundedValue)
        }
      }
    }
  }

  const handleQuantityInputBlur = () => {
    const normalizedValue = quantityInput.replace(",", ".")
    const numValue = Number.parseFloat(normalizedValue)

    if (!isNaN(numValue) && numValue > 0) {
      const roundedValue = Math.round(numValue * 4) / 4
      setQuantity(roundedValue)
      setQuantityInput(formatQuantity(roundedValue))
    } else {
      // Si el valor no es válido, restaurar el valor anterior
      setQuantityInput(formatQuantity(quantity))
    }
    setIsEditingQuantity(false)
  }

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 0.25)
  }

  const decrementQuantity = () => {
    if (quantity > 0.25) {
      handleQuantityChange(quantity - 0.25)
    }
  }

  // Obtener el nombre de la unidad seleccionada
  const getSelectedUnitName = () => {
    const selectedUnit = product.productUnits.find((pu) => pu.unitMeasurement.id === selectedUnitId)
    return selectedUnit?.unitMeasurement.name || "Unidad"
  }

  // Función para mostrar el modal de edición de cantidad en móvil
  const showMobileQuantityEditor = () => {
    if (isMobile && !disabled) {
      setIsEditingQuantity(true)
    }
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border border-border/40 transition-all duration-200 h-full flex flex-col",
        isHovered && !disabled ? "shadow-md border-border/80" : "shadow-sm",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div className="aspect-square overflow-hidden bg-muted/20">
          <Image
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              isHovered && !disabled ? "scale-105" : "",
            )}
            width={300}
            height={300}
          />
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {isNew && (
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[10px] px-1.5 py-0.5 flex items-center">
              <Clock className="h-3 w-3 mr-1" /> NUEVO
            </Badge>
          )}
        </div>
        {isFeatured && (
          <Badge className="absolute right-2 top-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-[10px] px-1.5 py-0.5 flex items-center">
            <Award className="h-3 w-3 mr-1" /> PREMIUM
          </Badge>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-12 opacity-0 transition-opacity duration-200"
          style={{ opacity: isHovered ? 0.8 : 0 }}
        />
      </div>

      <CardContent className="p-3 flex-grow flex flex-col">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="font-medium text-sm line-clamp-1 text-foreground/90">{product.name}</h3>
          {/* Precio oculto */}
        </div>

        {/* Valoración con estrellas */}
        <div className="flex items-center mb-1.5">
          <StarRating rating={productRating} />
          <span className="text-xs text-green-600 font-medium ml-1.5">5.0 • Excelente calidad</span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-grow">{product.description}</p>

        {/* Etiquetas de calidad premium */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300">
            ✨ Premium
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
            🏆 Calidad A+
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
            👑 Selección especial
          </span>
        </div>

        <div className="mt-auto space-y-3">
          {/* Cantidad y Unidad de Medida - Adaptado para móvil */}
          <div className="bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg p-3 border border-border/30">
            <div className="text-xs text-muted-foreground mb-2 flex items-center font-medium">
              <Tag className="h-3 w-3 mr-1 stroke-[2.5px]" />
              <span>Cantidad y Presentación</span>
            </div>

            {/* Contenedor principal con cantidad y unidad - Adaptativo */}
            <div className={cn("grid gap-2", isMobile ? "grid-cols-1 space-y-2" : "grid-cols-2")}>
              {/* Selector de cantidad - Adaptado para móvil */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Cantidad
                </label>
                {isMobile ? (
                  <div
                    className="flex items-center justify-between bg-background rounded-md border border-border/60 p-2 h-10"
                    onClick={showMobileQuantityEditor}
                  >
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full bg-muted/50 mr-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          decrementQuantity()
                        }}
                        disabled={disabled || quantity <= 0.25}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="text-sm font-medium">{formatQuantity(quantity)}</span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full bg-muted/50 ml-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          incrementQuantity()
                        }}
                        disabled={disabled}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">Toca para editar</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-background rounded-md border border-border/60 overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none hover:bg-muted flex-shrink-0"
                      onClick={decrementQuantity}
                      disabled={disabled || quantity <= 0.25}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <Input
                      type="text"
                      value={quantityInput}
                      onChange={(e) => handleQuantityInputChange(e.target.value)}
                      onBlur={handleQuantityInputBlur}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleQuantityInputBlur()
                        }
                      }}
                      className="h-7 border-0 text-center text-xs font-medium bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
                      disabled={disabled}
                      inputMode="decimal"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none hover:bg-muted flex-shrink-0"
                      onClick={incrementQuantity}
                      disabled={disabled}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Selector de unidad */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Presentación
                </label>
                <Select
                  value={selectedUnitId.toString()}
                  onValueChange={(value) => setSelectedUnitId(Number.parseInt(value))}
                  disabled={disabled}
                >
                  <SelectTrigger
                    className={cn(
                      "text-xs bg-background border-border/60 focus:ring-green-500/20 focus:ring-offset-0 focus:border-green-500/80",
                      isMobile ? "h-10" : "h-7",
                    )}
                  >
                    <SelectValue placeholder="Unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.productUnits.map((pu) => (
                      <SelectItem key={pu.id} value={pu.unitMeasurement.id.toString()}>
                        {pu.unitMeasurement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumen de selección */}
            <div className="mt-2 text-center">
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                {formatQuantity(quantity)} {getSelectedUnitName()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium transition-all duration-200 h-9 shadow-md hover:shadow-lg"
          onClick={handleAddToCart}
          disabled={disabled || product.productUnits.length === 0 || quantity <= 0}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
          Agregar {formatQuantity(quantity)} al carrito
        </Button>
      </CardFooter>

      {/* Modal para edición de cantidad en móvil */}
      {isMobile && isEditingQuantity && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => handleQuantityInputBlur()}
        >
          <div className="bg-white rounded-lg p-4 w-full max-w-xs shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-1 text-center">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">Editar cantidad ({getSelectedUnitName()})</p>

            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={decrementQuantity}
                disabled={disabled || quantity <= 0.25}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="mx-3 w-24">
                <Input
                  type="text"
                  value={quantityInput}
                  onChange={(e) => handleQuantityInputChange(e.target.value)}
                  className="h-12 text-center text-lg font-medium"
                  autoFocus
                  disabled={disabled}
                  inputMode="decimal"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={incrementQuantity}
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Presets de cantidad */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[0.5, 1, 2, 5].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuantityChange(preset)}
                >
                  {formatQuantity(preset)}
                </Button>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" className="w-[48%]" onClick={() => setIsEditingQuantity(false)}>
                Cancelar
              </Button>
              <Button className="w-[48%] bg-green-600 hover:bg-green-700" onClick={handleQuantityInputBlur}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
