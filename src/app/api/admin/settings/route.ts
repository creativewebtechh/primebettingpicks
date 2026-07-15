import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { logger } from '@/lib/logger'

const SETTINGS_FILE = join(process.cwd(), 'data', 'settings.json')

export const dynamic = 'force-dynamic'

const DEFAULT_SETTINGS = {
  siteName: 'PrimeBettingPicks',
  siteDescription: 'Expert football predictions and betting tips',
  contactEmail: 'contact@primebettingpicks.com',
  contactPhone: '',
  maintenanceMode: false,
  primaryColor: '#10B981',
  logo: '/logo.svg',
  favicon: '/favicon.ico',
  facebook: '',
  twitter: '',
  instagram: '',
  youtube: '',
  telegram: '',
}

export async function GET() {
  try {
    await requireAdmin()
    try {
      const data = await readFile(SETTINGS_FILE, 'utf-8')
      return NextResponse.json(JSON.parse(data))
    } catch {
      return NextResponse.json(DEFAULT_SETTINGS)
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin settings GET error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin()
    const data = await request.json()

    await mkdir(join(process.cwd(), 'data'), { recursive: true })
    await writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2))

    logger.info('Admin updated site settings')
    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin settings PUT error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
