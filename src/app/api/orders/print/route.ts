import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import type { Browser } from "puppeteer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface PrintOrderItem {
  productName: string
  quantity: number
  unitName: string
}

interface PrintOrderPayload {
  areaName: string
  observation?: string
  items: PrintOrderItem[]
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatQuantity(quantity: number): string {
  if (quantity % 1 === 0) return quantity.toFixed(0)
  return Number.parseFloat(quantity.toFixed(3)).toString().replace(".", ",")
}

export async function POST(request: NextRequest) {
  let browser: Browser | null = null

  try {
    const body = (await request.json()) as PrintOrderPayload
    const areaName = body?.areaName?.trim()
    const observation = (body?.observation || "").trim()
    const items = Array.isArray(body?.items) ? body.items : []

    if (!areaName || items.length === 0) {
      return NextResponse.json({ message: "Invalid print payload" }, { status: 400 })
    }

    const rows = items
      .map((item) => {
        return `
          <tr>
            <td>${escapeHtml(item.productName)}</td>
            <td class="center">${escapeHtml(formatQuantity(Number(item.quantity) || 0))}</td>
            <td>${escapeHtml(item.unitName)}</td>
          </tr>
        `
      })
      .join("")

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Pedido</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #1f2937;
              font-size: 12px;
              line-height: 1.4;
            }
            .page {
              padding: 20px;
            }
            .header {
              margin-bottom: 14px;
            }
            .title {
              margin: 0 0 8px 0;
              font-size: 20px;
              font-weight: 700;
            }
            .meta {
              margin: 0;
              color: #4b5563;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            thead {
              display: table-header-group;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              vertical-align: top;
              word-break: break-word;
            }
            th {
              background: #f3f4f6;
              font-weight: 700;
            }
            .center {
              text-align: center;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .notes {
              margin-top: 14px;
              padding: 10px;
              border: 1px solid #e5e7eb;
              background: #f9fafb;
              border-radius: 4px;
            }
            @page {
              size: A4;
              margin: 12mm;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1 class="title">Pedido de Carrito</h1>
              <p class="meta"><strong>Area:</strong> ${escapeHtml(areaName)}</p>
              <p class="meta"><strong>Fecha:</strong> ${new Date().toLocaleString("es-PE")}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 58%;">Producto</th>
                  <th style="width: 18%;">Cantidad</th>
                  <th style="width: 24%;">Unidad de medida</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            ${
              observation
                ? `<div class="notes"><strong>Observaciones:</strong> ${escapeHtml(observation)}</div>`
                : ""
            }
          </div>
        </body>
      </html>
    `

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    })

    const pdfArrayBuffer = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer
    const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" })

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="pedido-carrito.pdf"',
      },
    })
  } catch (error) {
    console.error("[print-order] Error generating pdf:", error)
    return NextResponse.json({ message: "Error generating print document" }, { status: 500 })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
