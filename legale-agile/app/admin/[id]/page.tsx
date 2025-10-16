'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Save, Home, ChevronRight, ChevronLeft, FileText, Settings, Plus, Trash2, Zap } from 'lucide-react'
import { Project, ContractConfig, Clause } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === 'new'
  
  const [loading, setLoading] = useState(!isNew)
  const [adminStep, setAdminStep] = useState(0) // 0: setup, 1: template, 2: domande, 3: clausole
  const [editingContract, setEditingContract] = useState<'both' | 'A' | 'B'>('both')
  
  const [project, setProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    contracts: {
      A: {
        name: 'Parte A',
        description: 'Es: Fornitore, Venditore, Locatore',
        template: '',
        placeholders: [],
        questions: {},
        clauses: []
      },
      B: {
        name: 'Parte B',
        description: 'Es: Cliente, Acquirente, Locatario',
        template: '',
        placeholders: [],
        questions: {},
        clauses: []
      }
    }
  })

  useEffect(() => {
    if (!isNew) {
      loadProject()
    }
  }, [params.id])

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      const data = await res.json()
      
      // Fix: Ensure all clauses have insertAfterArticle field
      if (data.contracts) {
        ['A', 'B'].forEach(type => {
          if (data.contracts[type].clauses) {
            data.contracts[type].clauses = data.contracts[type].clauses.map((clause: any) => ({
              ...clause,
              insertAfterArticle: clause.insertAfterArticle ?? 0 // Default to 0 if missing
            }))
          }
        })
      }
      
      setProject(data)
      setAdminStep(1)
    } catch (error) {
      console.error('Error loading project:', error)
      alert('Errore nel caricamento del progetto')
    } finally {
      setLoading(false)
    }
  }

  const extractPlaceholders = (text: string) => {
    const regex = /\{\{([^}]+)\}\}/g
    const found: string[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      if (!found.includes(match[1].trim())) {
        found.push(match[1].trim())
      }
    }
    return found
  }

  const generateAutoQuestion = (placeholder: string) => {
    const cleaned = placeholder.replace(/_/g, ' ').toLowerCase()
    if (cleaned.includes('nome')) return `Qual è ${cleaned}?`
    if (cleaned.includes('data')) return `Inserisci ${cleaned}`
    if (cleaned.includes('importo') || cleaned.includes('prezzo') || cleaned.includes('costo')) return `Qual è ${cleaned}?`
    if (cleaned.includes('indirizzo')) return `Qual è ${cleaned}?`
    if (cleaned.includes('email')) return `Inserisci ${cleaned}`
    if (cleaned.includes('telefono') || cleaned.includes('cellulare')) return `Inserisci ${cleaned}`
    if (cleaned.includes('p.iva') || cleaned.includes('partita iva')) return `Qual è la partita IVA?`
    if (cleaned.includes('codice fiscale') || cleaned.includes('cf')) return `Qual è il codice fiscale?`
    return `Inserisci ${cleaned}`
  }

  const determineInputType = (placeholder: string) => {
    const lower = placeholder.toLowerCase()
    if (lower.includes('data') || lower.includes('date')) return 'date'
    if (lower.includes('importo') || lower.includes('prezzo') || lower.includes('costo') || lower.includes('numero') || lower.includes('quantità')) return 'number'
    if (lower.includes('descrizione') || lower.includes('note') || lower.includes('dettagli')) return 'textarea'
    if (lower.includes('email')) return 'email'
    return 'text'
  }

  const handleTemplateChange = (contractType: 'A' | 'B', text: string) => {
    const foundPlaceholders = extractPlaceholders(text)
    const contract = project.contracts![contractType]
    
    const newQuestions = { ...contract.questions }
    foundPlaceholders.forEach(ph => {
      if (!newQuestions[ph]) {
        newQuestions[ph] = {
          question: generateAutoQuestion(ph),
          type: determineInputType(ph) as any,
          required: true,
          options: []
        }
      }
    })
    
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          template: text,
          placeholders: foundPlaceholders,
          questions: newQuestions
        }
      }
    })
  }

  const autoGenerateAllQuestions = (contractType: 'A' | 'B') => {
    const contract = project.contracts![contractType]
    const newQuestions: any = {}
    
    contract.placeholders.forEach(ph => {
      newQuestions[ph] = {
        question: generateAutoQuestion(ph),
        type: determineInputType(ph),
        required: true,
        options: []
      }
    })
    
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          questions: newQuestions
        }
      }
    })
  }

  const updateContractInfo = (contractType: 'A' | 'B', field: string, value: string) => {
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...project.contracts![contractType],
          [field]: value
        }
      }
    })
  }

  const updateQuestion = (contractType: 'A' | 'B', placeholder: string, field: string, value: any) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          questions: {
            ...contract.questions,
            [placeholder]: {
              ...contract.questions[placeholder],
              [field]: value
            }
          }
        }
      }
    })
  }

  const addOption = (contractType: 'A' | 'B', placeholder: string) => {
    const current = project.contracts![contractType].questions[placeholder].options || []
    updateQuestion(contractType, placeholder, 'options', [...current, ''])
  }

  const removeOption = (contractType: 'A' | 'B', placeholder: string, index: number) => {
    const current = [...project.contracts![contractType].questions[placeholder].options]
    current.splice(index, 1)
    updateQuestion(contractType, placeholder, 'options', current)
  }

  const updateOption = (contractType: 'A' | 'B', placeholder: string, index: number, value: string) => {
    const current = [...project.contracts![contractType].questions[placeholder].options]
    current[index] = value
    updateQuestion(contractType, placeholder, 'options', current)
  }

  // Parse articles from template - IMPROVED VERSION
  const getArticlesFromTemplate = (contractType: 'A' | 'B'): number[] => {
    const template = project.contracts![contractType].template
    
    if (!template || template.trim() === '') {
      console.log(`⚠️ Template vuoto per contratto ${contractType}`)
      return []
    }
    
    // Regex migliorato per catturare più formati
    const articleRegex = /(?:Art\.?|Articolo|ART\.?|art\.?)\s*(\d+)/gi
    const numbers: number[] = []
    let match
    
    while ((match = articleRegex.exec(template)) !== null) {
      const num = parseInt(match[1])
      if (!numbers.includes(num) && num > 0) {
        numbers.push(num)
      }
    }
    
    const sorted = numbers.sort((a, b) => a - b)
    console.log(`📋 Articoli trovati in contratto ${contractType}:`, sorted)
    
    return sorted
  }

  // CLAUSOLE
  const addClause = (contractType: 'A' | 'B') => {
    const contract = project.contracts![contractType]
    const newClause: Clause = {
      id: Date.now(),
      title: '',
      content: '',
      insertAfterArticle: 0, // Default: inserisci all'inizio
      question: {
        text: '',
        type: 'radio',
        options: ['Sì', 'No'],
        required: true
      },
      condition: {
        operator: '=',
        value: 'Sì'
      }
    }
    
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: [...contract.clauses, newClause]
        }
      }
    })
  }

  const removeClause = (contractType: 'A' | 'B', id: number) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: contract.clauses.filter(c => c.id !== id)
        }
      }
    })
  }

  const updateClause = (contractType: 'A' | 'B', id: number, field: string, value: any) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: contract.clauses.map(c => 
            c.id === id ? { ...c, [field]: value } : c
          )
        }
      }
    })
  }

  const updateClauseCondition = (contractType: 'A' | 'B', id: number, field: string, value: string) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: contract.clauses.map(c => 
            c.id === id ? { 
              ...c, 
              condition: { ...c.condition, [field]: value }
            } : c
          )
        }
      }
    })
  }

  const updateClauseQuestion = (contractType: 'A' | 'B', id: number, field: string, value: any) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: contract.clauses.map(c => 
            c.id === id ? { 
              ...c, 
              question: { ...c.question, [field]: value }
            } : c
          )
        }
      }
    })
  }

  const addClauseQuestionOption = (contractType: 'A' | 'B', id: number) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: contract.clauses.map(c => {
            if (c.id === id) {
              const currentOptions = c.question.options || []
              return {
                ...c,
                question: { ...c.question, options: [...currentOptions, ''] }
              }
            }
            return c
          })
        }
      }
    })
  }

  const removeClauseQuestionOption = (contractType: 'A' | 'B', id: number, optionIndex: number) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: contract.clauses.map(c => {
            if (c.id === id) {
              const currentOptions = [...c.question.options]
              currentOptions.splice(optionIndex, 1)
              return {
                ...c,
                question: { ...c.question, options: currentOptions }
              }
            }
            return c
          })
        }
      }
    })
  }

  const updateClauseQuestionOption = (contractType: 'A' | 'B', id: number, optionIndex: number, value: string) => {
    const contract = project.contracts![contractType]
    setProject({
      ...project,
      contracts: {
        ...project.contracts!,
        [contractType]: {
          ...contract,
          clauses: contract.clauses.map(c => {
            if (c.id === id) {
              const currentOptions = [...c.question.options]
              currentOptions[optionIndex] = value
              return {
                ...c,
                question: { ...c.question, options: currentOptions }
              }
            }
            return c
          })
        }
      }
    })
  }

  const saveProject = async () => {
    if (!project.name?.trim()) {
      alert('Inserisci un nome per il progetto!')
      return
    }

    try {
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/projects' : `/api/projects/${params.id}`
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })

      if (!res.ok) throw new Error('Save failed')

      alert('Progetto salvato con successo!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Errore nel salvataggio del progetto')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Configurazione Progetto</h1>
              <p className="text-gray-600">{project.name || 'Nuovo Progetto'}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={saveProject}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>Salva Progetto</span>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Step 0: Setup Progetto */}
        {adminStep === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Setup Progetto Contratto</h2>
            
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Progetto *</label>
                <input
                  type="text"
                  value={project.name || ''}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  placeholder="Es: Contratto di Locazione Immobiliare"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione Progetto</label>
                <textarea
                  value={project.description || ''}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  placeholder="Breve descrizione del tipo di contratto..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-bold text-gray-800 mb-3">Contratto Parte A</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Parte A</label>
                      <input
                        type="text"
                        value={project.contracts!.A.name}
                        onChange={(e) => updateContractInfo('A', 'name', e.target.value)}
                        placeholder="Es: Locatore"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                      <input
                        type="text"
                        value={project.contracts!.A.description}
                        onChange={(e) => updateContractInfo('A', 'description', e.target.value)}
                        placeholder="Es: Proprietario"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <h3 className="font-bold text-gray-800 mb-3">Contratto Parte B</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Parte B</label>
                      <input
                        type="text"
                        value={project.contracts!.B.name}
                        onChange={(e) => updateContractInfo('B', 'name', e.target.value)}
                        placeholder="Es: Locatario"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                      <input
                        type="text"
                        value={project.contracts!.B.description}
                        onChange={(e) => updateContractInfo('B', 'description', e.target.value)}
                        placeholder="Es: Inquilino"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setAdminStep(1)}
                  disabled={!project.name?.trim()}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <span>Avanti: Configura Template</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Steps 1-3 con visualizzazione side-by-side */}
        {adminStep >= 1 && (
          <>
            {/* Progress */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                {[
                  { num: 1, title: 'Template', icon: FileText },
                  { num: 2, title: 'Domande', icon: Settings },
                  { num: 3, title: 'Clausole', icon: Plus }
                ].map((step, idx) => (
                  <div key={step.num} className="flex items-center">
                    <button
                      onClick={() => setAdminStep(step.num)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        adminStep === step.num 
                          ? 'bg-blue-600 text-white shadow-lg scale-105' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <step.icon className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Step {step.num}</div>
                        <div className="text-sm">{step.title}</div>
                      </div>
                    </button>
                    {idx < 2 && <ChevronRight className="w-6 h-6 text-gray-400 mx-2" />}
                  </div>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setEditingContract('A')}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    editingContract === 'A' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Solo {project.contracts!.A.name}
                </button>
                <button
                  onClick={() => setEditingContract('both')}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    editingContract === 'both' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Entrambi
                </button>
                <button
                  onClick={() => setEditingContract('B')}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    editingContract === 'B' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Solo {project.contracts!.B.name}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className={`grid ${editingContract === 'both' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
              {/* Parte A */}
              {(editingContract === 'both' || editingContract === 'A') && (
                <ContractEditor 
                  contract={project.contracts!.A}
                  contractType="A"
                  step={adminStep}
                  colorClass="blue"
                  availableArticles={getArticlesFromTemplate('A')}
                  onTemplateChange={handleTemplateChange}
                  onAutoGenerateQuestions={autoGenerateAllQuestions}
                  onUpdateQuestion={updateQuestion}
                  onAddOption={addOption}
                  onRemoveOption={removeOption}
                  onUpdateOption={updateOption}
                  onAddClause={addClause}
                  onRemoveClause={removeClause}
                  onUpdateClause={updateClause}
                  onUpdateClauseCondition={updateClauseCondition}
                  onUpdateClauseQuestion={updateClauseQuestion}
                  onAddClauseQuestionOption={addClauseQuestionOption}
                  onRemoveClauseQuestionOption={removeClauseQuestionOption}
                  onUpdateClauseQuestionOption={updateClauseQuestionOption}
                />
              )}

              {/* Parte B */}
              {(editingContract === 'both' || editingContract === 'B') && (
                <ContractEditor 
                  contract={project.contracts!.B}
                  contractType="B"
                  step={adminStep}
                  colorClass="purple"
                  availableArticles={getArticlesFromTemplate('B')}
                  onTemplateChange={handleTemplateChange}
                  onAutoGenerateQuestions={autoGenerateAllQuestions}
                  onUpdateQuestion={updateQuestion}
                  onAddOption={addOption}
                  onRemoveOption={removeOption}
                  onUpdateOption={updateOption}
                  onAddClause={addClause}
                  onRemoveClause={removeClause}
                  onUpdateClause={updateClause}
                  onUpdateClauseCondition={updateClauseCondition}
                  onUpdateClauseQuestion={updateClauseQuestion}
                  onAddClauseQuestionOption={addClauseQuestionOption}
                  onRemoveClauseQuestionOption={removeClauseQuestionOption}
                  onUpdateClauseQuestionOption={updateClauseQuestionOption}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <div className="flex justify-between">
                <button
                  onClick={() => setAdminStep(Math.max(0, adminStep - 1))}
                  className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Indietro</span>
                </button>
                {adminStep < 3 ? (
                  <button
                    onClick={() => setAdminStep(adminStep + 1)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Avanti</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={saveProject}
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Salva Progetto</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Component per editor contratto
interface ContractEditorProps {
  contract: ContractConfig
  contractType: 'A' | 'B'
  step: number
  colorClass: 'blue' | 'purple'
  availableArticles: number[]  // 🆕 Lista articoli disponibili dal template
  onTemplateChange: (type: 'A' | 'B', text: string) => void
  onAutoGenerateQuestions: (type: 'A' | 'B') => void
  onUpdateQuestion: (type: 'A' | 'B', placeholder: string, field: string, value: any) => void
  onAddOption: (type: 'A' | 'B', placeholder: string) => void
  onRemoveOption: (type: 'A' | 'B', placeholder: string, index: number) => void
  onUpdateOption: (type: 'A' | 'B', placeholder: string, index: number, value: string) => void
  onAddClause: (type: 'A' | 'B') => void
  onRemoveClause: (type: 'A' | 'B', id: number) => void
  onUpdateClause: (type: 'A' | 'B', id: number, field: string, value: any) => void
  onUpdateClauseCondition: (type: 'A' | 'B', id: number, field: string, value: string) => void
  onUpdateClauseQuestion: (type: 'A' | 'B', id: number, field: string, value: any) => void
  onAddClauseQuestionOption: (type: 'A' | 'B', id: number) => void
  onRemoveClauseQuestionOption: (type: 'A' | 'B', id: number, optionIndex: number) => void
  onUpdateClauseQuestionOption: (type: 'A' | 'B', id: number, optionIndex: number, value: string) => void
}

function ContractEditor({
  contract,
  contractType,
  step,
  colorClass,
  availableArticles,  // 🆕
  onTemplateChange,
  onAutoGenerateQuestions,
  onUpdateQuestion,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onAddClause,
  onRemoveClause,
  onUpdateClause,
  onUpdateClauseCondition,
  onUpdateClauseQuestion,
  onAddClauseQuestionOption,
  onRemoveClauseQuestionOption,
  onUpdateClauseQuestionOption
}: ContractEditorProps) {
  const colors = {
    blue: { 
      bg: 'bg-blue-50', 
      border: 'border-blue-200', 
      text: 'text-blue-800', 
      badge: 'bg-blue-100', 
      button: 'bg-blue-600 hover:bg-blue-700' 
    },
    purple: { 
      bg: 'bg-purple-50', 
      border: 'border-purple-200', 
      text: 'text-purple-800', 
      badge: 'bg-purple-100', 
      button: 'bg-purple-600 hover:bg-purple-700' 
    }
  }
  const c = colors[colorClass]

  // Step 1: Template
  if (step === 1) {
    return (
      <div className={`${c.bg} border-2 ${c.border} rounded-lg p-6`}>
        <h3 className={`text-xl font-bold ${c.text} mb-4`}>{contract.name}</h3>
        <textarea
          value={contract.template}
          onChange={(e) => onTemplateChange(contractType, e.target.value)}
          placeholder={`Template contratto ${contract.name}...\n\nUsa {{placeholder}} per campi variabili`}
          className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm"
        />
        {contract.placeholders.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Placeholder: {contract.placeholders.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {contract.placeholders.map((ph, i) => (
                <span key={i} className={`${c.badge} ${c.text} px-2 py-1 rounded text-xs font-mono`}>
                  {ph}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 2: Domande
  if (step === 2) {
    return (
      <div className={`${c.bg} border-2 ${c.border} rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${c.text}`}>{contract.name}</h3>
          <button
            onClick={() => onAutoGenerateQuestions(contractType)}
            className={`flex items-center space-x-2 ${c.button} text-white px-3 py-2 rounded-lg transition-colors text-sm`}
          >
            <Zap className="w-4 h-4" />
            <span>Auto-genera</span>
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {contract.placeholders.map((ph, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className={`${c.badge} ${c.text} px-2 py-1 rounded text-xs font-mono inline-block mb-2`}>
                {ph}
              </div>
              <input
                type="text"
                value={contract.questions[ph]?.question || ''}
                onChange={(e) => onUpdateQuestion(contractType, ph, 'question', e.target.value)}
                placeholder="Domanda..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={contract.questions[ph]?.type || 'text'}
                  onChange={(e) => onUpdateQuestion(contractType, ph, 'type', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="text">Testo</option>
                  <option value="email">Email</option>
                  <option value="number">Numero</option>
                  <option value="date">Data</option>
                  <option value="textarea">Area testo</option>
                  <option value="select">Select</option>
                  <option value="radio">Radio</option>
                </select>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={contract.questions[ph]?.required || false}
                    onChange={(e) => onUpdateQuestion(contractType, ph, 'required', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Obbligatorio</span>
                </label>
              </div>
              {(contract.questions[ph]?.type === 'select' || contract.questions[ph]?.type === 'radio') && (
                <div className="mt-2 space-y-1">
                  {(contract.questions[ph]?.options || []).map((opt, i) => (
                    <div key={i} className="flex space-x-1">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => onUpdateOption(contractType, ph, i, e.target.value)}
                        className="flex-1 p-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => onRemoveOption(contractType, ph, i)}
                        className="p-1 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => onAddOption(contractType, ph)}
                    className={`text-sm ${c.text}`}
                  >
                    + Opzione
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Step 3: Clausole
  if (step === 3) {
    return (
      <div className={`${c.bg} border-2 ${c.border} rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${c.text}`}>{contract.name}</h3>
          <button
            onClick={() => onAddClause(contractType)}
            className={`flex items-center space-x-2 ${c.button} text-white px-3 py-2 rounded-lg transition-colors text-sm`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Clausola</span>
          </button>
        </div>
        
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-semibold text-blue-800 mb-1">💡 Come funziona:</p>
          <p className="text-blue-700">
            Ogni clausola ha una <strong>domanda dedicata</strong>. L'utente risponde e la clausola 
            appare solo se la condizione è soddisfatta.
          </p>
        </div>

        <div className="space-y-6 max-h-[600px] overflow-y-auto">
          {contract.clauses.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nessuna clausola condizionale</p>
              <p className="text-xs mt-1">Le clausole hanno domande dedicate separate dal template</p>
            </div>
          ) : (
            contract.clauses.map((clause, idx) => (
              <div key={clause.id} className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-gray-700">Clausola Condizionale</span>
                  </div>
                  <button
                    onClick={() => onRemoveClause(contractType, clause.id)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Titolo e contenuto clausola */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                      📄 Contenuto Clausola
                    </label>
                    <input
                      type="text"
                      value={clause.title}
                      onChange={(e) => onUpdateClause(contractType, clause.id, 'title', e.target.value)}
                      placeholder="Es: CLAUSOLA DI GARANZIA ESTESA"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm font-semibold mb-2"
                    />
                    <textarea
                      value={clause.content}
                      onChange={(e) => onUpdateClause(contractType, clause.id, 'content', e.target.value)}
                      placeholder="Il testo completo della clausola che verrà aggiunta al contratto..."
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                    />
                  </div>

                  {/* 🆕 POSIZIONAMENTO ARTICOLO */}
                  <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                    <label className="block text-xs font-semibold text-amber-800 mb-3 uppercase flex items-center gap-2">
                      📍 Posizionamento nel Contratto
                    </label>
                    
                    {availableArticles.length === 0 ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-red-800 font-semibold mb-1">⚠️ Nessun articolo trovato nel template</p>
                        <p className="text-xs text-red-600">
                          Assicurati che il template contenga articoli nel formato:<br/>
                          <code className="bg-red-100 px-1 rounded">Art. 1 - TITOLO</code>
                        </p>
                      </div>
                    ) : null}
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Inserisci questa clausola dopo:
                      </label>
                      <select
                        value={clause.insertAfterArticle}
                        onChange={(e) => onUpdateClause(contractType, clause.id, 'insertAfterArticle', parseInt(e.target.value))}
                        className="w-full p-2 border border-amber-300 rounded-lg text-sm bg-white font-medium"
                      >
                        <option value="0">All'inizio del contratto</option>
                        {availableArticles.map(num => (
                          <option key={num} value={num}>
                            Dopo Art. {num}
                          </option>
                        ))}
                      </select>
                      
                      <div className="text-xs text-amber-700 mt-2 p-2 bg-white rounded border border-amber-200">
                        <strong>Anteprima:</strong> Questa clausola diventerà{' '}
                        <span className="font-bold">
                          Art. {clause.insertAfterArticle + 1} - {clause.title || 'TITOLO CLAUSOLA'}
                        </span>
                        {clause.insertAfterArticle === 0 && ' (primo articolo)'}
                      </div>
                    </div>
                  </div>

                  {/* Domanda dedicata */}
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <label className="block text-xs font-semibold text-purple-800 mb-3 uppercase flex items-center gap-2">
                      ❓ Domanda per Attivare questa Clausola
                    </label>
                    
                    <input
                      type="text"
                      value={clause.question.text}
                      onChange={(e) => onUpdateClauseQuestion(contractType, clause.id, 'text', e.target.value)}
                      placeholder="Es: Desideri attivare la garanzia estesa?"
                      className="w-full p-3 border border-purple-300 rounded-lg text-sm mb-3 font-medium"
                    />

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo risposta</label>
                        <select
                          value={clause.question.type}
                          onChange={(e) => onUpdateClauseQuestion(contractType, clause.id, 'type', e.target.value)}
                          className="w-full p-2 border border-purple-300 rounded-lg text-sm bg-white"
                        >
                          <option value="radio">Sì/No (Radio)</option>
                          <option value="select">Menu a tendina</option>
                          <option value="text">Testo libero</option>
                          <option value="email">Email</option>
                          <option value="number">Numero</option>
                          <option value="date">Data</option>
                          <option value="textarea">Area di testo</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={clause.question.required}
                            onChange={(e) => onUpdateClauseQuestion(contractType, clause.id, 'required', e.target.checked)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm font-medium text-gray-700">Obbligatorio</span>
                        </label>
                      </div>
                    </div>

                    {/* Opzioni per select/radio */}
                    {(clause.question.type === 'select' || clause.question.type === 'radio') && (
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Opzioni di risposta:
                        </label>
                        <div className="space-y-2">
                          {clause.question.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => onUpdateClauseQuestionOption(contractType, clause.id, optIdx, e.target.value)}
                                placeholder={`Opzione ${optIdx + 1}`}
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <button
                                onClick={() => onRemoveClauseQuestionOption(contractType, clause.id, optIdx)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => onAddClauseQuestionOption(contractType, clause.id)}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Aggiungi opzione
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Condizione */}
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <label className="block text-xs font-semibold text-green-800 mb-3 uppercase flex items-center gap-2">
                      ✅ Quando Mostrare la Clausola?
                    </label>
                    
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-bold text-green-700">SE</span>
                      <span className="px-2 py-1 bg-white rounded border border-green-300 font-medium">
                        la risposta
                      </span>
                      <select
                        value={clause.condition.operator}
                        onChange={(e) => onUpdateClauseCondition(contractType, clause.id, 'operator', e.target.value)}
                        className="p-2 border border-green-300 rounded-lg bg-white font-medium"
                      >
                        <option value="=">è uguale a</option>
                        <option value="!=">è diversa da</option>
                        <option value=">">è maggiore di</option>
                        <option value="<">è minore di</option>
                        <option value=">=">è maggiore/uguale a</option>
                        <option value="<=">è minore/uguale a</option>
                        <option value="contains">contiene</option>
                      </select>
                      <input
                        type="text"
                        value={clause.condition.value}
                        onChange={(e) => onUpdateClauseCondition(contractType, clause.id, 'value', e.target.value)}
                        placeholder="valore"
                        className="flex-1 min-w-[100px] p-2 border border-green-300 rounded-lg font-medium"
                      />
                      <span className="font-bold text-green-700">ALLORA mostra clausola</span>
                    </div>

                    <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600 border border-green-200">
                      <strong>Esempio:</strong> SE risposta{' '}
                      {clause.condition.operator === '=' ? 'è uguale a' : 
                       clause.condition.operator === '!=' ? 'è diversa da' :
                       clause.condition.operator === '>' ? 'è maggiore di' :
                       clause.condition.operator === '<' ? 'è minore di' :
                       clause.condition.operator === '>=' ? 'è maggiore/uguale a' :
                       clause.condition.operator === '<=' ? 'è minore/uguale a' :
                       'contiene'} "{clause.condition.value || '...'}" ALLORA la clausola "{clause.title || 'questa'}" verrà inserita
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return null
}
