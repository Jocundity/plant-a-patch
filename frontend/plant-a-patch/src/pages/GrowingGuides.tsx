import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

type Crop = {
    crop_type: string;
    crop_photo_url: string;
}

function GrowingGuides() {
    const [error, setError] = useState("");
    const [crops, setCrops] = useState<Crop[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = 'Plant a Patch | Growing Guides';
    }, []);

    useEffect(() => {
        async function fetchCrops() {
            // Fetch the crops currently in the database from Django
            try {
                const token = localStorage.getItem("token");
                const apiEndpoint = import.meta.env.VITE_API_URL;

                const response = await fetch(`${apiEndpoint}/crop_harvest_times/`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Token ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch crops`);
                }

                const data = await response.json();

                const databaseCrops = []
                for (const crop of data) {
                    databaseCrops.push({
                        crop_type: crop.crop_type,
                        crop_photo_url: crop.crop_photo_url
                    });
                }

                setCrops(databaseCrops);
            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(String(error));
                }
            }
            finally {
                setIsLoading(false);
            }
        }

        fetchCrops();
    }, [])


    return (
        <>
            <div className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold mb-4 text-center">Growing Guides</h1>
                {isLoading && <p className="text-center motion-safe:animate-pulse">Loading...</p>}
                {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
                {crops.length > 0 && (
                    <div>
                        {crops.map((crop) => (
                            <Link key={crop.crop_type} to={`/growing-guides/${crop.crop_type}`}>
                                <div
                            className="flex flex-row justify-start
                            items-center gap-4 mb-4 bg-orange-100
                             hover:bg-emerald-100 transition-colors duration-300
                              p-4 rounded-lg">
                                <div>
                                    <img src={crop.crop_photo_url} alt={crop.crop_photo_url} className="max-w-36 object-cover rounded-lg" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-center">{crop.crop_type} Growing Guide</h2>
                                </div>
                            </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default GrowingGuides;