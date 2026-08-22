import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type LoginProps = {
    setIsLoggedIn: (value: boolean) => void;
}

function Login({ setIsLoggedIn }: LoginProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Plant a Patch | Log In';
    }, []);

    async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');

        // Send data to Django for verification
        const apiEndpoint = import.meta.env.VITE_API_URL;
        
        try {
            const response = await fetch(`${apiEndpoint}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password})
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token
        const token = data.token
        localStorage.setItem('token', token);
        setIsLoggedIn(true);

        // Redirect to dashboard page
        navigate('/dashboard');

        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error));
            }
        }
    }


    return (
        <>
            <form onSubmit={handleLogin} className="max-w-md mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold mb-4 text-center">Log In</h1>
                {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="username" className="block mb-2 
                    font-semibold">Username:</label>
                    <input type="text" id="username" name="username" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={username} onChange={(e) => setUsername(e.target.value)}
                     required />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" 
                    className="block mb-2 font-semibold">Password:</label>
                    <input type="password" id="password" name="password"
                                    className="w-full p-2 rounded-full
                     bg-amber-100 focus:outline-4 focus:outline-emerald-600"
                     value={password} onChange={(e) => setPassword(e.target.value)}
                      required />
                </div>
                <button type="submit" className="w-full bg-emerald-600
                 text-white p-2 rounded-full hover:bg-emerald-700 
                 transition-colors duration-300 cursor-pointer">Log In</button>
            </form>
        </>
    );
}

export default Login;