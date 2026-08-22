import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import CreateLayout from '../components/CreateLayout';

type CreatePatchProps = {
    setPatchId: (value: number) => void;
}

type FieldErrors = {
    patch_name?: string[];
    start_date?: string[];
    size?: string[];
    location?: string[];
    layout?: string[];
    non_field_errors?: string[];
}

function CreatePatch({ setPatchId }: CreatePatchProps) {
    const [patchName, setPatchName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [size, setSize] = useState('');
    const [location, setLocation] = useState('');
    const [layout, setLayout] = useState<File | null>(null);
    const [isCreatingLayout, setIsCreatingLayout] = useState(false);
    const [layoutPreview, setLayoutPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Plant a Patch | Create Patch';
    }, []);

    useEffect(() => {
        if (!layout) {
            return;
        }
        
        const url = URL.createObjectURL(layout);
        setLayoutPreview(url);

    }, [layout]);

   async function handleCreatePatch(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    const apiEndpoint = import.meta.env.VITE_API_URL;
    
    const formData = new FormData();
    formData.append('patch_name', patchName);
    formData.append('start_date', startDate);
    if (size) formData.append('size', size);
    if (location) formData.append('location', location);
    if (layout) formData.append('layout', layout);

    // Send data to Django to create a new patch
    try {
        const response = await fetch(`${apiEndpoint}/patches/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
            },
            body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
            setFieldErrors(data)
            throw new Error(data.non_field_errors?.[0] || 'Failed to create patch');
        }

        // Redirect to the new patch page
        setPatchId(data.id);
        navigate(`/patch/${data.id}/`);
    }
    catch (error) {
        if (error instanceof Error) {
            setError(error.message)
        } else {
            setError(String(error))
        }
    }

   }


    return (
        <>
            <form onSubmit={handleCreatePatch} className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold mb-4 text-center">Create a Patch</h1>
                {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="patch_name" className="block mb-2 
                    font-semibold">Patch name:</label>
                    <input type="text" id="patch_name" name="patch_name" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={patchName} onChange={(e) => setPatchName(e.target.value)}
                     placeholder="My Cabbage Patch"
                     required />
                     {fieldErrors.patch_name && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.patch_name[0]}</p>}
                </div>
                <div className="mb-4">
                    <label htmlFor="start_date" className="block mb-2 
                    font-semibold">Start date:</label>
                    <input type="date" id="start_date" name="start_date" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={startDate} onChange={(e) => setStartDate(e.target.value)}
                     required />
                     {fieldErrors.start_date && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.start_date[0]}</p>}
                </div>
                <div className="mb-4">
                    <label htmlFor="size" className="block mb-2 
                    font-semibold">Size <span className="text-slate-500 font-normal italic">(optional)</span>:</label>
                    <input type="text" id="size" name="size" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={size} onChange={(e) => setSize(e.target.value)}
                     placeholder="3m x 2m, 10ft x 6ft, 1 acre, 12 inch pot, etc."
                      />
                    {fieldErrors.size && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.size[0]}</p>}
                </div>
                <div className="mb-4">
                    <label htmlFor="location" className="block mb-2 
                    font-semibold">Location <span className="text-slate-500 font-normal italic">(optional)</span>:</label>
                    <input type="text" id="location" name="location" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={location} onChange={(e) => setLocation(e.target.value)}
                     placeholder="By the garden shed"
                      />
                    {fieldErrors.location && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.location[0]}</p>}
                </div>
                <div className="mb-4">
                    <label htmlFor="layout" className="block mb-2 
                    font-semibold">Layout <span className="text-slate-500 font-normal italic">(optional: jpg, jpeg, or png)</span>:</label>
                    {layoutPreview && <div className="my-4 flex justify-center items-center">
                        <img src={layoutPreview} alt="Layout Preview" 
                        className="max-w-full h-auto rounded-lg" />
                    </div>}
                    <input type="file" id="layout" name="layout" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600 
                     file:cursor-pointer file:bg-emerald-600 
                    hover:file:bg-emerald-700 file:text-white file:rounded-full
                     file:px-4 file:border-none transition-colors duration-300" 
                     onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];

                            const maxFileSize = 10485760; // 10MB
                                        if (file.size > maxFileSize) {
                                            alert('File size exceeds the maximum limit of 10MB. Please choose a smaller file.');
                                            return;
                                        }

                            setLayout(file);
                        }
                     }}
                     accept=".jpg, .jpeg, .png"
                      />
                      {fieldErrors.layout && <p className="text-red-500 font-bold text-center mb-4">{fieldErrors.layout[0]}</p>}
                      <button type="button" onClick={() => setIsCreatingLayout(true)}
                className="w-full bg-emerald-600
                 text-white p-2 rounded-full hover:bg-emerald-700 
                 transition-colors duration-300 mt-4">Don't have a picture of your patch layout? Click here to draw your own.</button>
            {isCreatingLayout && <CreateLayout setIsActive={setIsCreatingLayout} setLayout={setLayout}></CreateLayout>}
                </div>  
                <button type="submit" className="w-full bg-emerald-600
                 text-white p-2 rounded-full hover:bg-emerald-700 
                 transition-colors duration-300 mt-8">Create Patch</button>
            </form>
        </>
    );
}

export default CreatePatch;