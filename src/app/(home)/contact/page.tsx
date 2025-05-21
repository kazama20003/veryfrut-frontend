import { Suspense } from "react"
import dynamic from "next/dynamic"
import LoadingSpinner from "@/components/global/LoadingSpinner"
import Footer from "@/components/home/footer/footer"
import Header from "@/components/home/header/header"

// Importar el componente de contacto con lazy loading
const ContactForm = dynamic(() => import("@/components/contact/contact-form"), {
  loading: () => <LoadingSpinner />,
  ssr: true,
})

const ContactInfo = dynamic(() => import("@/components/contact/contact-info"), {
  loading: () => <LoadingSpinner />,
  ssr: true,
})

const ContactFAQ = dynamic(() => import("@/components/contact/contact-faq"), {
  loading: () => <LoadingSpinner />,
  ssr: true,
})

export default function ContactPage() {
  return (
    <>
    <Header></Header>
    <div className="bg-gray-50 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Contacto</h1>
          <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Estamos aquí para responder cualquier pregunta que puedas tener sobre nuestros productos y servicios.
            Contáctanos y te responderemos lo antes posible.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <ContactInfo />
        </Suspense>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Suspense fallback={<LoadingSpinner />}>
            <ContactForm />
          </Suspense>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-[300px] bg-gray-200">
              {/* Aquí iría un mapa real, por ahora usamos un placeholder */}
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600 mx-auto mb-2"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <p className="text-gray-600">Mapa de ubicación</p>
                </div>
              </div>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
              <ContactInfo showDetailed={true} />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <ContactFAQ />
        </Suspense>
      </div>
    </div>
    <Footer></Footer>
    </>
  )
}
