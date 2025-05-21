"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { ArrowLeft, Send, Phone, Mail, MessageSquare, Clock } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function SupportPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState("normal")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación básica
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setIsSubmitting(true)

    // Simulación de envío
    setTimeout(() => {
      toast.success("Mensaje enviado correctamente", {
        description: "Nos pondremos en contacto contigo lo antes posible.",
      })
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
      setPriority("normal")
      setIsSubmitting(false)
    }, 1500)
  }

  return (
    <div className="container max-w-6xl py-8 px-4 md:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Soporte Técnico</h1>
            <p className="text-muted-foreground mt-2">
              Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo lo antes posible.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formulario de Contacto</CardTitle>
              <CardDescription>Cuéntanos sobre el problema que estás experimentando</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Tu nombre completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input
                    id="subject"
                    placeholder="Ej: Problema con la carga de imágenes"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    Mensaje <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Describe detalladamente el problema que estás experimentando..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <RadioGroup value={priority} onValueChange={setPriority} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="cursor-pointer">
                        Baja
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="cursor-pointer">
                        Normal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="cursor-pointer">
                        Alta
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensaje
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preguntas Frecuentes</CardTitle>
              <CardDescription>Respuestas a las consultas más comunes</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>¿Cómo puedo actualizar mi producto?</AccordionTrigger>
                  <AccordionContent>
                    Para actualizar un producto, ve a la sección de productos en el dashboard, haz clic en el producto
                    que deseas modificar y utiliza el formulario de edición para realizar los cambios necesarios.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>¿Por qué no puedo subir imágenes?</AccordionTrigger>
                  <AccordionContent>
                    Si tienes problemas para subir imágenes, verifica que el formato sea compatible (JPG, PNG, GIF) y
                    que el tamaño no exceda los 5MB. También asegúrate de tener una conexión estable a internet.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>¿Cómo puedo añadir una nueva categoría?</AccordionTrigger>
                  <AccordionContent>
                    Para añadir una nueva categoría, dirígete a la sección de categorías en el panel de administración y
                    haz clic en Añadir categoría. Completa el formulario con el nombre y descripción de la categoría.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>¿Qué hago si olvidé mi contraseña?</AccordionTrigger>
                  <AccordionContent>
                    Si olvidaste tu contraseña, haz clic en ¿Olvidaste tu contraseña? en la pantalla de inicio de
                    sesión. Recibirás un correo electrónico con instrucciones para restablecerla.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Información de Contacto</CardTitle>
              <CardDescription className="text-green-700">Múltiples formas de comunicarte con nosotros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-start">
                <Phone className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Teléfono</h3>
                  <p className="text-sm mt-1">901 206 784</p>
                  <p className="text-xs text-muted-foreground mt-1">Lunes a Viernes, 9:00 - 18:00</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm flex items-start">
                <Mail className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-sm mt-1">soporte@phoenixsolutionsit.com</p>
                  <p className="text-xs text-muted-foreground mt-1">Respuesta en 24-48 horas</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm flex items-start">
                <MessageSquare className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Chat en vivo</h3>
                  <p className="text-sm mt-1">Disponible en nuestra web</p>
                  <p className="text-xs text-muted-foreground mt-1">Lunes a Viernes, 9:00 - 17:00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horario de Atención</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Lunes - Viernes</span>
                <span>9:00 - 18:00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Sábado</span>
                <span>10:00 - 14:00</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">Domingo</span>
                <span className="text-muted-foreground">Cerrado</span>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center">
                <Clock className="h-5 w-5 mr-2 text-amber-500" />
                <p className="text-sm text-muted-foreground">
                  Tiempo de respuesta promedio: 2-4 horas en horario laboral
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Proceso de Soporte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Envía tu consulta</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completa el formulario con todos los detalles del problema
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Recibe confirmación</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Te enviaremos un email confirmando la recepción
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Análisis del problema</h3>
                    <p className="text-sm text-muted-foreground mt-1">Nuestro equipo técnico analizará tu caso</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium">Resolución</h3>
                    <p className="text-sm text-muted-foreground mt-1">Te contactaremos con la solución a tu problema</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
