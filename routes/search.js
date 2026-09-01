const express = require('express');
const router = express.Router();
const Tour = require('../models/Tour');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 });

async function getRelatedSearches(query) {
  const cacheKey = query.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Give me 6 short, realistic related search queries for a travel site for: "${query}". Respond ONLY with a JSON array of strings. No markdown, no explanation.`,
        }],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const suggestions = JSON.parse(cleaned);
    const result = Array.isArray(suggestions) ? suggestions : [];
    cache.set(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: 'Query is required' });

  try {
    const results = await Tour.find({
      status: 1,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    }).select('title slug img price days location category rating').limit(20);

    const relatedSearches = await getRelatedSearches(q);
    res.json({ results, relatedSearches });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
