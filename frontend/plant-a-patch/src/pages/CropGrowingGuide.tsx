import ReactMarkdown from "react-markdown";

import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

function CropGrowingGuide() {
    const {crop_type} = useParams<{crop_type: string}>();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [growingGuide, setGrowingGuide] = useState("");
    const [cropPhotoURL, setCropPhotoURL] = useState("");

    useEffect(() => {
        if (crop_type) {
            document.title = `Plant a Patch | ${crop_type.charAt(0).toUpperCase() + crop_type.slice(1)} Growing Guide`;
        } else {
            document.title = 'Plant a Patch | Growing Guide';
        }
        
    }, [crop_type]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const apiEndpoint = import.meta.env.VITE_API_URL;

        async function fetchCropPhoto() {
            // Fetch the crop photo URL for the selected crop from Django
            try {
                const response = await fetch(`${apiEndpoint}/crop_harvest_times/?crop_type=${crop_type}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Token ${token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch crop photo`);
                }

                const data = await response.json();
                if (data.length > 0) {
                    setCropPhotoURL(data[0].crop_photo_url);
                } else {
                    setCropPhotoURL("");
                }
            }
            catch {
                setCropPhotoURL("");
            }
        }

        async function fetchGrowingGuide() {
            // Fetch the growing guide for the selected crop from Django
            try {
                const response = await fetch(`${apiEndpoint}/growing_guides/?crop=${crop_type}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Token ${token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch growing guide`);
                }

                const data = await response.json();
                setError("");
                setGrowingGuide(data.guide || "No growing guide available");
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

        fetchCropPhoto();
        fetchGrowingGuide();
    }, [crop_type])

    return (
        <>
            <div className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold mb-4 text-center">{crop_type} Growing Guide</h1>
                {cropPhotoURL && (
                    <div className="flex justify-center mb-4">
                        <img key={crop_type} src={cropPhotoURL} alt={`${crop_type} photo`} className="w-full object-cover rounded-lg" />
                    </div>
                )}
                {isLoading && <p className="text-center motion-safe:animate-pulse">Loading...</p>}
                {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
                {growingGuide && (
    <div className="bg-orange-100 p-4 rounded-lg text-left">
        <h2 className="text-xl text-center font-semibold mb-4">Care Instructions</h2>
        <div className="whitespace-pre-line text-center">
            <ReactMarkdown>{growingGuide.replace(/\\n/g, '\n')}</ReactMarkdown>
        </div>
    </div>
)}
            </div>
        </>
    );
}

export default CropGrowingGuide;