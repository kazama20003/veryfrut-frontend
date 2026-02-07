'use client'

import React from "react"

import Image from 'next/image'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Handle form submission
  }

  return (
    <main id="contact" className="bg-white w-full pt-24">
      {/* Hero Section */}
      <section id="contact-hero" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">Contáctanos</h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Estamos aquí para responder cualquier pregunta que puedas tener sobre nuestros productos orgánicos y servicios de distribución. Contáctanos y te responderemos lo antes posible.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section id="contact-info" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              title: 'Teléfono',
              main: '987 801 148',
              sub: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
              icon: '📞',
            },
            {
              title: 'Correo electrónico',
              main: 'veryfrut.fernanda@gmail.com',
              sub: 'Respuesta en 24 horas',
              icon: '✉️',
            },
            {
              title: 'Ubicación',
              main: 'Arequipa, Perú',
              sub: 'Distribución a nivel nacional',
              icon: '📍',
            },
          ].map((info, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-[24px] p-10 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center">
              <div className="text-5xl mb-4">{info.icon}</div>
              <h3 className="text-2xl font-extrabold mb-2">{info.title}</h3>
              <p className="text-xl font-bold text-black mb-2">{info.main}</p>
              <p className="text-gray-600">{info.sub}</p>
            </div>
          ))}
        </div>

        {/* Image */}
        <div className="relative h-80 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)] mb-20">
          <Image
            src="https://res.cloudinary.com/demzflxgq/image/upload/v1770448781/depositphotos_105798050-stock-photo-friendly-team-harvesting-fresh-vegetables_g0jdyl.jpg"
            alt="Ubicación Veryfrut"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="contact-why" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold tracking-tight mb-6">¿Por qué elegir Veryfrut?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '⚡', title: 'Entregas Puntuales', desc: 'Garantizamos entregas en el tiempo acordado para mantener la frescura de nuestros productos.' },
            { icon: '👥', title: 'Atención Personalizada', desc: 'Cada cliente recibe un servicio adaptado a sus necesidades específicas de negocio.' },
            { icon: '🚚', title: 'Logística Especializada', desc: 'Contamos con vehículos especializados para mantener la cadena de frío y calidad.' },
          ].map((reason, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-[24px] p-8 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center">
              <div className="text-5xl mb-4">{reason.icon}</div>
              <h3 className="text-2xl font-extrabold mb-3">{reason.title}</h3>
              <p className="text-gray-600">{reason.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-extrabold tracking-tight mb-4">Envíanos un mensaje</h2>
            <p className="text-lg text-gray-600">
              Completa el formulario y nos pondremos en contacto contigo para discutir tus necesidades de productos orgánicos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Nombre completo *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Correo electrónico *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime)]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="987 801 148"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime)]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Empresa</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nombre de tu empresa"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Asunto *</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime)]"
                required
              >
                <option value="">¿En qué podemos ayudarte?</option>
                <option value="distribucion">Distribución Mayorista</option>
                <option value="minorista">Distribución Minorista</option>
                <option value="consulta">Consulta General</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Mensaje *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Cuéntanos sobre tus necesidades de productos orgánicos..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime)] resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#ff6b5c] text-black font-bold py-4 rounded-xl hover:scale-105 transition-transform"
            >
              Enviar mensaje
            </button>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="contact-faq" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold tracking-tight mb-6">Preguntas frecuentes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            { q: '¿Cuál es el tiempo de entrega?', a: 'Nuestro tiempo de entrega estándar es de 24 a 48 horas después de recibir el pedido, dependiendo de la ubicación.' },
            { q: '¿Cómo puedo realizar un pedido?', a: 'Puedes contactarnos por teléfono, correo electrónico o a través del formulario de contacto en nuestra web.' },
            { q: '¿Cuál es el pedido mínimo?', a: 'El pedido mínimo varía según el tipo de cliente y productos. Contáctanos para detalles específicos.' },
            { q: '¿Ofrecen envío gratuito?', a: 'Ofrecemos opciones de envío según el volumen del pedido. Consulta nuestras políticas de envío.' },
            { q: '¿Todos sus productos son orgánicos?', a: 'Sí, todos nuestros productos cuentan con certificaciones orgánicas de agricultores especializados.' },
            { q: '¿Atienden a restaurantes y hoteles?', a: 'Sí, contamos con un programa especial para establecimientos comerciales con entregas programadas.' },
          ].map((faq, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-[24px] p-8 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="text-lg font-extrabold mb-3">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-gray-700 mb-6">
            ¿No encontraste la respuesta que buscabas?
          </p>
          <button className="inline-flex items-center gap-3 bg-[#ff6b5c] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform">
            Llamar ahora: 987 801 148
          </button>
        </div>
      </section>
    </main>
  )
}
