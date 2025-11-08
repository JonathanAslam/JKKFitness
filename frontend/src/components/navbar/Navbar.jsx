import { useEffect, useState } from 'react'
import './Navbar.css'
import api from '../../api/api'


const Navbar = ({ onNavigate, currentPage }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // fetch user, this is how we will know weather to display a signout or login button
        const fetchUser = async () => {
            try {
                const fetchResult = await api.get('/user/profile/');
                //if the fetch works, then setIsLoggedIn to true
                if (fetchResult) {
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.log("Error fetching user: ", error) // dont use error since this will be ran many times
                setIsLoggedIn(false); // Explicitly set to false if fetch fails
            }


        }
        fetchUser();
    }, []);

    const handleSignOut = async () => {
        try {
            await api.post('/auth/logout');
            setIsLoggedIn(false);
            alert('Logged out successfully!');
            window.location.reload(); // force reload page here to remove user data which was previously displayed
            onNavigate('login');   // Switch to login view
        } catch (error) {
            alert('Error logging out: ', error);
        }
    }

    return (
        <div className='navbar-list-container'>
            {/* title */}
            <h1>Fitness Application</h1>
            {/* links */}
            <div className='navbar'>
                <ul className='navbar-list'>
                    <li>
                        <button
                            onClick={() => onNavigate('calculator')}
                            className={'navbar-link' + (currentPage === 'calculator' ? ' active' : '')}
                        >
                            Calculator
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => onNavigate('workout')}
                            className={'navbar-link' + (currentPage === 'workout' ? ' active' : '')}
                        >
                            Workout Finder
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => onNavigate('recipe')}
                            className={'navbar-link' + (currentPage === 'recipe' ? ' active' : '')}
                        >
                            Recipe Ideas
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => onNavigate('nutrition')}
                            className={'navbar-link' + (currentPage === 'nutrition' ? ' active' : '')}
                        >
                            Nutrition Facts
                        </button>
                    </li>
                </ul>

                {/* display Login vs SignOut depending on if user is logged in or not */}
                {isLoggedIn ? (
                    // is logged in --> show signout
                    <div className="navbar-profile">
                        <button onClick={handleSignOut} className='navbar-login-link'>Sign Out</button>
                    </div>
                ) : (
                    // is not logged in --> show login
                    <div className="navbar-profile">
                        <button onClick={() => onNavigate('login')} className='navbar-login-link'>Login</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Navbar
