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

// accept profile from AppContent.jsx
const Calculator = () => {
    // State for form values
    const [formData, setFormData] = useState({
        units: 'imperial',
        age: '',
        sex: '',
        heightFeet: '',
        heightInches: '',
        heightCm: '',
        weightLbs: '',
        weightKg: '',
        diabetes: '',
        bmi: '',
        hypertension: '',
        fitnessGoal: '',
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
                    const heightCm = saved.units === 'metric'
                        ? toNumber(saved.height)
                        : totalInches != null ? convertInchesToCm(totalInches) : null;
                    const weightKg = saved.units === 'metric'
                        ? toNumber(saved.weight)
                        : weightLbs != null ? convertLbsToKg(weightLbs) : null;
                    setFormData(prev => ({
                        ...prev,
                        units: saved.units || 'imperial',
                        age: saved.age != null ? String(saved.age) : prev.age,
                        sex: saved.sex || prev.sex || '',
                        heightFeet: feet ?? '',
                        heightInches: inches ?? '',
                        heightCm: heightCm != null ? formatMeasure(heightCm) : '',
                        weightLbs: weightLbs != null ? formatMeasure(weightLbs) : '',
                        weightKg: weightKg != null ? formatMeasure(weightKg) : '',
                    }));
                }
            } catch (error) {
                console.debug('No saved measurements available', error);
                return; // dont alert if no user, just ignore and do nothing
            }
        };

        fetchPreviousData();
    }, []); //only want to run one time, so empty dependency array. if we want to run multiple times on change, put the value to listen to here


    const calculateBMI = ({ units, heightFeet, heightInches, heightCm, weightLbs, weightKg }) => {
        if (units === 'imperial') {
            const totalInches = totalInchesFromInputs(heightFeet, heightInches);
            const pounds = toNumber(weightLbs);
            if (!totalInches || !pounds) return null;
            const bmi = 703 * pounds / (totalInches ** 2);
            return Math.round(bmi * 10) / 10;
        }
        const cm = toNumber(heightCm);
        const kg = toNumber(weightKg);
        if (!cm || !kg) return null;
        const bmi = kg / ((cm / 100) ** 2);
        return Math.round(bmi * 10) / 10;
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'heightFeet' || name === 'heightInches') {
                const nextFeet = name === 'heightFeet' ? value : prev.heightFeet;
                const nextInches = name === 'heightInches' ? value : prev.heightInches;
                const totalInches = totalInchesFromInputs(nextFeet, nextInches);
                const heightCm = totalInches != null ? formatMeasure(convertInchesToCm(totalInches)) : '';
                return {
                    ...prev,
                    [name]: value,
                    heightCm,
                };
            }
            if (name === 'heightCm') {
                const cmValue = toNumber(value);
                const inchesValue = cmValue != null ? convertCmToInches(cmValue) : null;
                const { feet, inches } = toFeetInches(inchesValue);
                return {
                    ...prev,
                    heightCm: value,
                    heightFeet: feet ?? '',
                    heightInches: inches ?? '',
                };
            }
            if (name === 'weightLbs') {
                const kgValue = convertLbsToKg(value);
                return {
                    ...prev,
                    weightLbs: value,
                    weightKg: kgValue != null ? formatMeasure(kgValue) : '',
                };
            }
            if (name === 'weightKg') {
                const lbsValue = convertWeightToLbs(value, 'metric');
                return {
                    ...prev,
                    weightKg: value,
                    weightLbs: lbsValue != null ? formatMeasure(lbsValue) : '',
                };
            }
            if (name === 'units') {
                return {
                    ...prev,
                    units: value,
                };
            }
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newBMI = calculateBMI(formData);

        const totalInches = totalInchesFromInputs(formData.heightFeet, formData.heightInches);
        const heightValue = formData.units === 'imperial'
            ? totalInches
            : toNumber(formData.heightCm);
        const weightValue = formData.units === 'imperial'
            ? toNumber(formData.weightLbs)
            : toNumber(formData.weightKg);

        if (!heightValue || !weightValue) {
            alert("Please provide valid height and weight before calculating.");
            return;
        }

        const updatedFormData = {
            ...formData,
            height: heightValue,
            weight: weightValue,
            bmi: newBMI ?? formData.bmi,
        };

        setFormData(prev => ({ ...prev, bmi: updatedFormData.bmi }));

        console.log("Updated formData before submit:", updatedFormData);

        // fix all values we want saved to payload const and then save that to db, filtering out unneeded information for mongodb
        const payload = {
            units: formData.units,
            age: Number(updatedFormData.age),
            sex: updatedFormData.sex,
            height: updatedFormData.height,
            weight: updatedFormData.weight,
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
            sex: '',
            heightFeet: '',
            heightInches: '',
            heightCm: '',
            weightLbs: '',
            weightKg: '',
            diabetes: '',
            bmi: '',
            hypertension: '',
            fitnessGoal: '',
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
                            <label>Units</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="units"
                                        value="imperial"
                                        checked={formData.units === 'imperial'}
                                        onChange={handleChange}
                                    />
                                    Imperial (ft, lb)
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="units"
                                        value="metric"
                                        checked={formData.units === 'metric'}
                                        onChange={handleChange}
                                    />
                                    Metric (cm, kg)
                                </label>
                            </div>
                        </div>

                        {formData.units === 'imperial' ? (
                            <div className="form-row">
                                <label htmlFor="heightFeet">Height (ft/in)</label>
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
                        ) : (
                            <div className="form-row">
                                <label htmlFor="heightCm">Height (cm)</label>
                                <input
                                    id="heightCm"
                                    name="heightCm"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={formData.heightCm}
                                    onChange={handleChange}
                                    className='form-select'
                                    placeholder="e.g., 172"
                                    required
                                />
                            </div>
                        )}

                        {formData.units === 'imperial' ? (
                            <div className="form-row">
                                <label htmlFor="weightLbs">Weight (lb)</label>
                                <input
                                    id="weightLbs"
                                    name="weightLbs"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={formData.weightLbs}
                                    onChange={handleChange}
                                    className='form-select'
                                    placeholder="e.g., 155"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="form-row">
                                <label htmlFor="weightKg">Weight (kg)</label>
                                <input
                                    id="weightKg"
                                    name="weightKg"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={formData.weightKg}
                                    onChange={handleChange}
                                    className='form-select'
                                    placeholder="e.g., 70.5"
                                    required
                                />
                            </div>
                        )}


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
