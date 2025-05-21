import Image from "next/image"
import Link from "next/link"

export default function CategorySection() {
  const categories = [
    {
      title: "Frutas",
      image:
        "https://res.cloudinary.com/demzflxgq/image/upload/v1744910191/julia-zolotova-M_xIaxQE3Ms-unsplash_oarrco.jpg",
      bgColor: "bg-red-500",
      link: "#",
    },
    {
      title: "Verduras",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744909701/2_bhlooi.jpg",
      bgColor: "bg-orange-500",
      link: "#",
    },
    {
      title: "Orgánicos",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744910081/flat-lay-raw-vegetables-mix_foc8d3.jpg",
      bgColor: "bg-yellow-500",
      link: "#",
    },
    {
      title: "Temporada",
      image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744909683/vegeta_lbet82.jpg",
      bgColor: "bg-green-500",
      link: "#",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Nuestras Categorías</h2>
        <div className="w-24 h-1 bg-green-600 mx-auto"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <div
            key={index}
            className={`${category.bgColor} rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="p-6 text-white">
              <h3 className="text-xl font-bold mb-2">{category.title}</h3>
              <Link href={category.link} className="inline-block">
                <span className="text-sm font-medium hover:underline">Comprar Ahora</span>
              </Link>
            </div>
            <div className="relative h-60 w-full bg-gray-100">
              {/* Fallback mientras carga la imagen */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>

              <Image
                src={category.image || "/placeholder.svg"}
                alt={category.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover"
                loading="lazy"
              />

              {/* Eliminé el overlay que podría estar causando el problema */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
