import Link from "next/link"
import { Facebook, Twitter, Instagram, MapPin, Phone, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Veryfrut</h3>
            <p className="text-gray-400 mb-4">
              Distribuidor líder de frutas y verduras orgánicas, comprometidos con la calidad y la sostenibilidad.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="text-gray-400 hover:text-white">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="text-gray-400 hover:text-white">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin size={20} className="text-green-500 mr-2 mt-1" />
                <span className="text-gray-400">Calle Principal 123, Ciudad, País</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="text-green-500 mr-2" />
                <span className="text-gray-400">+1 234 567 890</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="text-green-500 mr-2" />
                <span className="text-gray-400">info@veryfrut.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Horario</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Lunes - Viernes: 8:00 AM - 6:00 PM</li>
              <li>Sábado: 9:00 AM - 5:00 PM</li>
              <li>Domingo: Cerrado</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Veryfrut. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
