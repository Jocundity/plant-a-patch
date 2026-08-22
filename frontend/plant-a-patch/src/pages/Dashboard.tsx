import Weather from '../components/Weather';
import ConfirmDelete from '../components/ConfirmDelete';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

type DashboardProps = {
    setPatchId: (id: number) => void;
    setIsRainingOn: (isRainingOn: string) => void;
    setIsHotOn: (isHotOn: string) => void;
    setIsFreezingOn: (isFreezingOn: string) => void;
    setSchedulesVersion: React.Dispatch<React.SetStateAction<number>>;
    setCropsVersion: React.Dispatch<React.SetStateAction<number>>;
}

type Patch = {
    id: number;
    patch_name: string;
    start_date: string;
    size?: string;
    location?: string;
    layout?: string;
    layout_url?: string;
}

function Dashboard({setPatchId, setIsRainingOn, setIsHotOn, setIsFreezingOn, setSchedulesVersion, setCropsVersion }: DashboardProps) {
    const token = localStorage.getItem('token');
    const apiEndpoint = import.meta.env.VITE_API_URL;
    const [patches, setPatches] = useState<Patch[]>([]);
    const [patchToDelete, setPatchToDelete] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
  

    useEffect(() => {
        document.title = 'Plant a Patch | Dashboard';
    }, []);

    // Fetch patches from Django when the the component mounts
    useEffect(() => {
        async function getPatches() {
            try {
                const response = await fetch(`${apiEndpoint}/patches/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch patches')
                }

                setPatches(data);
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
        getPatches();
    }, [apiEndpoint, token]);

    async function deletePatch(id: number) {
        // Delete a patch from Django if the user confirms the deletion
            try {
                const response = await fetch(`${apiEndpoint}/patches/${id}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                });

                if (response.ok) {
                    setPatches(patches.filter((patch) => patch.id !== id));
                } else {
                    throw new Error('Failed to delete patch');
                }

                // Update the schedules version to get rid of any watering/fertilising alerts for this patch
                setSchedulesVersion((prevVersion) => prevVersion + 1);

                // Update the crops version to get rid of any harvest alerts for this patch
                setCropsVersion((prevVersion) => prevVersion + 1);

            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(String(error));
                }
            }
        }

    return (
        <>
            <h1 className="text-2xl font-bold text-center">Dashboard</h1>
            <Weather setIsRainingOn={setIsRainingOn} setIsHotOn={setIsHotOn} setIsFreezingOn={setIsFreezingOn} />
            <div className="flex gap-4 justify-between items-center mb-4 mt-8">
                <h2 className="text-xl font-bold text-center">Patches</h2>
                <Link to="/createpatch" className="text-amber-200 bg-emerald-600
                        font-bold text-xl p-2 rounded-full hover:bg-emerald-700
                        transition-colors duration-300">Create a Patch</Link>
            </div>
            {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
            <div className="flex flex-wrap gap-4 justify-center mb-4 mt-8">
                {isLoading && <p className="text-center motion-safe:animate-pulse">Loading patches...</p>}
                {!isLoading && patches.length === 0 && !error && <p className="text-center">No patches found. Click the button to create your first patch! </p>}
                {patches.map((patch) => (
                    <div key={patch.id} className="bg-white p-4 rounded-xl shadow-lg text-center w-xl flex sm:flex-row sm:justify-center flex-col gap-4 items-center ">
                    {patch.layout_url && (
                        <div>
                        <img src={patch.layout_url} alt="Patch Layout" className=" max-w-xs sm:max-w-sm object-cover rounded-lg" />
                    </div>
                    )}
                    <div>
                        <Link to={`/patch/${patch.id}`} onClick={() => setPatchId(patch.id)}
                        className="text-xl font-bold 
                    text-emerald-600 hover:text-emerald-700 
                    transition-colors duration-300
                    underline decoration-orange-300 decoration-2 
                    decoration-wavy underline-offset-5 mb-4">{patch.patch_name}</Link>
                    <p className="mt-2"><span className="font-semibold">Start Date:</span> {new Date(patch.start_date).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}</p>
                    <p><span className="font-semibold">Size:</span> {patch.size}</p>
                    <p><span className="font-semibold">Location:</span> {patch.location}</p>
                    <button onClick={() => setPatchToDelete(patch.id)}
                    className="bg-red-600 text-amber-200 font-bold p-2 rounded-full hover:bg-red-700 transition-colors duration-300 mt-4">
                        Delete Patch
                        </button>
                        {patchToDelete === patch.id && <ConfirmDelete setIsActive={() => setPatchToDelete(null)} onConfirm={() => deletePatch(patch.id)} item="patch"></ConfirmDelete>}
                    </div>
                </div>
                ))}
            </div>
                
            
        </>
    );
}

export default Dashboard;