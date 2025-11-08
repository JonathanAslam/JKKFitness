import { useState, useEffect } from 'react';
import './AppContent.css'
import Navbar from '../../components/navbar/Navbar';
import Calculator from '../calculator/Calculator'
import Workout from '../workout/Workout';
import Recipe from '../recipe/Recipe';
import Nutrition from '../nutrition/Nutrition';
import Login from '../login/Login';
import api from '../../api/api' // for fetchProfile api call (api.get)
import { Analytics } from "@vercel/analytics/react"        // vercel analytics




const AppContent = () => {
    const [currentPage, setCurrentPage] = useState('calculator'); // Default page
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
        switch (currentPage) {

            // for all pages, pass the fetched user profile so the pages can access the profile info such as userData._id, make sure
            case 'calculator':
                return <Calculator profile={profile}/>;
            case 'workout':
                return <Workout />;
            case 'recipe':
                return <Recipe />;
            case 'nutrition':
                return <Nutrition />;
            case 'login':
                return <Login />;
            default:
                return <Calculator />; // Default to Calculator, acts as the home page
        }
    };

    return (
        <div className="app-container">
            {/* currentPage passed to navbar component defining which page is going to be displayed. Should prevent loading issues with page changes and reloads on render + vercel hosting */}
            <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
            <main className="content-area">
                {/* display username, incase it is undefined we dont want to display anything*/}
                {profile?.userData?.username && (
                    <h1>Welcome, {profile.userData.username}!</h1>
                )}
                {renderContent()}
            </main>
            <Analytics />
        </div>
    );
}

export default AppContent
