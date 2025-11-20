import React, { useEffect, useState } from 'react';
import '../pagestyle/FormStyle.css';
import api from '../../api/api'

// accept profile from AppContent.jsx
const Calculator = () => {
    // State for form values
    const [formData, setFormData] = useState({
        units: '',
        age: 0,
        sex: '',
        height: '',
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
                    setFormData(prev => ({ ...prev, ...fetchedResult.data }));
                }
            } catch (error) {
                return; // dont alert if no user, just ignore and do nothing
            }
        };

        fetchPreviousData();
    }, []); //only want to run one time, so empty dependency array. if we want to run multiple times on change, put the value to listen to here


    const calculateBMI = ({ units, height, weight }) => {
        const tempHeight = Number(height);
        const tempWeight = Number(weight);
        // check for any 0 input, non numbers, negative numbers, invalid if so
        if (!tempHeight || !tempWeight || tempHeight <= 0 || tempWeight <= 0 || Number.isNaN(tempHeight) || Number.isNaN(tempWeight)) return null;

        if (units === 'imperial') {
            // Impreial formula: 703 * weight(lb) / height(in)^2
            const tempBMI = 703 * tempWeight / (tempHeight ** 2);
            return Math.round(tempBMI * 10) / 10; // 1 decimal place
            // 1 decimal place
        } else {
            // Metric formula: weight(kg) / (heigh()^2). remember height is in cm on the form so divide by 100
            const tempBMI = tempWeight / ((tempHeight / 100) ** 2);
            return Math.round(tempBMI * 10) / 10; // 1 decimal place
        }
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
        const updatedFormData = {
            ...formData,
            bmi: newBMI ?? formData.bmi,   // update bmi, if null just keep formData.bmi
        }

        setFormData(updatedFormData);

        console.log("Updated formData before submit:", updatedFormData);

        // fix all values we want saved to payload const and then save that to db, filtering out unneeded information for mongodb
        const payload = {
            units: updatedFormData.units,
            age: Number(updatedFormData.age),
            sex: updatedFormData.sex,
            height: Number(updatedFormData.height),
            weight: Number(updatedFormData.weight),
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
            units: 'metric',
            age: 25,
            sex: 'female',
            height: '',
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
                            <label>Units</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="units"
                                        value="metric"
                                        checked={formData.units === 'metric'}
                                        onChange={handleChange}
                                    />
                                    Metric (cm, kgs)
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="units"
                                        value="imperial"
                                        checked={formData.units === 'imperial'}
                                        onChange={handleChange}
                                    />
                                    Imperial (in, lbs)
                                </label>
                            </div>
                        </div>

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

                        <div className="form-row">
                            <label htmlFor="sex">Sex</label>
                            <select
                                id="sex"
                                name="sex"
                                value={formData.sex}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <label htmlFor="height">Height</label>
                            <div className="input-with-unit">
                                <input
                                    id="height"
                                    name="height"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={formData.height}
                                    onChange={handleChange}
                                    className='form-select'
                                    placeholder="e.g., 172"
                                    required
                                />
                                <span className="unit-label">
                                    {formData.units === 'metric' ? 'cm' : 'in'}
                                </span>
                            </div>
                        </div>

                        <div className="form-row">
                            <label htmlFor="weight">Weight</label>
                            <div className="input-with-unit">
                                <input
                                    id="weight"
                                    name="weight"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    className='form-select'
                                    placeholder="e.g., 68"
                                    required
                                />
                                <span className="unit-label">
                                    {formData.units === 'metric' ? 'kg' : 'lb'}
                                </span>
                            </div>
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

