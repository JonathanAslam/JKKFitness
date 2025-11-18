const express = require('express');
const router = express.Router();

const FATSECRET_BASE_URL = 'https://platform.fatsecret.com/rest/server.api';
const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_TOKEN_SAFETY_WINDOW_MS = 60_000;

const fatSecretTokenCache = {
  token: null,
  expiresAt: 0,
};

const hasFatSecretCredentials = () =>
  Boolean(process.env.FATSECRET_CLIENT_ID && process.env.FATSECRET_CLIENT_SECRET);

const ensureFatSecretCredentials = () => {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials missing');
  }
  return { clientId, clientSecret };
};

const fetchFatSecretToken = async (forceRefresh = false) => {
  const { clientId, clientSecret } = ensureFatSecretCredentials();
  const now = Date.now();

  if (!forceRefresh && fatSecretTokenCache.token && fatSecretTokenCache.expiresAt > now) {
    return fatSecretTokenCache.token;
  }

  const response = await fetch(FATSECRET_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`FatSecret token request failed (${response.status}): ${text}`);
  }

  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error('FatSecret token response invalid JSON');
  }

  if (!payload.access_token || typeof payload.expires_in !== 'number') {
    throw new Error('FatSecret token response missing fields');
  }

  fatSecretTokenCache.token = payload.access_token;
  const lifetime = Math.max((payload.expires_in * 1000) - FATSECRET_TOKEN_SAFETY_WINDOW_MS, 0);
  fatSecretTokenCache.expiresAt = now + lifetime;

  return fatSecretTokenCache.token;
};

const buildSearchParams = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, `${v}`));
    } else {
      searchParams.append(key, `${value}`);
    }
  });
  return searchParams;
};

const fatSecretRequest = async (method, params = {}) => {
  ensureFatSecretCredentials();
  const execute = async () => {
    const queryParams = buildSearchParams({
      method,
      format: 'json',
      ...params,
    });
    const token = await fetchFatSecretToken();
    const response = await fetch(`${FATSECRET_BASE_URL}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return response;
  };

  let response = await execute();
  if (response.status === 401) {
    // Token may have expired early; refresh and retry once.
    fatSecretTokenCache.token = null;
    fatSecretTokenCache.expiresAt = 0;
    response = await execute();
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`FatSecret ${method} request failed (${response.status}): ${text}`);
  }

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`FatSecret ${method} invalid JSON response`);
  }

  if (data?.error) {
    const code = data.error?.code ?? 'unknown';
    const message = data.error?.message ?? 'FatSecret error';
    throw new Error(`FatSecret ${method} returned error ${code}: ${message}`);
  }

  return data;
};

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : undefined;
};

const fetchFatSecretItems = async (query) => {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials missing');
  }

  const searchData = await fatSecretRequest('foods.search', {
    search_expression: query,
    max_results: 5,
  });

  const foods = toArray(searchData?.foods?.food);
  if (!foods.length) {
    return [];
  }

  const items = [];
  for (const food of foods.slice(0, 3)) {
    try {
      const detail = await fatSecretRequest('food.get.v3', {
        food_id: food.food_id,
      });

      const servings = toArray(detail?.food?.servings?.serving);
      const serving = servings[0];
      if (!serving) {
        continue;
      }

      const baseName = [
        (typeof food.brand_name === 'string' && food.brand_name.trim()) || '',
        (typeof food.food_name === 'string' && food.food_name.trim()) || '',
      ]
        .filter(Boolean)
        .join(' - ');

      items.push({
        name: baseName || 'Item',
        serving_size_g:
          serving.metric_serving_unit === 'g'
            ? parseNumber(serving.metric_serving_amount)
            : undefined,
        calories: parseNumber(serving.calories),
        protein_g: parseNumber(serving.protein),
        carbohydrates_total_g:
          parseNumber(serving.carbohydrate) ?? parseNumber(serving.carbs),
        sugar_g: parseNumber(serving.sugar),
        fiber_g: parseNumber(serving.fiber),
        fat_total_g: parseNumber(serving.fat),
        fat_saturated_g: parseNumber(serving.saturated_fat),
        sodium_mg: parseNumber(serving.sodium),
        potassium_mg: parseNumber(serving.potassium),
        cholesterol_mg: parseNumber(serving.cholesterol),
      });
    } catch (err) {
      console.error('FatSecret detail fetch failed', food?.food_id, err);
    }
  }

  return items;
};

// POST /api/nutrition/analyze
// Body: { query: string }
router.post('/analyze', async (req, res) => {
  try {
    const query = (req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!hasFatSecretCredentials()) {
      return res.status(500).json({ error: 'Server missing FatSecret credentials' });
    }

    const items = await fetchFatSecretItems(query);
    if (!items.length) {
      return res.status(404).json({ error: 'No nutrition data found for that description.' });
    }

    return res.json({ items, source: 'fatsecret' });
  } catch (err) {
    console.error('Nutrition analyze error:', err);
    return res.status(502).json({ error: 'Unable to analyze nutrition right now. Please try again later.' });
  }
});

module.exports = router;
