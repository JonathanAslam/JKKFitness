import React, { useEffect, useState } from 'react';
import '../pagestyle/FormStyle.css';
import api from '../../api/api'

// accept profile from AppContent.jsx
const Calculator = () => {
    // State for form values
    const [formData, setFormData] = useState({
        units: 'metric',
        age: 25,
        sex: 'female',
        height: '',
        weight: '',
        // new fields for ML model
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

            // send data to flask api and store result, display results to user. this uses all the updatedData fields
            const flaskModelResult = await api.post("/ml/predict", { data: updatedFormData }); // node backend requests data (req.body.data), so make sure to send the form data as data
            if (flaskModelResult) {
                alert("sent data to model");
                // flaskModelResult.data = { prediction: { result: "mock_predicition", confidence: 0.95 } }, so set the mlResponse to flaskModelResult.data.prediction
                setMlResponse(flaskModelResult.data.prediction);
            }
        } catch (error) {
            alert("Error while saving form data to database");
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
            bmi: '',
            hypertension: '',
            fitnessGoal: '',
            // fitnessType: ''
        });
    };

    return (
        <div className="container">
            <h3>Calculate BMI</h3>
            <h4>BMI: {formData.bmi}</h4>


            {/* display result from ml, currently the app.py returns: 
                    prediction = {"result": "mock_predicition", "confidence": 0.95}
                
                -- therfore we need to access mlResponse.result and mlResponse.confidence to display the information
            */}
            {mlResponse && (
                <div className="ml-result">
                    <h4>Model Prediction: {mlResponse.result}</h4>
                    <p>Confidence: {(mlResponse.confidence * 100).toFixed(1)}%</p>
                </div>
            )}

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

                    {/* <div className="form-row">
                        <label>Fitness Type</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="fitnessType"
                                    value="muscular"
                                    checked={formData.fitnessType === 'muscular'}
                                    onChange={handleChange}
                                />
                                Muscular Fitness
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="fitnessType"
                                    value="cardiovascular"
                                    checked={formData.fitnessType === 'cardiovascular'}
                                    onChange={handleChange}
                                />
                                Cardiovascular Fitness
                            </label>
                        </div>
                    </div> */}

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
    );
};

export default Calculator
