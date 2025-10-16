'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderOpen, Download, Calendar, FileText, Trash2 } from 'lucide-react'
import { Project, GeneratedContract } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [contracts, setContracts] = useState<GeneratedContract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Fetch projects
      const projectsRes = await fetch('/api/projects')
      const projectsData = await projectsRes.json()
      setProjects(projectsData)

      // Fetch generated contracts
      const contractsRes = await fetch('/api/contracts')
      const contractsData = await contractsRes.json()
      setContracts(contractsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewProject = () => {
    router.push('/admin/new')
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo progetto?')) return

    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      setProjects(projects.filter(p => p.id !== id))
      setContracts(contracts.filter(c => c.project_id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Errore durante l\'eliminazione del progetto')
    }
  }

  const downloadContract = (contract: GeneratedContract) => {
    const blob = new Blob([contract.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contract.project_name}-${contract.role_name}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Legale Agile</h1>
              <p className="text-gray-600">Sistema Wizard per Contratti Intelligenti</p>
            </div>
            <button
              onClick={createNewProject}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nuovo Progetto</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progetti Disponibili */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Progetti Contratti</h2>
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                {projects.length} progetti
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nessun progetto creato</p>
                <p className="text-sm">Clicca "Nuovo Progetto" per iniziare</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {projects.map(project => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                        <p className="text-sm text-gray-600">{project.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(project.created_at).toLocaleDateString('it-IT')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="font-semibold text-blue-800">{project.contracts.A.name}</div>
                        <div className="text-gray-600">{project.contracts.A.placeholders.length} domande</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="font-semibold text-purple-800">{project.contracts.B.name}</div>
                        <div className="text-gray-600">{project.contracts.B.placeholders.length} domande</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/wizard/${project.id}`)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Compila
                      </button>
                      <button
                        onClick={() => router.push(`/admin/${project.id}`)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contratti Generati */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Contratti Generati</h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {contracts.length} contratti
              </span>
            </div>

            {contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nessun contratto generato</p>
                <p className="text-sm">Compila un wizard per generare contratti</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {contracts.map(contract => (
                  <div key={contract.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800">{contract.project_name}</h3>
                        <p className="text-sm text-gray-600">{contract.role_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        contract.role === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {contract.role === 'A' ? 'Parte A' : 'Parte B'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(contract.generated_at).toLocaleString('it-IT')}</span>
                    </div>

                    <button
                      onClick={() => downloadContract(contract)}
                      className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Scarica Contratto</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
