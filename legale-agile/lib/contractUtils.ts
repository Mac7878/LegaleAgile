// Utility functions for article parsing and contract formatting

export interface Article {
  number: number
  title: string
  content: string
  originalIndex: number
}

/**
 * Parse template to extract articles
 * Supports formats: "Art. 1", "Articolo 1", "ART. 1"
 */
export function parseArticles(template: string): Article[] {
  const articles: Article[] = []
  
  // Regex per trovare articoli: Art. X - TITOLO o Articolo X - TITOLO
  const articleRegex = /(?:Art\.|Articolo|ART\.)\s*(\d+)\s*-\s*([^\n]+)/gi
  
  const lines = template.split('\n')
  let currentArticle: Article | null = null
  let contentLines: string[] = []
  
  lines.forEach((line, index) => {
    const match = articleRegex.exec(line)
    articleRegex.lastIndex = 0 // Reset regex
    
    if (match) {
      // Save previous article if exists
      if (currentArticle) {
        currentArticle.content = contentLines.join('\n').trim()
        articles.push(currentArticle)
      }
      
      // Start new article
      currentArticle = {
        number: parseInt(match[1]),
        title: match[2].trim(),
        content: '',
        originalIndex: index
      }
      contentLines = []
    } else if (currentArticle && line.trim()) {
      // Add content to current article
      contentLines.push(line)
    }
  })
  
  // Save last article
  if (currentArticle) {
    currentArticle.content = contentLines.join('\n').trim()
    articles.push(currentArticle)
  }
  
  return articles
}

/**
 * Insert clauses into articles array and renumber
 */
export function insertClausesIntoArticles(
  articles: Article[],
  clauses: Array<{ title: string; content: string; insertAfterArticle: number }>
): Article[] {
  const result: Article[] = []
  let articleNumber = 1
  
  // Sort clauses by insertion position
  const sortedClauses = [...clauses].sort((a, b) => a.insertAfterArticle - b.insertAfterArticle)
  
  articles.forEach((article) => {
    // Add original article with new number
    result.push({
      ...article,
      number: articleNumber++
    })
    
    // Add clauses that should be inserted after this article
    const clausesToInsert = sortedClauses.filter(
      c => c.insertAfterArticle === article.number
    )
    
    clausesToInsert.forEach(clause => {
      result.push({
        number: articleNumber++,
        title: clause.title,
        content: clause.content,
        originalIndex: -1 // Mark as inserted clause
      })
    })
  })
  
  // Add clauses at the beginning (insertAfterArticle = 0)
  const clausesAtStart = sortedClauses.filter(c => c.insertAfterArticle === 0)
  if (clausesAtStart.length > 0) {
    const startArticles = clausesAtStart.map((clause, idx) => ({
      number: idx + 1,
      title: clause.title,
      content: clause.content,
      originalIndex: -1
    }))
    
    // Renumber all articles
    const finalResult = [
      ...startArticles,
      ...result.map(a => ({ ...a, number: a.number + startArticles.length }))
    ]
    
    return finalResult
  }
  
  return result
}

/**
 * Format contract with professional layout
 */
export function formatContract(
  projectName: string,
  articles: Article[],
  date: string = new Date().toLocaleDateString('it-IT')
): string {
  const separator = '━'.repeat(60)
  
  let output = ''
  
  // Header
  output += `${separator}\n`
  output += `${' '.repeat(20)}${projectName.toUpperCase()}\n`
  output += `${separator}\n\n`
  
  // Articles
  articles.forEach(article => {
    output += `Art. ${article.number} - ${article.title.toUpperCase()}\n\n`
    output += `${article.content}\n\n`
  })
  
  // Footer
  output += `${separator}\n`
  output += `Letto, confermato e sottoscritto\n`
  output += `Data: ${date}\n\n`
  output += `_____________________    _____________________\n`
  output += `    PARTE A                   PARTE B\n`
  
  return output
}

/**
 * Replace placeholders in template text
 */
export function replacePlaceholders(
  text: string,
  answers: Record<string, string>
): string {
  let result = text
  
  Object.keys(answers).forEach(key => {
    if (!key.startsWith('clause_')) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, answers[key])
    }
  })
  
  return result
}
