import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export default function ContactInfo({ showDetailed = false }) {
  if (showDetailed) {
    return (
      <div className="p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Información de contacto</h3>

        <div className="space-y-4">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-green-600 mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800">Dirección</h4>
              <p className="text-gray-600">Calle Principal 123, Ciudad, País</p>
            </div>
          </div>

          <div className="flex items-start">
            <Phone className="h-5 w-5 text-green-600 mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800">Teléfono</h4>
              <p className="text-gray-600">+1 234 567 890</p>
            </div>
          </div>

          <div className="flex items-start">
            <Mail className="h-5 w-5 text-green-600 mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800">Email</h4>
              <p className="text-gray-600">info@veryfrut.com</p>
            </div>
          </div>

          <div className="flex items-start">
            <Clock className="h-5 w-5 text-green-600 mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800">Horario</h4>
              <p className="text-gray-600">Lun - Vie: 8:00 AM - 6:00 PM</p>
              <p className="text-gray-600">Sáb: 9:00 AM - 5:00 PM</p>
              <p className="text-gray-600">Dom: Cerrado</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Síguenos</h4>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-600 hover:text-green-600 transition-colors duration-200">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-600 hover:text-green-600 transition-colors duration-200">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-600 hover:text-green-600 transition-colors duration-200">
              <Instagram className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-600 hover:text-green-600 transition-colors duration-200">
              <Linkedin className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 mb-16">
      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Phone className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Llámanos</h3>
        <p className="text-gray-600 mb-4">Estamos disponibles de lunes a viernes de 8:00 AM a 6:00 PM</p>
        <a href="tel:0123456789" className="text-green-600 font-medium hover:underline">
          0123456789
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Escríbenos</h3>
        <p className="text-gray-600 mb-4">Envíanos un correo electrónico y te responderemos lo antes posible</p>
        <a href="mailto:info@veryfrut.com" className="text-green-600 font-medium hover:underline">
          info@veryfrut.com
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Visítanos</h3>
        <p className="text-gray-600 mb-4">Ven a nuestras instalaciones y conoce nuestros productos</p>
        <address className="text-green-600 font-medium not-italic">Calle Principal 123, Ciudad, País</address>
      </div>
    </div>
  )
}
