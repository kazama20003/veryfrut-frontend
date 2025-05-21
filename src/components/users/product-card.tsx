"use client"

import Image from "next/image"
import { useState } from "react"
import { ShoppingCart, Star, Tag, Clock, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  onAddToCart: (product: Product, selectedUnitId: number) => void
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
  const [isHovered, setIsHovered] = useState(false)

  // Todos los productos tienen 5 estrellas (máxima calidad)
  const productRating = 5.0

  const handleAddToCart = () => {
    if (selectedUnitId && !disabled) {
      onAddToCart(product, selectedUnitId)
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

        {/* Etiquetas de calidad */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
            Premium
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
            Calidad A+
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
            Selección especial
          </span>
        </div>

        <div className="mt-auto">
          <div className="text-xs text-muted-foreground mb-1 flex items-center">
            <Tag className="h-3 w-3 mr-1 stroke-[2.5px]" />
            <span>Presentación:</span>
          </div>
          <Select
            value={selectedUnitId.toString()}
            onValueChange={(value) => setSelectedUnitId(Number.parseInt(value))}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs bg-background border-border/60 focus:ring-green-500/20 focus:ring-offset-0 focus:border-green-500/80">
              <SelectValue placeholder="Seleccionar unidad" />
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
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          size="sm"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200 h-9"
          onClick={handleAddToCart}
          disabled={disabled || product.productUnits.length === 0}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
          Agregar al carrito
        </Button>
      </CardFooter>
    </Card>
  )
}
