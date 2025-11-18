import React, { useEffect, useState } from 'react';
import '../pagestyle/FormStyle.css';
import api from '../../api/api'
import SearchableSelect from '../../components/SearchableSelect'

const SEX_OPTIONS = [
    { label: 'Female', value: 'female' },
    { label: 'Male', value: 'male' }
];

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

const totalInchesFromInputs = (feetValue, inchesValue) => {
    const feet = toNumber(feetValue);
    const inches = toNumber(inchesValue);
    if (feet == null && inches == null) return null;
    return (feet ?? 0) * 12 + (inches ?? 0);
};

const convertWeightToLbs = (value, units = 'imperial') => {
    const numeric = toNumber(value);
    if (numeric == null) return null;
    return units === 'metric' ? numeric * 2.20462 : numeric;
};

// accept profile from AppContent.jsx
const Calculator = () => {
    // State for form values
    const [formData, setFormData] = useState({
        units: 'imperial',
        age: '',
        sex: '',
        heightFeet: '',
        heightInches: '',
        weight: '',
        // new fields for ML model
        diabetes: '',
        bmi: '',
        hypertension: '',
        fitnessGoal: '',
        // fitnessType: ''
    });

    const [mlResponse, setMlResponse] = useState(null);


    // useEffect to load the user measurement information if a user is signed into site, populate form data
    useEffect(() => {

        const fetchPreviousData = async () => {
            //try to load user profile data
            try {
                const fetchedResult = await api.get("/measurement");
                if (fetchedResult?.data) {
                    const saved = fetchedResult.data;
                    const totalInches = inchesFromStoredHeight(saved.height, saved.units);
                    const { feet, inches } = toFeetInches(totalInches);
                    const weightLbs = convertWeightToLbs(saved.weight, saved.units);
                    setFormData(prev => ({
                        ...prev,
                        ...saved,
                        units: 'imperial',
                        heightFeet: feet,
                        heightInches: inches,
                        weight: weightLbs != null ? String(Math.round(weightLbs * 10) / 10) : '',
                    }));
                }
            } catch (error) {
                console.debug('No saved measurements available', error);
                return; // dont alert if no user, just ignore and do nothing
            }
        };

        fetchPreviousData();
    }, []); //only want to run one time, so empty dependency array. if we want to run multiple times on change, put the value to listen to here


    const calculateBMI = ({ heightFeet, heightInches, weight }) => {
        const totalInches = totalInchesFromInputs(heightFeet, heightInches);
        const weightLbs = toNumber(weight);
        if (!totalInches || !weightLbs) return null;
        const bmi = 703 * weightLbs / (totalInches ** 2);
        return Math.round(bmi * 10) / 10;
    };

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

        //compute the user's bmi locally
        const newBMI = calculateBMI(formData);

        // create a updated data to manage formData + the recently calcualted bmi
        const totalInches = totalInchesFromInputs(formData.heightFeet, formData.heightInches);
        const weightLbs = toNumber(formData.weight);

        const updatedFormData = {
            ...formData,
            units: 'imperial',
            height: totalInches,
            weight: weightLbs,
            bmi: newBMI ?? formData.bmi,   // update bmi, if null just keep formData.bmi
        };

        setFormData(prev => ({ ...prev, bmi: updatedFormData.bmi }));

        console.log("Updated formData before submit:", updatedFormData);

        // fix all values we want saved to payload const and then save that to db, filtering out unneeded information for mongodb
        const payload = {
            units: 'imperial',
            age: Number(updatedFormData.age),
            sex: updatedFormData.sex,
            height: updatedFormData.height,
            weight: updatedFormData.weight,
            // we dont wanna include the rest of the values which are only for the ML model and will be saved and sent to that separately 
        }

        // using jwt to auth users, so userId is tied to that, just return the flattened form data with ...formData so we dont have any nested json in our db
        try {
            // Update mongodb database with user infomration
            const userMeasurement = await api.post("/measurement", payload);
            // console.log("Saved measurement: ", userMeasurement.data);      // DELETE WHEN PRODUCTION
            if (userMeasurement) {
                alert("Measurement saved successfully!");       // DELETE WHEN PRODUCTION
            }

            // send data to flask api and store result, display results to user
            const flaskModelResult = await api.post("/ml/predict", { data: updatedFormData });
            console.log("Flask Model Response:", flaskModelResult.data);
            console.log("Raw response:", flaskModelResult);

            if (flaskModelResult.data) {
                console.log("Setting mlResponse to:", flaskModelResult.data);
                setMlResponse(flaskModelResult.data.prediction);
            } else {
                throw new Error("Invalid response format from prediction service");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error while processing your request. Please make sure you are logged in to use this feature.");
        }

        // at the end, scroll back up to top in order to see the results
        // use the id set at the top of the div
        const element = document.getElementById('scroll-point');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }

    };

    // Reset form to initial values
    const handleReset = () => {
        setFormData({
            units: 'imperial',
            age: '',
            sex: 'female',
            heightFeet: '',
            heightInches: '',
            weight: '',
            // new fields for ML model
            diabetes: '',
            bmi: '',
            hypertension: '',
            fitnessGoal: '',
            // fitnessType: ''
        });
    };

    return (
        <div className="calculator-page" id='scroll-point'>
            {mlResponse && (
                <div className='container results-container'>
                    <h4>BMI: {formData.bmi}</h4>

                    {/* Fitness Type first as it's the overall category */}
                    {mlResponse.fitnessType && (
                        <div className="ml-result">
                            <h4>Recommended Fitness Type</h4>
                            <p className="result-text">{mlResponse.fitnessType.result}</p>
                            <p className="confidence">Confidence: {(mlResponse.fitnessType.confidence * 100).toFixed(1)}%</p>
                        </div>
                    )}

                    {/* Recommendation section with detailed advice */}
                    {mlResponse.recommendation && (
                        <div className="ml-result">
                            <h4>Personalized Recommendations</h4>
                            <p className="result-text">{mlResponse.recommendation.result}</p>
                            <p className="confidence">Confidence: {(mlResponse.recommendation.confidence * 100).toFixed(1)}%</p>
                        </div>
                    )}

                    {/* Exercise recommendations */}
                    {mlResponse.exercises && (
                        <div className="ml-result">
                            <h4>Recommended Exercises</h4>
                            <p className="result-text">{mlResponse.exercises.result}</p>
                            <p className="confidence">Confidence: {(mlResponse.exercises.confidence * 100).toFixed(1)}%</p>
                        </div>
                    )}

                    {/* Equipment suggestions */}
                    {mlResponse.equipment && (
                        <div className="ml-result">
                            <h4>Recommended Equipment</h4>
                            <p className="result-text">{mlResponse.equipment.result}</p>
                            <p className="confidence">Confidence: {(mlResponse.equipment.confidence * 100).toFixed(1)}%</p>
                        </div>
                    )}

                    {/* Diet recommendations */}
                    {mlResponse.diet && (
                        <div className="ml-result">
                            <h4>Dietary Recommendations</h4>
                            <p className="result-text">{mlResponse.diet.result}</p>
                            <p className="confidence">Confidence: {(mlResponse.diet.confidence * 100).toFixed(1)}%</p>
                        </div>
                    )}
                </div>
            )}

            <div className="container">
                <h3>AI Assessment Form</h3>


                {/* form fields */}

                <div className="form">
                    <form onSubmit={handleSubmit} noValidate>

                        <div className="form-row">
                            <label>Hypertension (High Blood Pressure)</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="hypertension"
                                        value="yes"
                                        checked={formData.hypertension === 'yes'}
                                        onChange={handleChange}
                                    />
                                    Yes
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="hypertension"
                                        value="no"
                                        checked={formData.hypertension === 'no'}
                                        onChange={handleChange}
                                    />
                                    No
                                </label>
                            </div>
                        </div>

                        <div className="form-row">
                            <label>Diabetes </label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="diabetes"
                                        value="yes"
                                        checked={formData.diabetes === 'yes'}
                                        onChange={handleChange}
                                    />
                                    Yes
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="diabetes"
                                        value="no"
                                        checked={formData.diabetes === 'no'}
                                        onChange={handleChange}
                                    />
                                    No
                                </label>
                            </div>
                        </div>

                        <div className="form-row">
                            <label>Fitness Goal</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="fitnessGoal"
                                        value="loss"                            // double check with KP on these (weight_loss vs loss)
                                        checked={formData.fitnessGoal === 'loss'}     // double check with KP on these (weight_loss vs loss)
                                        onChange={handleChange}
                                    />
                                    Weight Loss
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="fitnessGoal"
                                        value="gain"                            // double check with KP on these (weight_gain vs gain)
                                        checked={formData.fitnessGoal === 'gain'}     // double check with KP on these (weight_gain vs gain)
                                        onChange={handleChange}
                                    />
                                    Weight Gain
                                </label>
                            </div>
                        </div>

                        <div className="form-row">
                            <label htmlFor="age">Age</label>
                            <input
                                id="age"
                                name="age"
                                type="number"
                                min="1"
                                max="120"
                                value={formData.age}
                                onChange={handleChange}
                                className="form-select"
                                required
                            />
                        </div>

                        <SearchableSelect
                            label="Sex"
                            name="sex"
                            value={formData.sex}
                            options={SEX_OPTIONS}
                            placeholder="Select sex"
                            onChange={handleChange}
                        />

                        <div className="form-row">
                            <label htmlFor="heightFeet">Height</label>
                            <div className="height-inputs">
                                <input
                                    id="heightFeet"
                                    name="heightFeet"
                                    type="number"
                                    min="0"
                                    value={formData.heightFeet}
                                    onChange={handleChange}
                                    className='form-select'
                                    placeholder="Feet"
                                    required
                                />
                                <input
                                    id="heightInches"
                                    name="heightInches"
                                    type="number"
                                    min="0"
                                    value={formData.heightInches}
                                    onChange={handleChange}
                                    className='form-select'
                                    placeholder="Inches"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <label htmlFor="weight">Weight (lb)</label>
                            <input
                                id="weight"
                                name="weight"
                                type="number"
                                min="0"
                                step="any"
                                value={formData.weight}
                                onChange={handleChange}
                                className='form-select'
                                placeholder="e.g., 155"
                                required
                            />
                        </div>


                        <div className="form-actions">
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
                                Calculate
                            </button>
                        </div>

                    </form>

                </div>

            </div>
        </div>
    );
};

export default Calculator
