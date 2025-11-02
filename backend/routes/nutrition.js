const express = require('express');
const router = express.Router();

// POST /api/nutrition/analyze
// Body: { query: string }
router.post('/analyze', async (req, res) => {
  try {
    const query = (req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const nutritionixAppId = process.env.NUTRITIONIX_APP_ID;
    const nutritionixApiKey = process.env.NUTRITIONIX_API_KEY;

    if (!nutritionixAppId || !nutritionixApiKey) {
      return res.status(500).json({ error: 'Server missing Nutritionix credentials' });
    }

    const nxRes = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-app-id': nutritionixAppId,
        'x-app-key': nutritionixApiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!nxRes.ok) {
      const text = await nxRes.text().catch(() => '');
      console.error('Nutritionix upstream error', nxRes.status, text);
      if (nxRes.status === 401) {
        return res.status(401).json({
          error: 'Nutritionix unauthorized',
          details: 'Invalid or mismatched NUTRITIONIX_APP_ID/NUTRITIONIX_API_KEY. Verify they belong to the same app and are set in backend/.env, then restart the server.',
        });
      }
      return res.status(nxRes.status).json({ error: 'Upstream error (Nutritionix)', details: text });
    }

    const nxData = await nxRes.json();
    const items = Array.isArray(nxData?.foods) ? nxData.foods.map((f) => ({
      name: f.food_name,
      serving_size_g: f.serving_weight_grams,
      calories: f.nf_calories,
      protein_g: f.nf_protein,
      carbohydrates_total_g: f.nf_total_carbohydrate,
      sugar_g: f.nf_sugars,
      fiber_g: f.nf_dietary_fiber,
      fat_total_g: f.nf_total_fat,
      fat_saturated_g: f.nf_saturated_fat,
      sodium_mg: f.nf_sodium,
      potassium_mg: f.nf_potassium,
      cholesterol_mg: f.nf_cholesterol,
    })) : [];
    return res.json({ items });
  } catch (err) {
    console.error('Nutrition analyze error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
