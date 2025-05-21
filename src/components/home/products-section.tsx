import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Truck, Award, ShieldCheck } from "lucide-react"

export default function ProductsSection() {
  const productCategories = [
    {
      id: 1,
      name: "Frutas Premium",
      description: "Selección de frutas de primera calidad para hoteles y restaurantes de alta gama.",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744910191/julia-zolotova-M_xIaxQE3Ms-unsplash_oarrco.jpg",
      features: ["Calibre seleccionado", "Maduración controlada", "Disponible todo el año"],
      certification: "Global G.A.P.",
      minOrder: "Caja de 5kg",
    },
    {
      id: 2,
      name: "Verduras Orgánicas",
      description:
        "Verduras cultivadas sin pesticidas ni químicos, ideales para cocinas comprometidas con la sostenibilidad.",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744912451/produce-azerbaijan-stockers-scaled_rxodoe.jpg",
      features: ["100% orgánicas", "Frescura garantizada", "Cultivo local"],
      certification: "Certificación Ecológica EU",
      minOrder: "Caja de 10kg",
    },
    {
      id: 3,
      name: "Frutas Exóticas",
      description: "Variedades exclusivas de frutas internacionales para menús innovadores y creativos.",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1746571507/1.-Frutas-tropicales-Caribe_nl4jqv.jpg",
      features: ["Importación selectiva", "Disponibilidad limitada", "Sabores únicos"],
      certification: "Control de Calidad Premium",
      minOrder: "Según disponibilidad",
    },
    {
      id: 4,
      name: "Línea Institucional",
      description: "Productos adaptados a las necesidades de comedores escolares, hospitales y servicios de catering.",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744911096/shutterstock_1756689209_xlpwey.jpg",
      features: ["Volumen garantizado", "Precios estables", "Entregas programadas"],
      certification: "ISO 22000",
      minOrder: "Consultar según volumen",
    },
  ]

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center mb-12">
          <h2 className="text-3xl font-bold text-center mb-3">Categorías de Productos</h2>
          <div className="w-24 h-1 bg-green-600 mb-6"></div>
          <p className="text-gray-600 max-w-3xl text-center">
            Ofrecemos una amplia gama de productos frescos de alta calidad para satisfacer las necesidades específicas
            de su negocio. Todas nuestras líneas de productos cumplen con los más altos estándares de calidad y
            seguridad alimentaria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {productCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4"
                  loading="lazy"
                />
                <Badge className="absolute top-3 right-3 bg-green-600 hover:bg-green-700">Distribución Mayorista</Badge>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Certificación</p>
                      <p className="text-xs text-gray-500">{category.certification}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Truck className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Pedido mínimo</p>
                      <p className="text-xs text-gray-500">{category.minOrder}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 flex items-center">
                    <ShieldCheck className="h-4 w-4 text-green-600 mr-1" />
                    Características
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 pl-6 list-disc">
                    {category.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Ficha técnica
                  </Button>
                  <Link href="/contacto" className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                      Solicitar información
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-green-50 rounded-lg p-8 border border-green-100">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">¿Necesita productos específicos?</h3>
              <p className="text-gray-600">
                Ofrecemos soluciones personalizadas según las necesidades de su empresa. Contáctenos para discutir
                volúmenes, frecuencia de entrega y requisitos especiales.
              </p>
            </div>
            <Link href="/contacto">
              <Button className="bg-green-600 hover:bg-green-700 px-8 py-6 text-lg whitespace-nowrap">
                Contactar con ventas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
