const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-sonnet-4-20250514'

/**
 * Call the Anthropic Claude API.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} systemPrompt
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
export async function callAI(messages, systemPrompt, maxTokens = 1000) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  })

  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.[0]?.text ?? ''
}

/**
 * Parse JSON from an AI response, stripping markdown fences if present.
 * @param {string} raw
 * @returns {any}
 */
export function parseJSON(raw) {
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}
