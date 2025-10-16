'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronRight, ChevronLeft, FileText, Download, Building, UserCircle, Home } from 'lucide-react'
import { Project, Clause } from '@/lib/supabase'
import { parseArticles, insertClausesIntoArticles, formatContract, replacePlaceholders } from '@/lib/contractUtils'

export default function WizardPage() {
  const router = useRouter()
  const params = useParams()
  
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [role, setRole] = useState<'A' | 'B' | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [finalContract, setFinalContract] = useState<string | null>(null)

  useEffect(() => {
    loadProject()
  }, [params.id])

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      const data = await res.json()
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
      alert('Errore nel caricamento del progetto')
    } finally {
      setLoading(false)
    }
  }

  const evaluateCondition = (condition: Clause['condition'], answer: string) => {
    if (answer === undefined || answer === null) return false
    
    switch (condition.operator) {
      case '=': return answer == condition.value
      case '!=': return answer != condition.value
      case '>': return parseFloat(answer) > parseFloat(condition.value)
      case '<': return parseFloat(answer) < parseFloat(condition.value)
      case '>=': return parseFloat(answer) >= parseFloat(condition.value)
      case '<=': return parseFloat(answer) <= parseFloat(condition.value)
      case 'contains': return String(answer).toLowerCase().includes(String(condition.value).toLowerCase())
      default: return false
    }
  }

  const generateContract = async () => {
    if (!project || !role) return

    const contract = project.contracts[role]
    
    // 1. Replace placeholders in template
    let templateWithAnswers = replacePlaceholders(contract.template, answers)
    
    // 2. Parse articles from template
    const articles = parseArticles(templateWithAnswers)
    
    // 3. Get valid clauses based on conditions
    const validClauses = contract.clauses
      .filter(c => {
        const clauseAnswer = answers[`clause_${c.id}`]
        return evaluateCondition(c.condition, clauseAnswer)
      })
      .map(c => ({
        title: c.title,
        content: replacePlaceholders(c.content, answers),
        insertAfterArticle: c.insertAfterArticle
      }))
    
    // 4. Insert clauses into articles and renumber
    const finalArticles = insertClausesIntoArticles(articles, validClauses)
    
    // 5. Format contract professionally
    const formattedContract = formatContract(project.name, finalArticles)
    
    setFinalContract(formattedContract)

    // 6. Save to database
    try {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          project_name: project.name,
          role,
          role_name: contract.name,
          content: formattedContract,
          answers
        })
      })
    } catch (error) {
      console.error('Error saving contract:', error)
    }
  }

  const downloadContract = () => {
    if (!finalContract || !project || !role) return

    const blob = new Blob([finalContract], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}-${project.contracts[role].name}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Render input for template questions
  const renderUserInput = (placeholder: string, questionData: any) => {
    const value = answers[placeholder] || ''
    const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    
    switch (questionData?.type) {
      case 'text':
      case 'email':
        return <input type={questionData.type} value={value} onChange={(e) => setAnswers({ ...answers, [placeholder]: e.target.value })} className={inputClass} required={questionData.required} />
      case 'number':
        return <input type="number" value={value} onChange={(e) => setAnswers({ ...answers, [placeholder]: e.target.value })} className={inputClass} required={questionData.required} />
      case 'date':
        return <input type="date" value={value} onChange={(e) => setAnswers({ ...answers, [placeholder]: e.target.value })} className={inputClass} required={questionData.required} />
      case 'textarea':
        return <textarea value={value} onChange={(e) => setAnswers({ ...answers, [placeholder]: e.target.value })} className={inputClass} rows={4} required={questionData.required} />
      case 'select':
        return (
          <select value={value} onChange={(e) => setAnswers({ ...answers, [placeholder]: e.target.value })} className={inputClass} required={questionData.required}>
            <option value="">Seleziona...</option>
            {questionData.options?.map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {questionData.options?.map((opt: string, i: number) => (
              <label key={i} className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name={placeholder} value={opt} checked={value === opt} onChange={(e) => setAnswers({ ...answers, [placeholder]: e.target.value })} className="w-4 h-4 text-blue-600" required={questionData.required} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )
      default:
        return <input type="text" value={value} onChange={(e) => setAnswers({ ...answers, [placeholder]: e.target.value })} className={inputClass} />
    }
  }

  // Render input for clause questions
  const renderClauseInput = (clause: Clause) => {
    const q = clause.question
    const key = `clause_${clause.id}`
    const value = answers[key] || ''
    
    const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    
    switch (q.type) {
      case 'text':
      case 'email':
        return <input type={q.type} value={value} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} className={inputClass} required={q.required} />
      case 'number':
        return <input type="number" value={value} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} className={inputClass} required={q.required} />
      case 'date':
        return <input type="date" value={value} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} className={inputClass} required={q.required} />
      case 'textarea':
        return <textarea value={value} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} className={inputClass} rows={4} required={q.required} />
      case 'select':
        return (
          <select value={value} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} className={inputClass} required={q.required}>
            <option value="">Seleziona...</option>
            {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <label key={i} className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name={key} value={opt} checked={value === opt} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} className="w-4 h-4 text-purple-600" required={q.required} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-800">Progetto non trovato</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Role selection screen
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
                <p className="text-gray-600">Seleziona il tuo ruolo per iniziare</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setRole('A')}
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500"
            >
              <Building className="w-20 h-20 mx-auto mb-4 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{project.contracts.A.name}</h3>
              <p className="text-gray-600">{project.contracts.A.description}</p>
              <div className="mt-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm inline-block">
                {project.contracts.A.placeholders.length + project.contracts.A.clauses.filter(c => c.question.text).length} domande
              </div>
            </button>

            <button
              onClick={() => setRole('B')}
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-purple-500"
            >
              <UserCircle className="w-20 h-20 mx-auto mb-4 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{project.contracts.B.name}</h3>
              <p className="text-gray-600">{project.contracts.B.description}</p>
              <div className="mt-4 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm inline-block">
                {project.contracts.B.placeholders.length + project.contracts.B.clauses.filter(c => c.question.text).length} domande
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const contract = project.contracts[role]
  
  // CRITICAL: Combine template questions + clause questions
  const allQuestions = [
    ...contract.placeholders.map(ph => ({ 
      type: 'placeholder' as const, 
      id: ph, 
      data: contract.questions[ph] 
    })),
    ...contract.clauses.filter(c => c.question.text).map(c => ({ 
      type: 'clause' as const, 
      id: c.id, 
      data: c 
    }))
  ]
  
  const totalSteps = allQuestions.length
  const currentQuestion = allQuestions[currentStep]
  const isLastStep = currentStep === totalSteps - 1

  // Final contract screen
  if (finalContract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Contratto Generato</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setFinalContract(null)
                    setCurrentStep(0)
                    setAnswers({})
                    setRole(null)
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Nuovo
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </div>

            {/* Professional Contract Preview - UPGRADED ✨ */}
            <div 
              className="bg-white rounded-lg mb-6 overflow-hidden"
              style={{
                border: '3px solid #1a1a1a',
                background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <div className="p-12 max-h-[600px] overflow-y-auto">
                <pre 
                  className="whitespace-pre-wrap text-gray-900"
                  style={{ 
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '15px',
                    lineHeight: '1.9',
                    letterSpacing: '0.03em',
                    color: '#1a1a1a'
                  }}
                >
                  {finalContract}
                </pre>
              </div>
            </div>

            <button
              onClick={downloadContract}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              <Download className="w-6 h-6" />
              <span>Scarica Contratto</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Wizard steps
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {role === 'A' ? <Building className="w-8 h-8 text-blue-600" /> : <UserCircle className="w-8 h-8 text-purple-600" />}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{contract.name}</h1>
                <p className="text-gray-600">{project.name}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Vuoi tornare alla selezione ruolo?')) {
                  setRole(null)
                  setCurrentStep(0)
                  setAnswers({})
                }
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cambia Ruolo
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Domanda {currentStep + 1} di {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                backgroundColor: role === 'A' ? '#2563eb' : '#9333ea'
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentQuestion && (
            <>
              <div className="mb-6">
                {/* Badge for clause questions */}
                {currentQuestion.type === 'clause' && (
                  <div className="mb-3 px-3 py-2 bg-purple-100 border-l-4 border-purple-600 rounded">
                    <span className="text-sm font-semibold text-purple-800">📋 Domanda per Clausola</span>
                  </div>
                )}
                
                <label className="block text-2xl font-bold text-gray-800 mb-2">
                  {currentQuestion.type === 'placeholder' 
                    ? (currentQuestion.data?.question || currentQuestion.id)
                    : currentQuestion.data.question.text
                  }
                </label>
                
                {((currentQuestion.type === 'placeholder' && currentQuestion.data?.required) ||
                  (currentQuestion.type === 'clause' && currentQuestion.data.question.required)) && (
                  <span className="text-red-500 text-sm">* Campo obbligatorio</span>
                )}
              </div>

              {/* Input based on question type */}
              {currentQuestion.type === 'placeholder' 
                ? renderUserInput(currentQuestion.id, currentQuestion.data)
                : renderClauseInput(currentQuestion.data)
              }

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Indietro</span>
                </button>

                {isLastStep ? (
                  <button
                    onClick={generateContract}
                    disabled={
                      currentQuestion.type === 'placeholder' 
                        ? !answers[currentQuestion.id]
                        : !answers[`clause_${currentQuestion.id}`]
                    }
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Genera Contratto</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      currentQuestion.type === 'placeholder' 
                        ? !answers[currentQuestion.id]
                        : !answers[`clause_${currentQuestion.id}`]
                    }
                    className="flex items-center space-x-2 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: role === 'A' ? '#2563eb' : '#9333ea' }}
                  >
                    <span>Avanti</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
