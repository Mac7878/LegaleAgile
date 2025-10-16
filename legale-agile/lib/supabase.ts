import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export type Project = {
  id: string
  name: string
  description: string
  contracts: {
    A: ContractConfig
    B: ContractConfig
  }
  created_at: string
}

export type ContractConfig = {
  name: string
  description: string
  template: string
  placeholders: string[]
  questions: Record<string, Question>
  clauses: Clause[]
}

export type Question = {
  question: string
  type: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'radio'
  required: boolean
  options?: string[]
}

export type Clause = {
  id: number
  title: string
  content: string
  insertAfterArticle: number  // Numero articolo dopo cui inserire (0 = inizio)
  question: {
    text: string
    type: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'radio'
    options: string[]
    required: boolean
  }
  condition: {
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains'
    value: string
  }
}

export type GeneratedContract = {
  id: string
  project_id: string
  project_name: string
  role: 'A' | 'B'
  role_name: string
  content: string
  answers: Record<string, string>
  generated_at: string
}
