# 🚀 LEGALE AGILE - Quick Start Guide

## ⚡ Setup Rapido (15 minuti)

### 📦 STEP 1: Estrai il Progetto
```bash
tar -xzf legale-agile.tar.gz
cd legale-agile
```

### 📥 STEP 2: Installa Dipendenze
```bash
npm install
```
_(Tempo: ~2 minuti)_

### 🗄️ STEP 3: Setup Supabase

1. **Vai su** [supabase.com](https://supabase.com)
2. **Sign Up** (gratis)
3. **New Project:**
   - Nome: `legale-agile`
   - Password: [scegli tu]
   - Region: Europe West
4. **Aspetta 2 minuti** (crea database)

### 🔑 STEP 4: Copia le Chiavi

1. Supabase Dashboard → **Settings** → **API**
2. Copia:
   - **Project URL** (es: `https://xxx.supabase.co`)
   - **Project API Key** (anon/public - inizia con `eyJ...`)

### ⚙️ STEP 5: Configura Environment

```bash
cp .env.example .env.local
```

Apri `.env.local` e incolla:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 🗃️ STEP 6: Crea Database

1. Supabase Dashboard → **SQL Editor**
2. Apri file `database/schema.sql`
3. **Copia tutto** il contenuto
4. **Incolla** in SQL Editor
5. Click **"Run"**
6. ✅ Vedi messaggio "Success"

### 🎉 STEP 7: Avvia App

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

**✅ LEGALE AGILE FUNZIONA!**

---

## 🧪 Test Veloce

1. Click **"Nuovo Progetto"**
2. Inserisci:
   - Nome: "Contratto Test"
   - Parte A: "Fornitore"
   - Parte B: "Cliente"
3. Template A:
   ```
   Il fornitore {{nome_fornitore}} fornisce al cliente {{nome_cliente}} 
   il servizio {{tipo_servizio}} per un importo di {{importo}} euro.
   ```
4. **Salva**
5. Click **"Compila"**
6. Scegli ruolo → Compila wizard
7. **Genera Contratto**
8. ✅ Download .txt funziona!

---

## 🚀 Deploy su Vercel (Opzionale)

### Push GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin [tuo-repo-url]
git push -u origin main
```

### Deploy Vercel:
1. [vercel.com](https://vercel.com) → New Project
2. Import da GitHub
3. **Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL = [tua-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [tua-key]
   ```
4. Deploy!

✅ **Live su `legale-agile.vercel.app`**

---

## 🐛 Problemi Comuni

### Errore: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Errore: "Failed to fetch projects"
- Verifica `.env.local` con chiavi corrette
- Controlla Supabase online
- Verifica schema SQL eseguito

### Errore build:
```bash
npm run build
```
Se errori TypeScript, controlla sintassi file `.tsx`

---

## 📞 Supporto

**Hai problemi?**
1. Controlla `README.md` completo
2. Verifica Supabase Dashboard → Logs
3. Controlla console browser (F12)

---

## 🎯 Prossimi Step

Dopo il test:
1. Crea progetti reali
2. Personalizza template
3. Testa wizard completo
4. Deploy su Vercel
5. **Condividi link GitHub** per modifiche avanzate

---

**🎉 Buon lavoro con Legale Agile!**

_Tempo totale setup: ~15 minuti_
