import React, { useState } from 'react'
import '../pagestyle/FormStyle.css';
import api from '../../api/api';

const Nutrition = () => {
  const [formData, setFormData] = useState({
    foodConsumed: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);
    const query = formData.foodConsumed.trim();
    if (!query) {
      setError('Please describe what you ate.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/nutrition/analyze', { query });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setResults(items);
    } catch (err) {
      const data = err?.response?.data;
      const base = data?.error || 'Failed to analyze nutrition.';
      const details = typeof data?.details === 'string' ? data.details : '';
      setError(details ? `${base}: ${details}` : base);
      // Helpful console for devs
      // eslint-disable-next-line no-console
      console.error('Nutrition analyze failed', err?.response?.status, data);
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial values
  const handleReset = () => {
    setFormData({
      foodConsumed: ''
    });
    setResults([]);
    setError('');
  };
  return (
    <div className='container'>
      <h3>Describe what you ate to estimate its nutritional breakdown.</h3>

      <div className='form'>
        <form onSubmit={handleSubmit}>

          <div className='form-row'>
            <label>Food</label>
            <input
              id="foodConsumed"
              name="foodConsumed"
              type="text"
              value={formData.foodConsumed}
              placeholder="e.g. 1 apple and 1 cup of oatmeal"
              onChange={handleChange}
              className='form-select'
            />
          </div>


          <div className='form-actions'>
            <button
              type="button"
              onClick={handleReset}
              className="button button-secondary"
            >
              Reset
            </button>

            {/* no onClick because we handle submit at the form definition above */}
            <button
              type="submit"
              className="button button-primary"
            >
              Analyze
            </button>
          </div>

        </form>
      </div>

      {loading && (
        <div style={{ marginTop: '1rem' }}>Analyzing...</div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', color: 'crimson' }}>{error}</div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <h4>Results</h4>
          <div>
            {results.map((item, idx) => (
              <div key={idx} style={{
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {item.name || 'Item'}{item.serving_size_g ? ` • ${item.serving_size_g} g` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <span>Calories: {item.calories ?? '—'}</span>
                  <span>Protein: {item.protein_g ?? '—'} g</span>
                  <span>Carbs: {item.carbohydrates_total_g ?? '—'} g</span>
                  <span>Sugar: {item.sugar_g ?? '—'} g</span>
                  <span>Fiber: {item.fiber_g ?? '—'} g</span>
                  <span>Fat: {item.fat_total_g ?? '—'} g</span>
                  <span>Saturated: {item.fat_saturated_g ?? '—'} g</span>
                  <span>Sodium: {item.sodium_mg ?? '—'} mg</span>
                  <span>Potassium: {item.potassium_mg ?? '—'} mg</span>
                  <span>Cholesterol: {item.cholesterol_mg ?? '—'} mg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default Nutrition
