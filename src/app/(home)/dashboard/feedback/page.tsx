"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Send, Star, Facebook, Instagram, Globe, Phone, MessageSquare } from "lucide-react"

export default function FeedbackPage() {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Por favor, selecciona una calificación")
      return
    }

    if (!comment.trim()) {
      toast.error("Por favor, escribe un comentario")
      return
    }

    setIsSubmitting(true)

    // Simulación de envío
    setTimeout(() => {
      toast.success("¡Gracias por tu feedback!", {
        description: "Tu opinión es muy importante para nosotros.",
      })
      setRating(0)
      setComment("")
      setName("")
      setEmail("")
      setIsSubmitting(false)
    }, 1500)
  }

  return (
    <div className="container max-w-5xl py-8 px-4 md:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Feedback y Recomendaciones</h1>

          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback">Enviar Feedback</TabsTrigger>
              <TabsTrigger value="developer">Desarrollador</TabsTrigger>
            </TabsList>

            <TabsContent value="feedback" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tu opinión es importante</CardTitle>
                  <CardDescription>
                    Ayúdanos a mejorar compartiendo tu experiencia con nuestra aplicación.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rating" className="block mb-2">
                          Calificación
                        </Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="focus:outline-none"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  star <= (hoveredRating || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                } transition-colors`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">
                            {rating > 0 ? `${rating} de 5 estrellas` : "Sin calificar"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="comment" className="block mb-2">
                          Comentarios
                        </Label>
                        <Textarea
                          id="comment"
                          placeholder="Comparte tu experiencia con nuestra aplicación..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="block mb-2">
                            Nombre
                          </Label>
                          <Input
                            id="name"
                            placeholder="Tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="block mb-2">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Feedback
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="developer" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Desarrollado por Phoenix Solutions IT</CardTitle>
                  <CardDescription>Soluciones tecnológicas innovadoras para tu negocio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4">
                      <span className="text-white text-4xl font-bold">PS</span>
                    </div>
                    <h3 className="text-xl font-semibold">Phoenix Solutions IT</h3>
                    <p className="text-muted-foreground mt-1">Transformando ideas en soluciones digitales</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <a
                      href="https://www.phoenixsolutionsit.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Globe className="h-5 w-5 mr-3 text-green-600" />
                      <div>
                        <p className="font-medium">Sitio Web</p>
                        <p className="text-sm text-muted-foreground">phoenixsolutionsit.com</p>
                      </div>
                    </a>

                    <a
                      href="https://www.instagram.com/phoenix_solutions_it"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Instagram className="h-5 w-5 mr-3 text-pink-600" />
                      <div>
                        <p className="font-medium">Instagram</p>
                        <p className="text-sm text-muted-foreground">@phoenix_solutions_it</p>
                      </div>
                    </a>

                    <a
                      href="https://www.tiktok.com/@phoenix_it_solutions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3 text-black" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                      <div>
                        <p className="font-medium">TikTok</p>
                        <p className="text-sm text-muted-foreground">@phoenix_it_solutions</p>
                      </div>
                    </a>

                    <a
                      href="https://www.facebook.com/profile.php?id=61568108366850"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Facebook className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">Facebook</p>
                        <p className="text-sm text-muted-foreground">Phoenix Solutions I.T</p>
                      </div>
                    </a>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Contacto directo:</h4>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-green-600" />
                      <p>901 206 784</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-6">
                  <p className="text-sm text-center text-muted-foreground">
                    © {new Date().getFullYear()} Phoenix Solutions IT. Todos los derechos reservados.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-1">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">¿Por qué elegirnos?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-green-700 mb-2">Soluciones a medida</h3>
                <p className="text-sm">
                  Desarrollamos aplicaciones personalizadas que se adaptan perfectamente a las necesidades de tu
                  negocio.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-green-700 mb-2">Tecnología de vanguardia</h3>
                <p className="text-sm">
                  Utilizamos las últimas tecnologías para garantizar que tu aplicación sea rápida, segura y escalable.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-green-700 mb-2">Soporte continuo</h3>
                <p className="text-sm">
                  Ofrecemos soporte técnico y mantenimiento para asegurar que tu aplicación funcione sin problemas.
                </p>
              </div>

              <div className="mt-6">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/support">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contactar soporte
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
