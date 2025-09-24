// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI with your API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The existing API endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
  const { model, system, context, user } = req.body;

  if (!user) {
    return res.status(400).json({ reply: "Please provide a user prompt." });
  }

  try {
    const messages = [];

    if (system) {
      messages.push({ role: "system", content: system });
    }
    if (context) {
      messages.push({ role: "system", content: context });
    }

    messages.push({ role: "user", content: user });

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: messages,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({ reply: aiResponse });

  } catch (error) {
    console.error('Error with OpenAI API call:', error);
    res.status(500).json({ reply: 'Sorry, something went wrong with the AI service. Please try again.' });
  }
});

// Add this line to serve the HTML file
app.use(express.static(__dirname));

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});