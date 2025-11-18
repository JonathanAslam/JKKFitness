import React, { useState } from 'react'
import '../pagestyle/FormStyle.css'
import SearchableSelect from '../../components/SearchableSelect'

const MUSCLE_OPTIONS = [
  { label: 'Abdominals', value: 'abdominals' },
  { label: 'Abductors', value: 'abductors' },
  { label: 'Adductors', value: 'adductors' },
  { label: 'Biceps', value: 'biceps' },
  { label: 'Calves', value: 'calves' },
  { label: 'Chest', value: 'chest' },
  { label: 'Forearms', value: 'forearms' },
  { label: 'Glutes', value: 'glutes' },
  { label: 'Hamstrings', value: 'hamstrings' },
  { label: 'Lats', value: 'lats' },
  { label: 'Lower Back', value: 'lower_back' },
  { label: 'Middle Back', value: 'middle_back' },
  { label: 'Neck', value: 'neck' },
  { label: 'Quadriceps', value: 'quadriceps' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Traps', value: 'traps' },
  { label: 'Triceps', value: 'triceps' }
];

const EXERCISE_TYPE_OPTIONS = [
  { label: 'Cardio', value: 'cardio' },
  { label: 'Olympic Weightlifting', value: 'olympic_weightlifting' },
  { label: 'Plyometrics', value: 'plyometrics' },
  { label: 'Powerlifting', value: 'powerlifting' },
  { label: 'Strength', value: 'strength' },
  { label: 'Stretching', value: 'stretching' },
  { label: 'Strongman', value: 'strongman' }
];

const DIFFICULTY_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Expert', value: 'expert' }
];

const normalizeSelection = (options, input) => {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  const lowered = trimmed.toLowerCase();
  const match = options.find(
    opt =>
      opt.value.toLowerCase() === lowered ||
      opt.label.toLowerCase() === lowered
  );
  if (match) return match.value;
  return lowered.replace(/\s+/g, '_');
};

const Workout = () => {
  // State for form values
  const [formData, setFormData] = useState({
    // Add your form fields here
    workoutName: '',
    muscleGroup: '',
    exerciseType: '',
    difficulty: '',
  });
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.workoutName.trim()) params.append('name', formData.workoutName.trim());
    const normalizedMuscle = normalizeSelection(MUSCLE_OPTIONS, formData.muscleGroup);
    const normalizedType = normalizeSelection(EXERCISE_TYPE_OPTIONS, formData.exerciseType);
    const normalizedDifficulty = normalizeSelection(DIFFICULTY_OPTIONS, formData.difficulty);

    if (normalizedMuscle) params.append('muscle', normalizedMuscle);
    if (normalizedType) params.append('type', normalizedType);
    if (normalizedDifficulty) params.append('difficulty', normalizedDifficulty);

    if (!params.toString()) {
      setError('Enter at least one search field to find exercises.');
      setHasSearched(false);
      setExercises([]);
      return;
    }

    if (!import.meta.env.VITE_API_NINJAS_KEY) {
      setError('Missing API key. Set VITE_API_NINJAS_KEY in your frontend .env file.');
      setHasSearched(false);
      setExercises([]);
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch(`https://api.api-ninjas.com/v1/exercises?${params.toString()}`, {
        headers: {
          'X-Api-Key': import.meta.env.VITE_API_NINJAS_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Unable to fetch exercises. Please try again.');
      }

      const data = await response.json();
      setExercises(data);
    } catch (err) {
      setError(err.message || 'Unable to fetch exercises right now.');
      setExercises([]);
      setHasSearched(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      workoutName: '',
      muscleGroup: '',
      exerciseType: '',
      difficulty: '',
    });
    setExercises([]);
    setError('');
    setHasSearched(false);
  };


  return (
    <div className='container'>

      <h3>Search by any combination of fields to find matching exercises.</h3>


      <div className="form">
        <form onSubmit={handleSubmit} noValidate>

          <div className='form-row'>
            <label>Name</label>
            <input
              type="text"
              name="workoutName"
              value={formData.workoutName}
              placeholder="e.g. push-up"
              onChange={handleChange}
              className='form-select'
            />
          </div>

          <SearchableSelect
            label="Muscle Group"
            name="muscleGroup"
            value={formData.muscleGroup}
            options={MUSCLE_OPTIONS}
            placeholder="Start typing a muscle..."
            onChange={handleChange}
          />

          <SearchableSelect
            label="Exercise Type"
            name="exerciseType"
            value={formData.exerciseType}
            options={EXERCISE_TYPE_OPTIONS}
            placeholder="Start typing a type..."
            onChange={handleChange}
          />

          <SearchableSelect
            label="Difficulty"
            name="difficulty"
            value={formData.difficulty}
            options={DIFFICULTY_OPTIONS}
            placeholder="Start typing difficulty..."
            onChange={handleChange}
          />

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
              Search
            </button>
          </div>


        </form>
      </div>

      <div className='results-panel'>
        {loading && <p className='status-text'>Searching for exercises...</p>}
        {error && <p className='error-text'>{error}</p>}
        {!loading && !error && hasSearched && exercises.length === 0 && (
          <p className='status-text'>No exercises matched your filters.</p>
        )}
        {!loading && !error && exercises.length > 0 && (
          <div className='exercise-grid'>
            {exercises.map(exercise => (
              <div
                key={`${exercise.name}-${exercise.difficulty}-${exercise.type}`}
                className='exercise-card'
              >
                <div className='exercise-header'>
                  <h4>{exercise.name}</h4>
                  <span className='badge'>{exercise.difficulty}</span>
                </div>
                <p className='exercise-meta'>
                  <strong>Type:</strong> {exercise.type} &nbsp;|&nbsp; <strong>Muscle:</strong> {exercise.muscle}
                </p>
                <p className='exercise-meta'>
                  <strong>Equipment:</strong> {exercise.equipment || 'None'}
                </p>
                <p className='exercise-instructions'>{exercise.instructions}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Workout
