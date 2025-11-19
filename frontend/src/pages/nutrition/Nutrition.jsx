import React, { useEffect, useState } from 'react'
import '../pagestyle/FormStyle.css';
import api from '../../api/api';

const activityOptions = [
  { id: 'lt30', label: '< 30 min/day', description: 'Sedentary days' },
  { id: '30to60', label: '30-60 min/day', description: 'Light activity' },
  { id: '60plus', label: '60+ min/day', description: 'Active lifestyle' },
];

const activityMultipliers = {
  lt30: 1.2,
  '30to60': 1.375,
  '60plus': 1.55,
};

const goalCopy = {
  loss: {
    title: 'To lose weight',
    plan: 'Create ~500 cal deficit each day with lean proteins and high-fiber meals.',
  },
  maintain: {
    title: 'To maintain weight',
    plan: 'Match intake to your routine. Balance carbs, proteins, and healthy fats evenly.',
  },
  gain: {
    title: 'To gain weight',
    plan: 'Aim for a ~500 cal surplus using nutrient-dense meals and strength workouts.',
  },
};

const toNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const totalInchesFromInputs = (feetValue, inchesValue) => {
  const feet = toNumber(feetValue);
  const inches = toNumber(inchesValue);
  if (feet == null && inches == null) return null;
  return (feet ?? 0) * 12 + (inches ?? 0);
};

const inchesFromStoredHeight = (rawHeight, units = 'imperial') => {
  if (rawHeight == null) return null;
  if (typeof rawHeight === 'string' && /ft|in|'|"/i.test(rawHeight)) {
    const match = rawHeight.match(/(\d+)'?\s*(\d+)?/);
    if (match) {
      const feet = Number(match[1]) || 0;
      const inches = Number(match[2]) || 0;
      return feet * 12 + inches;
    }
  }
  const numeric = toNumber(rawHeight);
  if (numeric == null) return null;
  return units === 'metric' ? numeric / 2.54 : numeric;
};

const toFeetInches = (totalInches) => {
  if (!totalInches || Number.isNaN(totalInches)) return { feet: '', inches: '' };
  const rounded = Math.round(totalInches);
  const feet = Math.floor(rounded / 12);
  const inches = rounded - feet * 12;
  return {
    feet: feet ? String(feet) : '',
    inches: inches ? String(inches) : '',
  };
};

const convertWeightToLbs = (value, units = 'imperial') => {
  const numeric = toNumber(value);
  if (numeric == null) return null;
  return units === 'metric' ? numeric * 2.20462 : numeric;
};

const convertLbsToKg = (value) => {
  const numeric = toNumber(value);
  if (numeric == null) return null;
  return numeric / 2.20462;
};

const convertInchesToCm = (value) => {
  const numeric = toNumber(value);
  if (numeric == null) return null;
  return numeric * 2.54;
};

const convertCmToInches = (value) => {
  const numeric = toNumber(value);
  if (numeric == null) return null;
  return numeric / 2.54;
};

const formatMeasure = (value, decimals = 1) => {
  if (value == null || Number.isNaN(value)) return '';
  const factor = 10 ** decimals;
  return String(Math.round(value * factor) / factor);
};

const Nutrition = () => {
  const [formData, setFormData] = useState({
    foodConsumed: ''
  });

  const [planForm, setPlanForm] = useState({
    age: '',
    sex: 'female',
    heightFeet: '',
    heightInches: '',
    weight: '',
    activity: 'lt30',
  });
  const [planResults, setPlanResults] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState('maintain');
  const [planError, setPlanError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const loadMeasurements = async () => {
      try {
        const response = await api.get('/measurement');
        if (response?.data) {
          const saved = response.data;
          const totalInches = inchesFromStoredHeight(saved.height, saved.units);
          const { feet, inches } = toFeetInches(totalInches);
          const weightLbs = convertWeightToLbs(saved.weight, saved.units);
          setPlanForm(prev => ({
            ...prev,
            age: saved.age ?? '',
            sex: saved.sex || 'female',
            heightFeet: feet,
            heightInches: inches,
            weight: weightLbs != null ? String(Math.round(weightLbs * 10) / 10) : '',
          }));
        }
      } catch (err) {
        console.debug('Nutrition planner: no saved measurements to preload', err);
      }
    };
    loadMeasurements();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlanChange = (e) => {
    const { name, value } = e.target;
    setPlanForm(prev => ({
      ...prev,
      [name]: value
    }));
    setPlanError('');
    setPlanResults(null);
  };

  const handleActivitySelect = (id) => {
    setPlanForm(prev => ({
      ...prev,
      activity: id
    }));
    setPlanError('');
    setPlanResults(null);
  };

  const validatePlanForm = () => {
    const { age, sex, heightFeet, heightInches, weight } = planForm;
    if (!age || !sex || (!heightFeet && !heightInches) || !weight) {
      setPlanError('Please complete age, sex, height, and weight.');
      return false;
    }
    return true;
  };

  const calculatePlan = () => {
    const age = Number(planForm.age);
    const totalInches = totalInchesFromInputs(planForm.heightFeet, planForm.heightInches);
    const weightLbs = toNumber(planForm.weight);
    if (!age || !totalInches || !weightLbs) throw new Error('Missing values');

    const heightCm = totalInches * 2.54;
    const weightKg = weightLbs * 0.453592;

    const bmr =
      10 * weightKg + 6.25 * heightCm - 5 * age + (planForm.sex === 'female' ? -161 : 5);
    const maintenance = Math.round(bmr * (activityMultipliers[planForm.activity] || 1.2));
    return {
      loss: Math.max(maintenance - 500, 1200),
      maintain: maintenance,
      gain: maintenance + 500,
    };
  };

  const handleViewPlan = () => {
    if (!validatePlanForm()) return;
    try {
      const totals = calculatePlan();
      setPlanResults(totals);
      setPlanError('');
    } catch (err) {
      console.error('Calorie plan calculation failed', err);
      setPlanError('Unable to calculate. Double-check your inputs.');
    }
  };

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
      console.error('Nutrition analyze failed', err?.response?.status, data);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      foodConsumed: ''
    });
    setResults([]);
    setError('');
  };

  return (
    <div className='container'>
      <h3>Build your personalized plan, then analyze meals for detailed nutrition.</h3>

      <div className='nutrition-layout'>
        <section className='plan-panel'>
          <header className='plan-header'>
            <h4>Daily Food Plan</h4>
            <p>Use your AI Assessment inputs to preview calorie plans tailored to your goals.</p>
          </header>

          <div className='plan-form'>
            <div className='input-grid'>
              <div className='form-field'>
                <label>Age</label>
                <input
                  type='number'
                  name='age'
                  value={planForm.age}
                  onChange={handlePlanChange}
                  className='form-select'
                  min="1"
                />
              </div>
              <div className='form-field'>
                <label>Sex</label>
                <select
                  name='sex'
                  value={planForm.sex}
                  onChange={handlePlanChange}
                  className='form-select'
                >
                  <option value='female'>Female</option>
                  <option value='male'>Male</option>
                </select>
              </div>
              <div className='form-field'>
                <label>Height</label>
                <div className='height-inputs'>
                  <input
                    type='number'
                    name='heightFeet'
                    value={planForm.heightFeet}
                    onChange={handlePlanChange}
                    className='form-select'
                    placeholder='Feet'
                    min="0"
                  />
                  <input
                    type='number'
                    name='heightInches'
                    value={planForm.heightInches}
                    onChange={handlePlanChange}
                    className='form-select'
                    placeholder='Inches'
                    min="0"
                  />
                </div>
              </div>
              <div className='form-field'>
                <label>Weight (lb)</label>
                <input
                  type='number'
                  name='weight'
                  value={planForm.weight}
                  onChange={handlePlanChange}
                  className='form-select'
                  min="0"
                />
              </div>
            </div>

            <div className='activity-options'>
              <p>Daily Activity Level</p>
              <div className='activity-grid'>
                {activityOptions.map(option => (
                  <button
                    type='button'
                    key={option.id}
                    className={`activity-option ${planForm.activity === option.id ? 'active' : ''}`}
                    onClick={() => handleActivitySelect(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className='plan-actions'>
              <button
                type='button'
                className='button button-primary'
                onClick={handleViewPlan}
              >
                View Your Food Plan
              </button>
            </div>
            {planError && <p className='error-text'>{planError}</p>}

            {planResults && (
              <div className='plan-results'>
                <p className='status-text'>Pick a calorie target to focus your plate.</p>
                <div className='goal-grid'>
                  {['loss', 'maintain', 'gain'].map(goal => (
                    <button
                      key={goal}
                      type='button'
                      className={`goal-card ${selectedGoal === goal ? 'active' : ''}`}
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <div className='goal-title'>{goalCopy[goal].title}</div>
                      <div className='goal-calories'>{planResults[goal]} kcal</div>
                      <p className='goal-plan'>{goalCopy[goal].plan}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className='lookup-panel'>
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
            <div className='status-text' style={{ marginTop: '1rem' }}>Analyzing...</div>
          )}

          {error && (
            <div className='error-text' style={{ marginTop: '1rem' }}>{error}</div>
          )}

          {results.length > 0 && (
            <div className='results-panel'>
              <h4>Food Breakdown</h4>
              <div>
                {results.map((item, idx) => (
                  <div key={idx} className='nutrition-card'>
                    <div className='nutrition-card__title'>
                      {item.name || 'Item'}{item.serving_size_g ? ` · ${item.serving_size_g} g` : ''}
                    </div>
                    <div className='nutrition-grid'>
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
        </section>
      </div>
    </div>
  )
}

export default Nutrition
