import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOrderPDFTemplate } from '@/lib/pdf/order-pdf-template';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import type { OrderWithRelations, WorkshopConfig } from '@/types/database';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// URL del binario de Chromium para serverless (versión 131)
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  let browser = null;

  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener ID de la orden desde los params
    const { id: orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID de orden requerido' },
        { status: 400 }
      );
    }

    // Obtener orden con todas sus relaciones
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        owner:owners!owner_id(*),
        vehicle:vehicles!vehicle_id(*),
        technician:profiles!technician_id(*),
        budget_lines(*),
        payments(*)
      `)
      .eq('id', orderId)
      .single<OrderWithRelations>();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Obtener configuración del taller
    const { data: workshop, error: workshopError } = await supabase
      .from('workshop_config')
      .select('*')
      .single<WorkshopConfig>();

    if (workshopError || !workshop) {
      return NextResponse.json(
        { error: 'Configuración del taller no encontrada' },
        { status: 500 }
      );
    }

    // Generar HTML del PDF
    const html = generateOrderPDFTemplate({
      order,
      workshop,
    });

    // Obtener el path del ejecutable de Chromium
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);

    // Inicializar Puppeteer con Chromium para serverless
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Configurar el contenido HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    // Cerrar el navegador
    await browser.close();
    browser = null;

    // Crear nombre de archivo
    const filename = `orden-${order.folio || orderId}.pdf`;

    // Retornar PDF como descarga
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Asegurar que el navegador se cierre en caso de error
    if (browser) {
      await browser.close().catch(() => {
        // Ignorar errores al cerrar
      });
    }

    console.error('Error al generar PDF:', error);

    return NextResponse.json(
      {
        error: 'Error al generar el PDF',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
