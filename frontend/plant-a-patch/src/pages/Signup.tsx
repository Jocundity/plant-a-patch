import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type SignupProps = {
    setIsLoggedIn: (value: boolean) => void;
}

type Location = {
    name: string;
    country: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    latitude: number;
    longitude: number;
}

type FieldErrors = {
    username?: string[];
    password?: string[];
    city?: string[];
    non_field_errors?: string[];
}

function Signup({ setIsLoggedIn }: SignupProps) {
    const [username, setUsername] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Plant a Patch | Sign Up';
    })

    async function searchForLocation(city: string) {
        if (!city.trim()) {
            return; 
        }

        const apiEndpoint = import.meta.env.VITE_API_URL;

        // Fetch location data from Django
        try {
            const response = await fetch(`${apiEndpoint}/locations/?city=${city}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch location data');
            }

            setLocations(data.results || []);
            console.log(data);
            console.log(data.results);

        } catch (error) {
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError(String(error))
            }
        }
    }

    async function handleSignUp(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Check if passwords match
        let password;
        if (password1 == password2) {
            password = password1;
        } else {
            setFieldErrors({ password: ['Passwords do not match'] })
            return;
        }

        // Check if a location is selected
        if (!selectedLocation || selectedLocation.name !== city) {
            setFieldErrors({ city: ['Please select a location from the list'] });
            return;
        }

        // Send data to Django for verification and registration
        const api_endpoint = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${api_endpoint}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, city, country, latitude, longitude})
            });
            const data = await response.json();

            if (!response.ok) {
                setFieldErrors(data);
                throw new Error(data.non_field_errors?.[0] || 'Failed to register user');
            }

            // Store token
            const token = data.token;
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
            <form onSubmit={handleSignUp} className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
                {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="username" className="block mb-2 
                    font-semibold">Username:</label>
                    <input type="text" id="username" name="username" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={username} onChange={(e) => setUsername(e.target.value)}
                     placeholder="Enter your username"
                     required />
                     {fieldErrors.username && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.username[0]}</p>}
                </div>
                <div className="mb-4">
                    <label htmlFor="password1" 
                    className="block mb-2 font-semibold">Password:</label>
                    <input type="password" id="password1" name="password1"
                    className="w-full p-2 rounded-full
                     bg-amber-100 focus:outline-4 focus:outline-emerald-600"
                     value={password1} onChange={(e) => setPassword1(e.target.value)}
                     placeholder="Enter your password"
                      required />
                      <p className="text-slate-500 text-center">(Must be at least 8 characters with one number and one letter)</p>
                      {fieldErrors.password && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.password[0]}</p>}
                </div>
                <div className="mb-4">
                    <label htmlFor="password2" 
                    className="block mb-2 font-semibold">Confirm Password:</label>
                    <input type="password" id="password2" name="password2"
                    className="w-full p-2 rounded-full
                     bg-amber-100 focus:outline-4 focus:outline-emerald-600"
                     value={password2} onChange={(e) => setPassword2(e.target.value)}
                     placeholder="Confirm your password"
                      required />
                </div>
                <div className="mb-4">
                    <label htmlFor="city" className="block mb-2 
                    font-semibold">Where is your garden located?</label>
                    <input type="text" id="city" name="city" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={city} onChange={(e) => {
                        setCity(e.target.value)
                        searchForLocation(e.target.value)
                     }}
                     placeholder="Enter your city (e.g. Glasgow)"
                     required />
                     {fieldErrors.city && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.city[0]}</p>}
                </div>
                {locations.length > 0 && (
                    <div className="mb-4">
                     <ul className="cursor-pointer  max-h-40 overflow-auto">
                        {locations.map((location: Location, index: number) => (
                            <button type="button" key={index} 
                            className=" bg-orange-100 hover:bg-emerald-100
                            transition-colors duration-300 mb-2 p-2 w-full"
                            onClick={() => {
                                setSelectedLocation(location)
                                setCity(location.name)
                                setCountry(location.country)
                                setLatitude(location.latitude)
                                setLongitude(location.longitude)
                                setLocations([])
                            }}>{[location.name, location.country, location.admin1, location.admin2, location.admin3].filter(Boolean).join(", ")}</button>
                        ))}
                     </ul>
                </div>
                )}
                <button type="submit" className="w-full bg-emerald-600
                 text-white p-2 rounded-full hover:bg-emerald-700 
                 transition-colors duration-300 cursor-pointer">Sign Up</button>
            </form>
        </>
    );
}

export default Signup;