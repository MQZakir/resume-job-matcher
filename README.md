# REZIQ — AI Resume Intelligence

> Upload your resume. Know exactly where you stand. Get hired faster.

REZIQ is a full-stack AI resume toolkit built with React + Vite. It parses PDF and DOCX resumes, runs them through a proprietary AI model for deep analysis, matches them against job descriptions, finds real job listings across the web, rewrites weak sections, and builds complete resumes from scratch — all in a single brutalist dark-mode interface.

---

## What It Does

| Page | What happens |
|------|-------------|
| **Analyzer** | Upload resume → AI scores it across 5 dimensions (ATS, Content, Format, Impact, Overall) → full section-by-section audit with missing keywords |
| **Job Matcher** | Match mode: paste a job description → AI scores fit + gives tailored tips. Discover mode: AI reads your resume → calls JSearch API → returns real job listings from Indeed, LinkedIn, Glassdoor, ZipRecruiter with one-click apply links |
| **Fixer** | Choose a section (Summary, Experience, Skills, Achievements, or Full Resume) → AI rewrites it with improvements, before/after scores, and an alternate version |
| **Builder** | Fill in your details → pick a template → AI generates a complete ATS-optimized resume from scratch |

---

## Tech Stack

```
Frontend     React 18 + Vite 5
Styling      Pure CSS (no framework) — brutalist dark-mode design system
AI Engine    Proprietary AI model via REST API
Job Search   JSearch API via RapidAPI (scrapes Indeed, LinkedIn, Glassdoor, ZipRecruiter)
File Parsing pdfjs-dist (PDF) + mammoth (DOCX)
Typography   Bebas Neue · DM Mono · Instrument Serif
```

---

## Intelligence Architecture

REZIQ's scoring, rewriting, and matching is powered by a proprietary AI model trained on resume and hiring data. For the job discovery feature, the architecture is:

```
Resume → AI Model (extracts: role, skills, seniority, location)
                    ↓
           JSearch API (searches real job boards)
                    ↓
         Live job listings with apply links
```

The AI model handles understanding and reasoning. JSearch handles real-time job board data retrieval.

---

## Project Structure

```
reziq/
├── index.html
├── package.json
├── vite.config.js
├── .env                          ← you create this (see setup)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── utils/
    │   ├── api.js                ← AI model + JSearch job search
    │   └── parseResume.js        ← PDF and DOCX text extraction
    ├── components/
    │   ├── TopNav.jsx            ← floating pill navigation
    │   ├── ResumeUploader.jsx    ← drag-and-drop upload + full parsed preview
    │   ├── AnimatedScore.jsx     ← animated score ring
    │   ├── Background.jsx        ← dot grid + grain texture
    │   ├── Chip.jsx              ← keyword tag
    │   ├── Divider.jsx           ← section divider
    │   ├── LoadingScreen.jsx     ← full-page loading state
    │   ├── ScoreBar.jsx          ← animated progress bar
    │   └── Section.jsx           ← page wrapper with bg number
    ├── pages/
    │   ├── Home.jsx              ← overview + tool navigation
    │   ├── Analyzer.jsx          ← ATS audit page
    │   ├── Matcher.jsx           ← job match + job discovery
    │   ├── Fixer.jsx             ← AI section rewriter
    │   └── Builder.jsx           ← resume generator
    ├── hooks/
    │   ├── useCountUp.js         ← animated number counter
    │   ├── useInView.js          ← intersection observer
    │   └── useScramble.js        ← text scramble on hover
    └── styles/
        ├── variables.css         ← design tokens (colours, easing, timing)
        ├── components.css        ← all component styles
        ├── animations.css        ← keyframes
        └── global.css            ← base resets
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/yourname/reziq.git
cd reziq
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and add your keys:

```env
# Required — AI model API key
VITE_AI_API_KEY=your_key_here

# Optional but recommended — free tier at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
# Without this, the "Find Jobs" feature shows demo listings instead of real ones
VITE_JSEARCH_KEY=your_rapidapi_key_here
```

> **Security note:** These keys are prefixed with `VITE_` so Vite bundles them into the client. This is fine for local development and personal use. For a production deployment with real users, move API calls to a serverless backend (Vercel Edge Functions, Cloudflare Workers, etc.) so keys are never exposed.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## API Keys

### AI API Key — Required

Contact the REZIQ team for API access.`VITE_ANTHROPIC_API_KEY`

**Cost estimate:** Each resume analysis costs roughly $0.003–$0.008 (fractions of a cent). You can run thousands of analyses for a few dollars.

### JSearch (Job Discovery) — Optional

1. Go to [rapidapi.com](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Create a free account
3. Subscribe to JSearch — the free tier gives you **200 requests/month**
4. Copy your RapidAPI key into `VITE_JSEARCH_KEY`

Without this key, the job discovery feature still works — it just shows clearly labelled demo listings so you can see the UI. The match-to-job-description feature works without it regardless.

---

## Features In Depth

### Resume Parser

REZIQ extracts 100% of the text from your resume — nothing is truncated or summarised.

- **PDF:** Uses `pdfjs-dist` to reconstruct visual lines from raw text item coordinates. Text items are grouped by Y position (2px buckets), sorted left-to-right per line, top-to-bottom per page. This correctly handles multi-column layouts.
- **DOCX:** Uses `mammoth` for paragraph-level plain text extraction
- **Section detection:** 13 named heading patterns (Experience, Education, Skills, etc.) plus a fallback for any all-caps short line (common in resumes). Every detected section is shown to the user with its full content before anything is sent to AI

### Analyzer — ATS Audit

Sends the full parsed resume text to the AI model. Returns:

- **5 scores:** Overall, ATS Pass Rate, Content Quality, Format, Impact
- **Section audit:** Each section (Summary, Experience, Skills, Education, Achievements, Contact) scored 0–100 with specific feedback
- **Present vs missing keywords:** What's there, what's missing
- **Strengths and weaknesses:** Specific to this resume
- **Red flags:** Issues that could automatically reject the application
- **Industry fit:** Which industries this resume is strongest for
- **Top 5 recommendations:** Highest-ROI changes to make

### Job Matcher — Two Modes

**Match to Job Description**
- Paste any job posting → AI compares it to your resume
- Returns: match score, ATS score, verdict with reasoning, matched/missing skills, experience gaps, keywords to add, tailoring tips, and a rewritten summary specifically for that role

**Find Matching Jobs (requires JSearch key)**
- AI reads your resume and extracts: primary job title, alternative titles, top skills, seniority level, preferred location, industry
- Uses those to construct targeted search queries
- Calls JSearch API which searches Indeed, LinkedIn, Glassdoor, ZipRecruiter simultaneously
- Returns real job listings: title, company, salary range, location, remote flag, description preview, time posted, and a direct apply link
- Paginated — load more results with one click

### Fixer — AI Section Rewriter

Select which section to fix, optionally enter a target role, choose a tone (Professional / Confident / Data-driven / Creative / Executive / Startup). The AI then:

- Extracts the original section text from the resume
- Scores it before and after
- Rewrites it to be stronger, more impactful, ATS-optimised
- Lists the specific improvements made
- Gives an alternative version with a different angle
- Adds an advanced tip for that section type

### Builder — Generate From Scratch

Choose a template (Modern ATS, Executive, Creative Pro, Tech/Engineering, Academic, Career Changer), fill in your details — as much or as little as you have — and the AI builds a complete resume from scratch. Sparse input is fine; it fills gaps with realistic, appropriate placeholders you can edit.

---

## Design System

REZIQ uses a custom brutalist dark-mode design system with no external UI framework.

---