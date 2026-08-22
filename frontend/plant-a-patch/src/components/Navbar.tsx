import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

type NavbarProps = {
    isLoggedIn: boolean;
    setIsLoggedIn: (value: boolean) => void;
};

function Navbar({ isLoggedIn, setIsLoggedIn }: NavbarProps) {
    const [showMobileNav, setShowMobileNav] = useState(false);
    
    const navigate = useNavigate();

    async function handleLogout() {
        // Log out the user

        const token = localStorage.getItem('token');
        const apiEndpoint = import.meta.env.VITE_API_URL;

        // Log out of Django backend
        try {
            const response = await fetch(`${apiEndpoint}/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            });

            if (!response.ok) {
                    throw new Error('Logout failed');
                }

        } catch (error) {
            console.error(error);
        }

        // Remove token from local storage and redirect to home page
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/');
    }

    function toggleMobileNav() {
        // Toggle the visibility of the navigation links on mobile/small screens
        setShowMobileNav(!showMobileNav);
    }



    return (
        <header className="relative flex justify-between items-center p-4 bg-emerald-600 text-white">
            <h2 className="text-2xl font-bold">Plant a Patch</h2>
            {/* Mobile Navigation */}
            <button className={`md:hidden text-2xl font-bold cursor-pointer
            transition-all hover:text-orange-300 duration-300
            ${showMobileNav ? 'rotate-180' : 'rotate-0'}`}
            aria-label="Toggle navigation menu"
            onClick={toggleMobileNav}>{showMobileNav ? '×' : '☰'}</button>
            {showMobileNav && (
                <nav className="absolute top-full right-0 md:hidden 
                flex flex-col gap-8 p-4 rounded-b-xl
                 bg-emerald-600 text-white z-10">
                { isLoggedIn ? (
                    <>
                        <NavLink to="/dashboard" 
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Dashboard</NavLink>
                        <NavLink to="/stats"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Stats</NavLink>
                        <NavLink to="/plant-disease-identifier"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Plant Disease Identifier</NavLink>
                        <NavLink to="/chatbot"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Chatbot</NavLink>
                        <NavLink to="/growing-guides"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Growing Guides</NavLink>
                        {isLoggedIn && <button onClick={() => {
                            handleLogout();
                            setShowMobileNav(false);
                        }
                    }
                        className="bg-amber-200 text-emerald-600
                        font-bold p-2 rounded-full hover:bg-amber-100
                        transition-colors duration-300 cursor-pointer">Log Out</button>}
                        
                    </>
                   ) : (
                    <>
                        <NavLink to="/"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                         onClick={() => setShowMobileNav(false)}>Home</NavLink>
                        <NavLink to="/login"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Log In</NavLink>
                        <NavLink to="/signup"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Sign Up</NavLink> 
                    </>
                   )}
            </nav>
            )}
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
                { isLoggedIn ? (
                    <>
                        <NavLink to="/dashboard"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        >Dashboard</NavLink>
                        <NavLink to="/stats"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        >Stats</NavLink>
                        <NavLink to="/plant-disease-identifier"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        >Plant Disease Identifier</NavLink>
                        <NavLink to="/chatbot"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        >Chatbot</NavLink>
                        <NavLink to="/growing-guides"
                        className="transition-colors 
                        hover:text-orange-300 duration-300"
                        onClick={() => setShowMobileNav(false)}>Growing Guides</NavLink>
                        {isLoggedIn && <button onClick={handleLogout}
                        className="bg-amber-200 text-emerald-600
                        font-bold p-2 rounded-full hover:bg-amber-100
                        transition-colors duration-300 cursor-pointer"
                        >Log Out</button>}
                        
                    </>
                   ) : (
                    <>
                        <NavLink to="/"
                        className="transition-colors 
                        hover:text-orange-300 duration-300">Home</NavLink>
                        <NavLink to="/login"
                        className="transition-colors 
                        hover:text-orange-300 duration-300">Log In</NavLink>
                        <NavLink to="/signup"
                        className="transition-colors 
                        hover:text-orange-300 duration-300">Sign Up</NavLink> 
                    </>
                   )}

                
            </nav>
        </header>
        
    );
}

export default Navbar;