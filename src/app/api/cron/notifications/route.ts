import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Este endpoint es llamado por Vercel Cron cada hora
// Configurado en vercel.json

export async function GET(request: Request) {
  // Verificar que la llamada viene de Vercel Cron
  const authHeader = request.headers.get('authorization')

  // En producción, verificar el CRON_SECRET
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Usar service role para ejecutar las funciones
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Ejecutar la función de recordatorios
    const { data, error } = await supabase.rpc('run_notification_reminders')

    if (error) {
      console.error('Error running notification reminders:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const result = data?.[0] || {
      budget_missing_count: 0,
      stalled_orders_count: 0,
      pending_payments_count: 0
    }

    console.log('Notification reminders executed:', result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        budgetMissing: result.budget_missing_count,
        stalledOrders: result.stalled_orders_count,
        pendingPayments: result.pending_payments_count
      }
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// También permitir POST para pruebas manuales
export async function POST(request: Request) {
  return GET(request)
}
