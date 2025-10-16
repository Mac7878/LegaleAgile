# 🚀 Legale Agile

Sistema per creare wizard di contratti con clausole condizionali dinamiche.

## 📋 Caratteristiche

✅ **Dashboard Progetti**
- Visualizza tutti i progetti
- Crea, modifica, elimina progetti
- Lista contratti generati

✅ **Admin Mode**
- Setup progetti con Parte A e Parte B
- Template con `{{placeholder}}`
- Auto-generazione domande
- Clausole con domande dedicate
- Condizioni avanzate (=, !=, >, <, >=, <=, contains)

✅ **User Mode**
- Wizard step-by-step
- Progress bar
- Generazione contratto
- Download .txt

✅ **Database Persistente**
- Salvataggio progetti su Supabase
- Contratti generati archiviati
- Zero perdita dati

---

## 🛠️ Setup Locale

### **Requisiti:**
- Node.js 18+ 
- npm o yarn
- Account Supabase (gratis)

### **Step 1: Clone/Download**
```bash
# Se hai il progetto in ZIP
unzip legale-agile.zip
cd legale-agile

# Oppure da GitHub
git clone [tuo-repo-url]
cd legale-agile
```

### **Step 2: Installa Dipendenze**
```bash
npm install
```

### **Step 3: Setup Supabase**

1. Vai su [supabase.com](https://supabase.com)
2. Crea account (gratis)
3. New Project:
   - Nome: `legale-agile`
   - Password: [scegli tu]
   - Region: Europe West (o più vicina)
4. Aspetta ~2 minuti
5. Settings → API → Copia:
   - `Project URL`
   - `Project API Key` (anon/public)

### **Step 4: Configura Database**

1. Supabase Dashboard → SQL Editor
2. Apri file `database/schema.sql`
3. Copia tutto il contenuto
4. Incolla in SQL Editor
5. Click "Run"
6. ✅ Tabelle create!

### **Step 5: Environment Variables**

```bash
# Copia il template
cp .env.example .env.local

# Modifica .env.local con le tue chiavi:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### **Step 6: Avvia Sviluppo**

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

✅ **Legale Agile funziona!**

---

## 🚀 Deploy su Vercel

### **Step 1: Push su GitHub**

```bash
git init
git add .
git commit -m "Initial commit - Legale Agile"
git branch -M main
git remote add origin [tuo-repo-url]
git push -u origin main
```

### **Step 2: Deploy Vercel**

1. Vai su [vercel.com](https://vercel.com)
2. Sign up con GitHub
3. New Project → Import il tuo repo
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL = [tua-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [tua-key]
   ```
5. Deploy!

✅ **App live su `legale-agile.vercel.app`**

---

## 📁 Struttura Progetto

```
legale-agile/
├── app/
│   ├── api/
│   │   ├── projects/          # API CRUD progetti
│   │   └── contracts/         # API CRUD contratti
│   ├── dashboard/             # Dashboard principale
│   ├── admin/                 # Editor progetti
│   ├── wizard/                # Wizard compilazione
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                # Componenti React
├── lib/
│   └── supabase.ts           # Client Supabase + Types
├── database/
│   └── schema.sql            # Schema PostgreSQL
├── public/                   # Assets statici
├── .env.example
├── package.json
└── README.md
```

---

## 🔧 Scripts Disponibili

```bash
npm run dev      # Sviluppo locale (port 3000)
npm run build    # Build produzione
npm run start    # Avvia produzione
npm run lint     # ESLint check
```

---

## 📊 Database Schema

### **Tabella: projects**
```sql
- id (UUID)
- name (TEXT)
- description (TEXT)
- contracts (JSONB)     // Configurazione Parte A e B
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **Tabella: generated_contracts**
```sql
- id (UUID)
- project_id (UUID)
- project_name (TEXT)
- role ('A' | 'B')
- role_name (TEXT)
- content (TEXT)
- answers (JSONB)
- generated_at (TIMESTAMP)
```

---

## 🎯 Come Usare

### **1. Crea Progetto (Admin)**

1. Dashboard → "Nuovo Progetto"
2. Inserisci info:
   - Nome progetto
   - Parte A: es "Locatore"
   - Parte B: es "Locatario"
3. Template con `{{placeholder}}`:
   ```
   Il sottoscritto {{nome_locatore}} affitta...
   ```
4. Configura domande (auto-generate o manuale)
5. Aggiungi clausole:
   - Titolo: "CLAUSOLA GARANZIA"
   - Contenuto: "Il locatore garantisce..."
   - Domanda: "Vuoi garanzia estesa?"
   - Tipo: Radio (Sì/No)
   - Condizione: SE risposta = "Sì"
6. Salva

### **2. Compila Wizard (User)**

1. Dashboard → Seleziona progetto
2. Scegli ruolo (A o B)
3. Compila wizard:
   - Rispondi domande template
   - Rispondi domande clausole
4. Genera Contratto
5. Download .txt

---

## 🐛 Troubleshooting

### **Errore: "supabase is not defined"**
- Verifica `.env.local` con chiavi corrette
- Riavvia server: `npm run dev`

### **Errore: "Failed to fetch projects"**
- Verifica connessione internet
- Controlla Supabase Dashboard → Database online?
- Verifica schema SQL eseguito correttamente

### **Errore build Vercel**
- Verifica Environment Variables su Vercel
- Controlla logs deploy

---

## 📚 Tecnologie Usate

- **Next.js 14** - React Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database PostgreSQL
- **Lucide React** - Icons

---

## 🔄 Modifiche Future

Per modifiche al codice:
1. Modifica file locale
2. Test con `npm run dev`
3. `git add . && git commit -m "descrizione"`
4. `git push`
5. Vercel deploya automaticamente!

---

## 📞 Supporto

Per domande o problemi:
- Apri issue su GitHub
- Consulta documentazione in `/docs`

---

## 📄 Licenza

MIT License - Usa liberamente!

---

**🎉 Buon lavoro con Legale Agile!**
