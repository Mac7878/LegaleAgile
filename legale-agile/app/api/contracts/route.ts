import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/contracts - Get all generated contracts
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('generated_contracts')
      .select('*')
      .order('generated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create new generated contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.project_id || !body.role || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('generated_contracts')
      .insert([
        {
          project_id: body.project_id,
          project_name: body.project_name,
          role: body.role,
          role_name: body.role_name,
          content: body.content,
          answers: body.answers,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}
