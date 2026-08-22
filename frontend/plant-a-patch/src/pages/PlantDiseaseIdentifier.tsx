import ReactMarkdown from 'react-markdown';

import { useState, useEffect } from 'react';

type prediction = {
    crop: string;
    disease: string;
    confidence: number;
    treatment: string;
}

function PlantDiseaseIdentifier() {
    const [error, setError] = useState('');
    const [selectedCrop, setSelectedCrop] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<prediction[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = 'Plant a Patch | Plant Disease Identifier';
    }, [])

    async function handleIdentifyDisease(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const token = localStorage.getItem('token');
        const apiEndpoint = import.meta.env.VITE_API_URL;

        const formData = new FormData();
        formData.append('selected_crop', selectedCrop);
        if (image) formData.append('image', image);

        // Send data to Django for disease identification
        try {
            const response = await fetch(`${apiEndpoint}/identify_disease/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            setPredictions(data.predictions);

            if (!response.ok) {
                throw new Error('Failed to identify disease.')
            }
        }
        catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error));
            }
        } finally {
            setIsLoading(false);
        }
    }


    return (
         <>
            <form onSubmit={handleIdentifyDisease} className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold text-center">Plant Disease Identifier</h1>
                <p className="text-center mb-4">Upload a photo of an infected leaf for diagnosis and treatment.</p>
                {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <div className="mb-2 flex justify-center">
                        {imagePreview && <img src={imagePreview} alt="Sick Plant Image" className=" max-w-xs sm:max-w-sm object-cover rounded-lg" />}
                    </div>
                    <label htmlFor="image" className="block mb-2 
                    font-semibold">Plant Image <span className="text-slate-500 font-normal italic">(jpg, jpeg, or png)</span>:</label>
                    <input type="file" id="image" name="image" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600 
                     file:cursor-pointer file:bg-emerald-600 
                    hover:file:bg-emerald-700 file:text-white file:rounded-full
                     file:px-4 file:border-none transition-colors duration-300 
                     cursor-pointer" 
                     onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];

                            const maxFileSize = 10485760; // 10MB
                                        if (file.size > maxFileSize) {
                                            alert('File size exceeds the maximum limit of 10MB. Please choose a smaller file.');
                                            return;
                                        }

                            setImage(file);
                            setImagePreview(URL.createObjectURL(file));
                        }
                     }}
                     accept=".jpg, .jpeg, .png"
                      required />
                </div>
                <div className="mb-4">
                    <label htmlFor="selected_crop" className="block mb-2 
                    font-semibold">Crop Type <span className="text-slate-500 font-normal italic">(only currently supported crops listed)</span>:</label>
                    <select id="selected_crop" name="selected_crop" 
                    className="w-full px-4 py-2 appearance-none rounded-full cursor-pointer bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}
                     required >
                        <option value="">Select a crop</option>
                        <option value="Apple">Apple</option>
                        <option value="Bell Pepper">Bell Pepper</option>
                        <option value="Blueberry">Blueberry</option>
                        <option value="Cherry">Cherry</option>
                        <option value="Corn">Corn</option>
                        <option value="Grape">Grape</option>
                        <option value="Orange">Orange</option>
                        <option value="Peach">Peach</option>
                        <option value="Potato">Potato</option>
                        <option value="Raspberry">Raspberry</option>
                        <option value="Soybean">Soybean</option>
                        <option value="Squash">Squash</option>
                        <option value="Strawberry">Strawberry</option>
                        <option value="Tomato">Tomato</option>
                     </select>
                </div>
                <button type="submit" className="w-full bg-emerald-600
                 text-white p-2 rounded-full hover:bg-emerald-700 
                 transition-colors duration-300 cursor-pointer">Identify Disease</button>
            </form>
            {isLoading && (
                <div className="max-w-lg mx-auto mt-8 p-4 rounded-xl shadow-lg bg-white">
                    <p className="text-center motion-safe:animate-pulse">Loading...</p>
                </div>
            )}
            {!isLoading && predictions && (
                <div className="max-w-lg mx-auto mt-8 p-4 rounded-xl shadow-lg bg-white">
                    <h2 className="text-xl font-bold text-center mb-4">Diagnosis</h2>
                    {predictions.map((prediction, index) => (
                        <div key={index} className="mb-4 p-3 bg-orange-100 rounded-lg text-center">
                            <p className="font-semibold">Disease: <span className="font-normal">{prediction.disease}</span></p>
                            <p className="font-semibold">Confidence: <span className="font-normal">{prediction.confidence}%</span></p>
                            {prediction.confidence < 50 && <p className="font-bold text-red-500">Low Confidence - This prediction might be incorrect.</p>}
                            {/* Google Gemini Generated Code */}
                            <div className="font-semibold mt-4">
                            Treatment: {' '}
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => 
                                        <span className="font-normal block my-2">
                                            {children}</span>
                                }}
                            >
                                {prediction.treatment}
                        </ReactMarkdown>
                        </div>
                        {/* End Google Gemini Generated Code */}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export default PlantDiseaseIdentifier;