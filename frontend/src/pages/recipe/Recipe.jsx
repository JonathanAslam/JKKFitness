import React, { useState } from 'react'
import '../pagestyle/FormStyle.css';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

const buildIngredientList = (meal) => {
  const ingredients = [];
  for (let i = 1; i <= 20; i += 1) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      const formatted = [measure, ingredient].filter(Boolean).join(' ').trim();
      ingredients.push(formatted);
    }
  }
  return ingredients;
};

const formatMeal = (meal) => {
  if (!meal) return null;
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    thumbnail: meal.strMealThumb,
    instructions: meal.strInstructions,
    tags: meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
    ingredients: buildIngredientList(meal),
    source: meal.strSource,
    youtube: meal.strYoutube
  };
};

const fetchJson = async (endpoint) => {
  const response = await fetch(`${BASE_URL}/${endpoint}`);
  if (!response.ok) {
    throw new Error('Unable to reach TheMealDB right now.');
  }
  return response.json();
};

const fetchMealsByName = async (query) => {
  const data = await fetchJson(`search.php?s=${encodeURIComponent(query)}`);
  return Array.isArray(data?.meals) ? data.meals.map(formatMeal).filter(Boolean) : [];
};

const fetchMealsByIngredient = async (query) => {
  const data = await fetchJson(`filter.php?i=${encodeURIComponent(query)}`);
  const meals = Array.isArray(data?.meals) ? data.meals.slice(0, 6) : [];
  if (!meals.length) return [];

  const detailedMeals = await Promise.all(meals.map(async (meal) => {
    try {
      const detail = await fetchJson(`lookup.php?i=${meal.idMeal}`);
      const detailedMeal = Array.isArray(detail?.meals) ? detail.meals[0] : null;
      return formatMeal(detailedMeal);
    } catch (err) {
      console.warn('Unable to load meal details', meal.idMeal, err);
      return null;
    }
  }));

  return detailedMeals.filter(Boolean);
};

const getInstructionsPreview = (text, maxLength = 180) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const Recipe = () => {
  const [formData, setFormData] = useState({
    recipe: ''
  });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMode, setSearchMode] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const query = formData.recipe.trim();
    if (!query) {
      setError('Please enter an ingredient or dish first.');
      setRecipes([]);
      return;
    }

    setLoading(true);
    setError('');
    setRecipes([]);
    setSearchMode('');
    setExpandedIds([]);

    try {
      const mealsByName = await fetchMealsByName(query);
      if (mealsByName.length) {
        setRecipes(mealsByName);
        setSearchMode('name');
        return;
      }

      const mealsByIngredient = await fetchMealsByIngredient(query);
      if (mealsByIngredient.length) {
        setRecipes(mealsByIngredient);
        setSearchMode('ingredient');
        return;
      }

      setError('No meals found for that search. Try another ingredient or dish.');
    } catch (err) {
      setError(err.message || 'Unable to fetch recipes right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      recipe: ''
    });
    setRecipes([]);
    setError('');
    setSearchMode('');
    setExpandedIds([]);
  };

  const toggleExpanded = (id) => {
    setExpandedIds(prev => (
      prev.includes(id)
        ? prev.filter(existing => existing !== id)
        : [...prev, id]
    ));
  };
  
  return (
    <div className='container'>
      <h3>Enter an ingredient or dish to discover recipe ideas</h3>

      <div className='form'>
        <form onSubmit={handleSubmit}>

          <div className='form-row'>
            <label>Search</label>
            <input
              type="text"
              name="recipe"
              value={formData.recipe}
              placeholder="e.g. chicken tacos"
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
              Find Recipes
            </button>
          </div>

        </form>
      </div>

      <div className='results-panel'>
        {loading && <p className='status-text'>Finding tasty ideas...</p>}
        {error && <p className='error-text'>{error}</p>}
        {!loading && !error && recipes.length > 0 && (
          <>
            <p className='status-text'>
              Showing matches by {searchMode === 'ingredient' ? 'ingredient' : 'dish name'}.
            </p>
            <div className='recipe-grid'>
              {recipes.map(recipe => (
                <article className='recipe-card' key={recipe.id}>
                  <div className='recipe-header'>
                    <h4>{recipe.name}</h4>
                    <button
                      type='button'
                      className='button button-secondary expand-button'
                      onClick={() => toggleExpanded(recipe.id)}
                    >
                      {expandedIds.includes(recipe.id) ? 'Collapse' : 'Expand'}
                    </button>
                  </div>

                  <div className='recipe-summary'>
                    {recipe.thumbnail && (
                      <img
                        src={recipe.thumbnail}
                        alt={recipe.name}
                        className='recipe-image'
                      />
                    )}
                    <div className='recipe-summary-text'>
                      <p className='recipe-meta'>
                        {recipe.category || 'Uncategorized'} · {recipe.area || 'Unknown origin'}
                      </p>
                      {recipe.tags?.length > 0 && (
                        <div className='recipe-tags'>
                          {recipe.tags.map(tag => (
                            <span className='chip' key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {recipe.instructions && !expandedIds.includes(recipe.id) && (
                        <p className='recipe-blurb'>
                          {getInstructionsPreview(recipe.instructions)}
                        </p>
                      )}
                    </div>
                  </div>

                  {expandedIds.includes(recipe.id) && (
                    <>
                      <div className='recipe-body'>
                        <div className='recipe-details'>
                          {recipe.ingredients.length > 0 && (
                            <div className='ingredient-list'>
                              <h5>Ingredients</h5>
                              <ul>
                                {recipe.ingredients.map((item, index) => (
                                  <li key={`${recipe.id}-${index}`}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {recipe.instructions && (
                            <p className='recipe-instructions'>
                              {recipe.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {(recipe.source || recipe.youtube) && (
                        <div className='recipe-links'>
                          {recipe.source && (
                            <a href={recipe.source} target="_blank" rel="noreferrer">
                              View Source
                            </a>
                          )}
                          {recipe.youtube && (
                            <a href={recipe.youtube} target="_blank" rel="noreferrer">
                              Watch Tutorial
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default Recipe
