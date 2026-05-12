module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  try {
    const { image, language } = req.body;
    const isPT = language === 'pt';
    const prompt = `Responda APENAS com JSON em ${isPT ? 'português' : 'english'}. Identifique o produto com campos: name, category, color, type, material, condition, confidence (High/Medium/Low), confidence_pct (0-100), description (1-2 frases).`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Especialista em identificação de produtos.' },
          { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: image } }] }
        ]
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content.match(/\{[\s\S]*\}/)[0]);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};