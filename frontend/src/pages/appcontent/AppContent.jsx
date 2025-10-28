import { useState, useEffect } from 'react';
import './AppContent.css'
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Calculator from '../calculator/Calculator'
import Workout from '../workout/Workout';
import Recipe from '../recipe/Recipe';
import Nutrition from '../nutrition/Nutrition';
import Login from '../login/Login';
import api from '../../api/api' // for fetchProfile api call (api.get)
import { Analytics } from "@vercel/analytics/react"        // vercel analytics




const AppContent = () => {
    const location = useLocation();
    
    //set to fetchdata.data --> access user data by profile.userData."keyname"
    const [profile, setProfile] = useState(null);

    // fetch profile one time

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const fetchResult = await api.get('/user/profile'); // cookie automatically sent
                if (!fetchResult) {
                    console.log("No user found")
                } 
                setProfile(fetchResult.data)
                
            } catch (error) {
                console.log("Error fetching profile: ", error);
            }
        }
        fetchProfile();
    }, []); //only want to run one time, so empty dependency array. if we want to run multiple times on change, put the value to listen to here

    const renderContent = () => {
        switch (location.pathname) {
            case '/calculator':
                return <Calculator />;
            case '/workout':
                return <Workout />;
            case '/recipe':
                return <Recipe />;
            case '/nutrition':
                return <Nutrition />;
            case '/login':
                return <Login />;
            case '/':
                return <Calculator />; // Default to Calculator
            default:
                return <div>404 - Page not found</div>;
        }
    };


    return (
        <div className="app-container">
            <Navbar />
            <main className="content-area">
                {/* display username, incase it is undefined we dont want to display anything*/}
                {profile?.userData?.username && (
                    <h1>Welcome, {profile.userData.username}!</h1> 
                )}
                {renderContent()}
            </main>
            <Analytics/>
        </div>
    );
}

export default AppContent
