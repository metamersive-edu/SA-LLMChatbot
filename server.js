import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// ---- middleware
app.use(cors());               // same-origin will also work without this
app.use(express.json({ limit: '1mb' }));

// ---- OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- health check (Render uses this if configured)
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ---- API
app.post('/api/chat', async (req, res) => {
  const { model, system, context, user } = req.body || {};

  if (!user || typeof user !== 'string' || !user.trim()) {
    return res.status(400).json({ reply: 'Please provide a user prompt.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ reply: 'Server misconfigured: missing OPENAI_API_KEY.' });
  }

  try {
    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    if (context) messages.push({ role: 'system', content: context });
    messages.push({ role: 'user', content: user });

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages,
    });

    const aiResponse = completion?.choices?.[0]?.message?.content || '';
    res.json({ reply: aiResponse });
  } catch (err) {
    console.error('OpenAI error:', err?.response?.data || err.message || err);
    res.status(500).json({ reply: 'Sorry, something went wrong with the AI service. Please try again.' });
  }
});

// ---- static site (serve files from /public)
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for any non-API routes (single-page-app style)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---- start server (bind to 0.0.0.0 for Render)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
