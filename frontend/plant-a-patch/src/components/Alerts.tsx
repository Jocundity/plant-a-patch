import { useState, useEffect } from "react";


type AlertsProps = {
    isRainingOn: string;
    setIsRainingOn: (isRainingOn: string) => void;
    isHotOn: string;
    setIsHotOn: (isHotOn: string) => void;
    isFreezingOn: string;
    setIsFreezingOn: (isFreezingOn: string) => void;
    schedulesVersion: number;
    setSchedulesVersion: (version: number) => void;
    cropsVersion: number;
}

type WateringSchedule = {
    id: number;
    patch: number;
    patch_name: string;
    frequency: number;
    last_watered_date: string | null;
    next_watering_date: string | null;
    completed: boolean;
}

type FertilisingSchedule = {
    id: number;
    patch: number;
    patch_name: string;
    frequency: number;
    last_fertilised_date: string | null;
    next_fertilising_date: string | null;
    completed: boolean;
}

type Crop = {
    id: number;
    crop_type: string;
    crop_variety: string;
    planted_date: string;
    estimated_harvest_date: string;
    number_planted: number;
    number_dead: number;
    crop_photo_url: string;
    patch_name: string;

}

function Alerts({isRainingOn, setIsRainingOn, isHotOn, setIsHotOn, isFreezingOn, setIsFreezingOn, schedulesVersion, setSchedulesVersion, cropsVersion}: AlertsProps) {
    const token = localStorage.getItem('token');
    const apiEndpoint = import.meta.env.VITE_API_URL;

    // Watering schedules variables
    const [wateringSchedules, setWateringSchedules] = useState<WateringSchedule[]>([]);
    const [wateringScheduleError, setWateringScheduleError] = useState('');

    // Fertilising schedules variables
    const [fertilisingSchedules, setFertilisingSchedules] = useState<FertilisingSchedule[]>([]);
    const [fertilisingScheduleError, setFertilisingScheduleError] = useState('');

    // Crop variables (use for harvest alerts)
    const [crops, setCrops] = useState<Crop[]>([]);
    const [dismissedCrops, setDismissedCrops] = useState<number[]>([]);
    const [cropsError, setCropsError] = useState('');
    const [season, setSeason] = useState('');

    useEffect(() => {
        if (!token) return;

        async function fetchWateringSchedules() {

            // Fetch watering schedules from Django
            try {
                const response = await fetch(`${apiEndpoint}/watering_schedules/`, {
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch watering schedules');
                }

                if (data.length > 0) {
                    setWateringSchedules(data);
                }

            } catch (error) {
                if (error instanceof Error) {
                    setWateringScheduleError(error.message);
                } else {
                    setWateringScheduleError(String(error));
                }
            }
        }

        async function fetchFertilisingSchedules() {

            // Fetch fertilising schedules from Django
            try {
                const response = await fetch(`${apiEndpoint}/fertilising_schedules/`, {
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch fertilising schedules');
                }

                if (data.length > 0) {
                    setFertilisingSchedules(data);
                }

            } catch (error) {
                if (error instanceof Error) {
                    setFertilisingScheduleError(error.message);
                } else {
                    setFertilisingScheduleError(String(error));
                }
            }
        }

        async function fetchCrops() {

            // Fetch crops from Django
            try {
                const response = await fetch(`${apiEndpoint}/crops/`, {
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch crops');
                }

                if (data.length > 0) {
                    setCrops(data);
                }

            } catch (error) {
                if (error instanceof Error) {
                    setCropsError(error.message);
                } else {
                    setCropsError(String(error));
                }
            }
        }

        fetchWateringSchedules();
        fetchFertilisingSchedules();
        fetchCrops();
    }, [apiEndpoint, token, schedulesVersion, cropsVersion]);

    async function getUserSeason() {
        // Get the season based on the user's location

        // Fetch the user's location from Django
        try {
            const response = await fetch(`${apiEndpoint}/user_info/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to fetch user location');
            }

            const latitude = data.latitude;
            const today = new Date();
            const month = today.getMonth() + 1; // Add 1 to get 1-12

            // Determine the season based on the month and latitude
            let season = '';
            
            // Northern Hemisphere
            if (latitude >= 0) {
                if (month >= 3 && month <= 5) {
                    season = 'Spring';
                } else if (month >= 6 && month <= 8) {
                    season = 'Summer';
                } else if (month >= 9 && month <= 11) {
                    season = 'Autumn';
                } else {
                    season = 'Winter';
                }
            }

            // Southern Hemisphere
            else {
                if (month >= 3 && month <= 5) {
                    season = 'Autumn';
                } else if (month >= 6 && month <= 8) {
                    season = 'Winter';
                } else if (month >= 9 && month <= 11) {
                    season = 'Spring';
                } else {
                    season = 'Summer';
                }
            }

            setSeason(season);
}
    catch (error) {
        if (error instanceof Error) {
            setCropsError(error.message);
        } else {
            setCropsError(String(error));
        }
    }
}

    function dismissHarvestAlert(cropId: number) {
        // Add the crop ID to the dismissed crops list
        setDismissedCrops([...dismissedCrops, cropId]);
    }

    async function markAsWatered(scheduleId: number) {
        // Mark a watering schedule as completed in Django
        try {
            const response = await fetch(`${apiEndpoint}/watering_schedules/${scheduleId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {
                        completed: true,
                    }
                )
            });

            if (!response.ok) {
                throw new Error('Failed to mark as watered');
            }

            // Remove the completed schedule from the list of watering schedules
            setWateringSchedules((currentSchedules) => currentSchedules.filter((schedule) => schedule.id !== scheduleId));

            // Trigger a re-fetch of the watering schedule when on the patch page to update the next waetering date
            setSchedulesVersion(schedulesVersion + 1);
        }

        catch (error) {
            if (error instanceof Error) {
                setWateringScheduleError(error.message);
            } else {
                setWateringScheduleError(String(error));
            }
        }
    }

    async function markAsFertilised(scheduleId: number) {
        // Mark a fertilising schedule as completed in Django
        try {
            const response = await fetch(`${apiEndpoint}/fertilising_schedules/${scheduleId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {
                        completed: true,
                    }
                )
            });

            if (!response.ok) {
                throw new Error('Failed to mark as fertilised');
            }

            // Remove the completed schedule from the list of fertilising schedules
            setFertilisingSchedules((currentSchedules) => currentSchedules.filter((schedule) => schedule.id !== scheduleId));

            // Trigger a re-fetch of the fertilising schedule when on the patch page to update the next fertilising date
            setSchedulesVersion(schedulesVersion + 1);
        }

        catch (error) {
            if (error instanceof Error) {
                setFertilisingScheduleError(error.message);
            } else {
                setFertilisingScheduleError(String(error));
            }
        }
    }

    // Filter watering and fertilising schedules to find those that are due
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueWateringSchedules = wateringSchedules.filter((schedule) => {
        if (!schedule.next_watering_date) {
            return false;
        }
        const nextWateringDate = new Date(schedule.next_watering_date);
        nextWateringDate.setHours(0, 0, 0, 0);
        return nextWateringDate <= today;
    });

    const dueFertilisingSchedules = fertilisingSchedules.filter((schedule) => {
        if (!schedule.next_fertilising_date) {
            return false;
        }
        const nextFertilisingDate = new Date(schedule.next_fertilising_date);
        nextFertilisingDate.setHours(0, 0, 0, 0);
        return nextFertilisingDate <= today;
    });

    // Filter crops to find those that are ready for harvesting
    getUserSeason();
    const dueHarvestCrops = crops.filter((crop) => {
        const estimatedHarvestDate = new Date(crop.estimated_harvest_date);
        estimatedHarvestDate.setHours(0, 0, 0, 0);

        // Filter out crops that have had their alerts dismissed
        if (dismissedCrops.includes(crop.id)) {
            return false;
        }
        
        // Check if the harvest date is a season and that it matches the current season
        if (isNaN(estimatedHarvestDate.getTime()) && season === crop.estimated_harvest_date) {
            return true;
        }

        // Check if the harvest date is today or earlier
        if (!isNaN(estimatedHarvestDate.getTime()) && estimatedHarvestDate <= today) {
            return true;
        }

        // Filter out all other crops
        return false;
    });


    const hasAnyAlerts = isRainingOn || isHotOn || isFreezingOn || wateringScheduleError || dueWateringSchedules.length > 0 || fertilisingScheduleError || dueFertilisingSchedules.length > 0;
    
    // Don't render if there are no alerts
    if (!hasAnyAlerts) {
        return null; 
    }

    return (
        <div className="text-amber-100 font-bold shadow-lg">
            {isRainingOn && (
                <div className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-blue-500 px-4 py-2">
                    <p className="flex-1 text-center">{isRainingOn}</p>
                    <button onClick={() => setIsRainingOn('')}
                    className="text-amber-100 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Close rainy weather alert">×</button>
                </div>
            )}
            {isHotOn && (
                <div className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-red-500 px-4 py-2">
                    <p className="flex-1 text-center">{isHotOn}</p>
                    <button onClick={() => setIsHotOn('')}
                    className="text-amber-100 hover:text-orange-300
                     font-extrabold text-xl px-2 cursor-pointer"
                     aria-label="Close hot weather alert">×</button>
                </div>
            )}
            {isFreezingOn && (
                <div className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-cyan-500 px-4 py-2">
                    <p className="flex-1 text-center">{isFreezingOn}</p>
                    <button onClick={() => setIsFreezingOn('')}
                    className="text-amber-100 hover:text-orange-300
                     font-extrabold text-xl px-2 cursor-pointer"
                     aria-label="Close freezing weather alert">×</button>
                </div>
            )}


            {cropsError && (
                <div className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-purple-500 px-4 py-2">
                    <p className="flex-1 text-center text-red-500 font-bold">{cropsError}</p>
                    <button onClick={() => setCropsError('')}
                    className="text-amber-100 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Close failed to fetch crops alert">×</button>
                </div>
            )}
            {dueHarvestCrops.length > 0 && (
                dueHarvestCrops.map((crop) => (
                        <div key={crop.id} className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-purple-500 px-4 py-2">
                        <p className="flex-1 text-center">
                            {`Check your ${crop.crop_type} plants in ${crop.patch_name}. They might be ready for harvesting!`}</p>
                            <button onClick={() => dismissHarvestAlert(crop.id)}
                    className="text-amber-100 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Close harvest alert">×</button>
                    </div>
                ))
            )}

            
            {wateringScheduleError && (
                <div className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-sky-500 px-4 py-2">
                    <p className="flex-1 text-center text-red-500 font-bold">{wateringScheduleError}</p>
                    <button onClick={() => setWateringScheduleError('')}
                    className="text-amber-100 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Close failed to fetch watering schedule alert">×</button>
                </div>
            )}
            {dueWateringSchedules.length > 0 && (
                dueWateringSchedules.map((schedule) => (
                    <div key={schedule.id} className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-sky-500 px-4 py-2">
                        <p className="flex-1 text-center">
                            {`${schedule.patch_name} is due for watering!`}</p>
                            <button onClick={() => markAsWatered(schedule.id)}
                            className="text-amber-100 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Mark patch as watered and close watering alert">Mark As Watered</button>
                    </div>
                ))
            )}


            {fertilisingScheduleError && (
                <div className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-taupe-500 px-4 py-2">
                    <p className="flex-1 text-center text-red-500 font-bold">{wateringScheduleError}</p>
                    <button onClick={() => setFertilisingScheduleError('')}
                    className="text-amber-100 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Close failed to fetch fertilising schedule alert">×</button>
                </div>
            )}
            {dueFertilisingSchedules.length > 0 && (
                dueFertilisingSchedules.map((schedule) => (
                    <div key={schedule.id} className="flex justify-between items-center gap-2 w-full border-y border-amber-100 bg-taupe-500 px-4 py-2">
                        <p className="flex-1 text-center">
                            {`${schedule.patch_name} is due for fertilising!`}</p>
                            <button onClick={() => markAsFertilised(schedule.id)}
                            className="text-amber-100 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Mark patch as fertilised and close fertilising alert">Mark As Fertilised</button>
                    </div>
                ))
            )}
            
        </div>
    );
}

export default Alerts;