/**
 * API route to break down a goal into actionable tasks using Vertex AI (Gemini)
 * 
 * Environment variables required:
 * - GOOGLE_CLOUD_PROJECT_ID: Your GCP project ID
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON (or use default credentials)
 * - VERTEX_AI_LOCATION: Region (default: us-central1)
 * 
 * For local development, you can also use:
 * - VERTEX_AI_API_KEY: Direct API key for Gemini API (simpler setup)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { goalTitle, goalDescription, existingGoals, taskCount } = req.body;

  if (!goalTitle) {
    return res.status(400).json({ error: 'Goal title is required' });
  }

  const desiredTaskCount =
    typeof taskCount === 'number' ? Math.max(1, Math.min(12, Math.floor(taskCount))) : 5;

  try {
    // Try using Vertex AI Gemini API
    const tasks = await generateTasksWithVertexAI(
      goalTitle,
      goalDescription,
      existingGoals,
      desiredTaskCount
    );
    
    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('AI task generation error:', error);
    console.error('Error details:', error.message);
    
    // Fallback: Generate basic tasks if AI fails
    const fallbackTasks = generateFallbackTasks(goalTitle, desiredTaskCount);
    console.log('Using fallback tasks:', fallbackTasks.length);
    return res.status(200).json({ tasks: fallbackTasks, fallback: true, error: error.message });
  }
}

async function generateTasksWithVertexAI(
  goalTitle,
  goalDescription,
  existingGoals = [],
  taskCount = 5
) {
  const apiKey = process.env.VERTEX_AI_API_KEY || process.env.GEMINI_API_KEY;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  
  // Option 1: Use Gemini API directly (simpler, requires API key)
  if (apiKey) {
    return await generateWithGeminiAPI(goalTitle, goalDescription, existingGoals, taskCount, apiKey);
  }
  
  // Option 2: Use Vertex AI (requires service account)
  if (projectId) {
    return await generateWithVertexAI(goalTitle, goalDescription, existingGoals, projectId, location);
  }
  
  throw new Error('No Vertex AI configuration found. Set VERTEX_AI_API_KEY or GOOGLE_CLOUD_PROJECT_ID');
}

async function generateWithGeminiAPI(goalTitle, goalDescription, existingGoals, taskCount, apiKey) {
  const contextGoals = existingGoals.length > 0 
    ? `\n\nExisting goals in this partnership: ${existingGoals.map(g => g.title).join(', ')}`
    : '';
  
  const prompt = `You are a professional planner with 20 years of experience helping accountability partners stay on track.

Break down the goal below into exactly ${taskCount} sequential "Tasks". Each task must be simple to execute, written in clear language, and include a realistic day estimate that represents how long the task should take before the next task unlocks.

For every task, provide:
- "title": a concise action label (max 12 words)
- "description": one sentence describing what success looks like
- "durationDays": a positive integer for how many days this task should take

Goal: ${goalTitle}
${goalDescription ? `Description: ${goalDescription}` : ''}${contextGoals}

Output ONLY valid JSON in the following format:
[
  {
    "title": "Task title",
    "description": "What should be accomplished",
    "durationDays": 3
  }
]

- Never include markdown fences or commentary.
- durationDays must be at least 1 and no more than 14.
- Keep the plan achievable for students balancing school/work.`;

  // Try the latest Gemini API endpoint
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Gemini API error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${errorJson.error?.message || errorText}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    console.error('Gemini API error details:', errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!text) {
    throw new Error('Empty response from AI');
  }
  
  const parsed = parseTaskArray(text);
  if (parsed.length === 0) {
    throw new Error('Could not parse tasks from AI response: ' + text.substring(0, 120));
  }
  return parsed;
}

async function generateWithVertexAI(goalTitle, goalDescription, existingGoals, projectId, location) {
  // This would use the Vertex AI SDK
  // For now, we'll use the Gemini API approach which is simpler
  // If you want full Vertex AI SDK, you'd need to install @google-cloud/aiplatform
  throw new Error('Vertex AI SDK not yet implemented. Please use VERTEX_AI_API_KEY for Gemini API.');
}

function generateFallbackTasks(goalTitle, taskCount = 5) {
  const keywords = goalTitle.toLowerCase();
  let templates;

  if (keywords.includes('learn') || keywords.includes('study')) {
    templates = [
      { title: 'Gather learning resources', description: 'Collect videos, articles, or courses needed to start', durationDays: 2 },
      { title: 'Outline a study plan', description: 'Define milestones and daily focus blocks', durationDays: 2 },
      { title: 'Complete first lessons', description: 'Finish the opening modules and take notes', durationDays: 3 },
      { title: 'Practice and apply', description: 'Work on exercises or mini-projects that reinforce concepts', durationDays: 4 },
      { title: 'Reflect and adjust', description: 'Review progress, adjust schedule, and plan next sprint', durationDays: 2 },
    ];
  } else if (keywords.includes('build') || keywords.includes('create') || keywords.includes('develop')) {
    templates = [
      { title: 'Define scope and requirements', description: 'List core features and success criteria', durationDays: 2 },
      { title: 'Set up environment', description: 'Create repos, tools, and baseline components', durationDays: 2 },
      { title: 'Implement core feature', description: 'Build the most critical functionality', durationDays: 4 },
      { title: 'QA and iterate', description: 'Test, fix bugs, and refine UX', durationDays: 3 },
      { title: 'Launch and document', description: 'Deploy or share and capture lessons learned', durationDays: 2 },
    ];
  } else if (keywords.includes('improve') || keywords.includes('enhance')) {
    templates = [
      { title: 'Audit current state', description: 'Identify pain points with metrics or feedback', durationDays: 2 },
      { title: 'Set measurable targets', description: 'Define KPIs or quality bars to hit', durationDays: 2 },
      { title: 'Implement improvements', description: 'Ship the prioritized changes', durationDays: 4 },
      { title: 'Measure outcomes', description: 'Review analytics or collect fresh feedback', durationDays: 3 },
      { title: 'Plan next iteration', description: 'Decide what to keep doing or adjust', durationDays: 2 },
    ];
  } else {
    templates = [
      { title: 'Clarify success', description: 'Write a one-sentence definition of done', durationDays: 1 },
      { title: 'Break down milestones', description: 'Split the goal into smaller checkpoints', durationDays: 2 },
      { title: 'Execute first milestone', description: 'Complete the first chunk of work', durationDays: 3 },
      { title: 'Check progress with partner', description: 'Share updates and unblock each other', durationDays: 2 },
      { title: 'Prepare next sprint', description: 'Capture lessons and set up the next tasks', durationDays: 2 },
    ];
  }

  const result = [];
  for (let i = 0; i < taskCount; i++) {
    const template = templates[i % templates.length];
    result.push({
      title: template.title,
      description: template.description,
      durationDays: template.durationDays,
    });
  }
  return result;
}

function parseTaskArray(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => normalizeTask(entry)).filter(Boolean);
  } catch (err) {
    console.error('Failed to parse JSON from response', err);
    return [];
  }
}

function normalizeTask(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return {
      title: entry.trim(),
      description: '',
      durationDays: 1,
    };
  }

  if (typeof entry === 'object') {
    const title = (entry.title || entry.name || '').toString().trim();
    const description = (entry.description || entry.details || '').toString().trim();
    const duration = Number.isFinite(entry.durationDays)
      ? Math.max(1, Math.min(14, Math.round(entry.durationDays)))
      : 1;
    if (!title) return null;
    return {
      title,
      description,
      durationDays: duration,
    };
  }

  return null;
}

