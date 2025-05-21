export default function ContactFAQ() {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Preguntas frecuentes</h2>
  
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cuál es el tiempo de entrega?</h3>
            <p className="text-gray-600">
              Nuestro tiempo de entrega estándar es de 24 a 48 horas después de recibir el pedido, dependiendo de la
              ubicación y disponibilidad de productos.
            </p>
          </div>
  
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cómo puedo realizar un pedido?</h3>
            <p className="text-gray-600">
              Puede realizar su pedido a través de nuestra página web, por teléfono o enviándonos un correo electrónico
              con los detalles de su pedido.
            </p>
          </div>
  
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cuál es el pedido mínimo?</h3>
            <p className="text-gray-600">
              Para distribución mayorista, el pedido mínimo es de $200. Para clientes minoristas, no hay un mínimo
              establecido.
            </p>
          </div>
  
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Ofrecen envío gratuito?</h3>
            <p className="text-gray-600">
              Sí, ofrecemos envío gratuito para pedidos superiores a $50 dentro de la ciudad y para pedidos mayoristas
              superiores a $500.
            </p>
          </div>
  
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Todos sus productos son orgánicos?</h3>
            <p className="text-gray-600">
              Sí, todos nuestros productos son 100% orgánicos y cuentan con las certificaciones correspondientes que
              garantizan su calidad.
            </p>
          </div>
  
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cómo puedo verificar el estado de mi pedido?</h3>
            <p className="text-gray-600">
              Puede verificar el estado de su pedido iniciando sesión en su cuenta en nuestra página web o contactándonos
              directamente por teléfono.
            </p>
          </div>
        </div>
      </div>
    )
  }
  