import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './Navbar.css'
import api from '../../api/api'


const Navbar = () => {
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
            // force reload page here
            window.location.href = '/login';   //navigate to login page
            // set user isLoggedIn to false
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
                        <NavLink
                            to='/calculator'
                            end
                            className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}
                        >
                            Calculator
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to='/workout'
                            end
                            className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}

                        >
                            Workout Finder
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to='/recipe'
                            end
                            className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}
                        >
                            Recipe Ideas
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to='/nutrition'
                            end
                            className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}
                        >
                            Nutrition Facts
                        </NavLink>
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
                        <NavLink to='/login' className='navbar-login-link'>Login</NavLink>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Navbar
