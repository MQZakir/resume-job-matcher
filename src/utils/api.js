const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const MODEL      = 'claude-sonnet-4-20250514'

// ─── CLAUDE AI ────────────────────────────────────────────────────────────────
/**
 * Call Claude. All resume analysis, scoring, fixing, and building goes through here.
 * maxTokens raised to 2000 so full resume rewrites never get cut off.
 */
export async function callAI(messages, systemPrompt, maxTokens = 2000) {
  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.[0]?.text ?? ''
}

// ─── JOB SEARCH ───────────────────────────────────────────────────────────────
/**
 * Search for real job listings via JSearch (RapidAPI).
 * JSearch scrapes Indeed, LinkedIn, Glassdoor, ZipRecruiter, and more in one call.
 *
 * To enable: add your RapidAPI key to .env as VITE_JSEARCH_KEY=your_key_here
 * Sign up free at: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *
 * @param {string} query   — e.g. "Senior Product Manager" or "React developer remote"
 * @param {string} location — e.g. "New York" or "Remote"
 * @param {number} page     — pagination (1-indexed)
 */
export async function searchJobs(query, location = '', page = 1) {
  const key = import.meta.env.VITE_JSEARCH_KEY

  if (!key) {
    // Return demo data when no API key is configured so UI still renders
    return getDemoJobs(query)
  }

  const params = new URLSearchParams({
    query: location ? `${query} in ${location}` : query,
    page: String(page),
    num_pages: '1',
    date_posted: 'month',
    employment_types: 'FULLTIME,PARTTIME,CONTRACTOR',
    job_requirements: 'no_degree,under_3_years_experience,more_than_3_years_experience',
    remote_jobs_only: location.toLowerCase().includes('remote') ? 'true' : 'false',
  })

  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?${params}`,
    {
      headers: {
        'x-rapidapi-key':  key,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) throw new Error(`Job search failed: ${res.status}`)
  const data = await res.json()

  return (data.data || []).map(job => ({
    id:           job.job_id,
    title:        job.job_title,
    company:      job.employer_name,
    location:     job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country || 'Remote',
    type:         job.job_employment_type || 'Full-time',
    remote:       job.job_is_remote,
    salary:       formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency),
    posted:       job.job_posted_at_datetime_utc,
    description:  (job.job_description || '').slice(0, 400),
    applyUrl:     job.job_apply_link || job.job_google_link,
    logo:         job.employer_logo,
    source:       job.job_publisher,
  }))
}

function formatSalary(min, max, currency = 'USD') {
  if (!min && !max) return null
  const fmt = n => `${currency === 'USD' ? '$' : currency}${Math.round(n / 1000)}k`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min)        return `From ${fmt(min)}`
  return `Up to ${fmt(max)}`
}

// Demo jobs shown when VITE_JSEARCH_KEY is not set
function getDemoJobs(query) {
  return [
    {
      id: 'demo-1', title: query || 'Software Engineer', company: 'Acme Corp',
      location: 'San Francisco, US', type: 'Full-time', remote: true,
      salary: '20k – 60k', posted: new Date().toISOString(),
      description: 'This is a demo listing. Add your VITE_JSEARCH_KEY to .env to see real jobs from Indeed, LinkedIn, and more.',
      applyUrl: '#', source: 'Demo',
    },
    {
      id: 'demo-2', title: query || 'Senior Engineer', company: 'TechStart Inc',
      location: 'Remote', type: 'Full-time', remote: true,
      salary: '30k – 70k', posted: new Date().toISOString(),
      description: 'Another demo listing. Connect JSearch (free tier on RapidAPI) to see real job postings with one-click apply links.',
      applyUrl: '#', source: 'Demo',
    },
    {
      id: 'demo-3', title: query || 'Lead Engineer', company: 'GlobalFirm',
      location: 'New York, US', type: 'Full-time', remote: false,
      salary: '40k – 80k', posted: new Date().toISOString(),
      description: 'Sign up at rapidapi.com, subscribe to JSearch (free tier available), and set VITE_JSEARCH_KEY in your .env file.',
      applyUrl: '#', source: 'Demo',
    },
  ]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
/**
 * Strip markdown code fences from Claude responses before JSON.parse().
 */
export function parseJSON(raw) {
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}