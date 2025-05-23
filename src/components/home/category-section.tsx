import Image from "next/image"
import Link from "next/link"
import { Leaf, Apple, ShoppingBag, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CategorySection() {
  const categories = [
    {
      title: "Verduras",
      description: "Amplia variedad de verduras frescas: Acelga, Cebolla, Cilantro, Apio, Brócoli y muchas más.",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744909701/2_bhlooi.jpg",
      bgColor: "from-green-500 to-green-600",
      icon: <Leaf className="h-6 w-6" />,
      link: "/login",
      sampleItems: ["Acelga", "Cebolla china", "Cilantro", "Apio", "Brócoli", "Espinaca"],
    },
    {
      title: "Frutas",
      description: "Frutas frescas y de temporada: Aguaymanto, Arándano, Chirimoya, Mango, Naranja y más.",
      image:
        "https://res.cloudinary.com/demzflxgq/image/upload/v1744910191/julia-zolotova-M_xIaxQE3Ms-unsplash_oarrco.jpg",
      bgColor: "from-red-500 to-red-600",
      icon: <Apple className="h-6 w-6" />,
      link: "/login",
      sampleItems: ["Aguaymanto", "Arándano", "Chirimoya", "Mango", "Naranja", "Palta"],
    },
    {
      title: "IGV",
      description: "Productos complementarios: Huevo de Codorniz, Quesos variados, Fideos y más.",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744910081/flat-lay-raw-vegetables-mix_foc8d3.jpg",
      bgColor: "from-yellow-500 to-yellow-600",
      icon: <ShoppingBag className="h-6 w-6" />,
      link: "/login",
      sampleItems: ["Huevo Codornis", "Queso Paria", "Queso LLuta", "Fideo Chino", "Wantan", "Siu Cau"],
    },
    {
      title: "Otros",
      description: "Productos adicionales: Cáscara de Cacao, Mondongo, Garbanzo, Chuño y más.",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744909683/vegeta_lbet82.jpg",
      bgColor: "from-purple-500 to-purple-600",
      icon: <Coffee className="h-6 w-6" />,
      link: "/login",
      sampleItems: ["Cascara de Cacao", "Mondonguito", "Garbanzo", "Chuño", "Higado", "Emoliente"],
    },
  ]

  return (
    <section id="categories-section" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Nuestras Categorías</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Descubre nuestra amplia selección de productos frescos y orgánicos, cuidadosamente seleccionados para
            ofrecerte lo mejor de la naturaleza.
          </p>
          <div className="w-24 h-1 bg-green-600 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col bg-white"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${category.bgColor} opacity-70 hover:opacity-80 transition-opacity duration-300`}
                ></div>

                <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">{category.icon}</div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">{category.title}</h3>
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col">
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>

                <div className="mb-4 flex-grow">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Productos destacados:</h4>
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {category.sampleItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={category.link} className="mt-auto">
                  <Button className="w-full bg-green-600 hover:bg-green-700">Ver todos los productos</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            ¿Buscas un producto específico? Tenemos más de 200 productos disponibles para tu negocio.
          </p>
          <Link href="/login">
            <Button className="bg-green-600 hover:bg-green-700 px-8">Ver catálogo completo</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
