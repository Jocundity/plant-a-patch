import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; 
import CropCard from '../components/CropCard';
import CreateLayout from '../components/CreateLayout';
import ConfirmDelete from '../components/ConfirmDelete';

type PatchProps = {
    schedulesVersion: number;
    setCropsVersion: React.Dispatch<React.SetStateAction<number>>;
}

type Patch = {
    id: number;
    patch_name: string;
    start_date: string;
    size?: string;
    location?: string;
    layout_url?: string;
}

export type Crop = {
    id: number;
    patch: number;
    crop_type: string;
    crop_variety?: string;
    planted_date: string;
    estimated_harvest_date: string;
    number_planted?: number;
    number_dead: number;
    crop_photo_url?: string;
    patch_name: string;
}

export type Harvest = {
    id: number;
    crop: number;
    crop_type: string;
    patch_name: string;
    harvest_date: string;
    quantity: number;
    total: number;
}

type wateringSchedule = {
    id: number;
    patch: number;
    patch_name: string;
    frequency: number;
    last_watered_date?: string;
    next_watering_date?: string;
    completed: boolean;
}

type fertilisingSchedule = {
    id: number;
    patch: number;
    patch_name: string;
    frequency: number;
    last_fertilised_date?: string;
    next_fertilising_date?: string;
    completed: boolean;
}

type Expense = {
    id: number;
    patch: number;
    patch_name: string;
    date: string;
    category: string;
    amount: number;
    description: string;
}

type Chore = {
    id: number;
    patch: number;
    due_date?: string;
    description: string;
    completed: boolean;
}

type Note = {
    id: number;
    patch: number;
    description: string;
    date: string;
    photo_url?: string;
}


function Patch({schedulesVersion, setCropsVersion}: PatchProps) {
    const token = localStorage.getItem('token');
    const apiEndpoint = import.meta.env.VITE_API_URL;
    const { id } = useParams<{ id: string}>();
    const [patch, setPatch] = useState<Patch | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Variables for editing patch details
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [patchDetailsError, setPatchDetailsError] = useState('');
    const [patchNameError, setPatchNameError] = useState('');
    const [patchDateError, setPatchDateError] = useState('');
    const [editedPatchName, setEditedPatchName] = useState('');
    const [editedPatchDate, setEditedPatchDate] = useState('');
    const [editedPatchSize, setEditedPatchSize] = useState('');
    const [editedPatchLocation, setEditedPatchLocation] = useState('');
    const [newLayout, setNewLayout] = useState<File | null>(null);
    const [newLayoutPreview, setNewLayoutPreview] = useState<string | null>(null);
    const [isCreatingLayout, setIsCreatingLayout] = useState(false);

    // Variables for viewing, adding, and editing crops
    const [crops, setCrops] = useState<Crop[]>([]);
    const [cropsError, setCropsError] = useState('');
    const [newCropType, setNewCropType] = useState('');
    const [newCropVariety, setNewCropVariety] = useState('');
    const [newCropPlantedDate, setNewCropPlantedDate] = useState('');
    const [newNumberPlanted, setNewNumberPlanted] = useState('');
    const [cropOptions, setCropOptions] = useState<string[]>([]);

    // Variables for viewing, adding, and editing, harvests
    const [harvests, setHarvests] = useState<Harvest[]>([]);

    // Variables for setting watering schedule
    const [wateringSchedule, setWateringSchedule] = useState<wateringSchedule | null>(null);
    const [wateringScheduleError, setWateringScheduleError] = useState('');
    const [wateringFrequency, setWateringFrequency] = useState('');

    // Variables for setting fertilising schedule
    const [fertilisingSchedule, setFertilisingSchedule] = useState<fertilisingSchedule | null>(null);
    const [fertilisingScheduleError, setFertilisingScheduleError] = useState('');
    const [fertilisingFrequency, setFertilisingFrequency] = useState('');

    // Variiables for viewing, adding, and editing expenses
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
    const [expensesError, setExpensesError] = useState('');
    const [newExpenseDate, setNewExpenseDate] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [newExpenseDescription, setNewExpenseDescription] = useState('');
    const [editedExpenseId, setEditedExpenseId] = useState<number | null>(null);
    const [editedExpenseDate, setEditedExpenseDate] = useState('');
    const [editedExpenseCategory, setEditedExpenseCategory] = useState('');
    const [editedExpenseAmount, setEditedExpenseAmount] = useState('');
    const [editedExpenseDescription, setEditedExpenseDescription] = useState('');
    const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

    // Variables for viewing, adding, editing, and deleting chores
    const [chores, setChores] = useState<Chore[]>([]);
    const [choresError, setChoresError] = useState('');
    const [newChoreDescription, setNewChoreDescription] = useState('');
    const [newChoreDueDate, setNewChoreDueDate] = useState('');
    const [editedChoreId, setEditedChoreId] = useState<number | null>(null);
    const [editedChoreDescription, setEditedChoreDescription] = useState('');
    const [editedChoreDueDate, setEditedChoreDueDate] = useState('');
    const [choreToDelete, setChoreToDelete] = useState<number | null>(null);

    // Variables for viewing, adding, editing, and deleting notes
    const [notes, setNotes] = useState<Note[]>([]);
    const [notesError, setNotesError] = useState('');
    const [newNoteDescription, setNewNoteDescription] = useState('');
    const [newNotePhoto, setNewNotePhoto] = useState<File | null>(null);
    const [newNotePhotoPreview, setNewNotePhotoPreview] = useState<string | null>(null);
    const [notePhotoInputKey, setNotePhotoInputKey] = useState(0); // Use to clear file input
    const [editedNoteId, setEditedNoteId] = useState<number | null>(null);
    const [editedNoteDescription, setEditedNoteDescription] = useState('');
    const [editedNotePhoto, setEditedNotePhoto] = useState<File | null>(null);
    const [editedNotePhotoPreview, setEditedNotePhotoPreview] = useState<string | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    useEffect(() => {
        if (patch) {
            document.title = `Plant a Patch | ${patch.patch_name}`
        } else {
            document.title = 'Plant a Patch | Patch'
        }
    }, [patch]);

    // Fetch patches from Django when the the component mounts
        useEffect(() => {
            async function getPatch() {
                try {
                    const response = await fetch(`${apiEndpoint}/patches/${id}/`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Token ${token}`,
                        },
                    });
    
                    const data = await response.json();
    
                    if (!response.ok) {
                        throw new Error('Failed to fetch patch')
                    }
    
                    setPatch(data);
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
            getPatch();
            fetchChores();
            fetchNotes();
            fetchCropOptions();
            fetchCrops();
            fetchHarvests();
            fetchWateringSchedule();
            fetchFertilisingSchedule();
            fetchExpenses();
            getExpenseCategories();
        }, [id]);

        useEffect(() => {
                if (!newLayout) {
                    setNewLayoutPreview(null);
                } else {
                    setNewLayoutPreview(URL.createObjectURL(newLayout));
                }

            }, [newLayout]);

        useEffect(() => {
            // Re-fetch the watering and fertilising schedules when marked as complete to update the next watering/fertilising date
            fetchWateringSchedule();
            fetchFertilisingSchedule();
        }, [schedulesVersion]);

        if (isLoading) {
            return <p className="motion-safe:animation-pulse">Loading patch details...</p>
        }

        if (error || !patch) {
            return <p className="text-red-500 font-bold text-center mb-4">{error}</p>
        }

        async function handleSaveDetails() {
            // Reset errors
            setPatchDetailsError('');
            setPatchNameError('');
            setPatchDateError('');

            // Make sure required fields are filled in
            if (!patch) return;
            if (!editedPatchName) {
                setPatchNameError('Patch name is required)');
                return;
            }
            if (!editedPatchDate) {
                setPatchDateError('Patch start date is required)');
                return;
            }

            const formData = new FormData();
            formData.append('patch_name', editedPatchName);
            formData.append('start_date', editedPatchDate);
            if (patch.size) formData.append('size', editedPatchSize);
            if (patch.location) formData.append('location', editedPatchLocation);
            if (newLayout) formData.append('layout', newLayout);

                // Send data to Django to update the patch
                try {
                    const response = await fetch(`${apiEndpoint}/patches/${id}/`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Token ${token}`,
                        },
                        body: formData,
                    });
    
                    const data = await response.json();
    
                    if (!response.ok) {
                        throw new Error('Failed to update patch details')
                    }
    
                    setPatch(data);
                    setIsEditingDetails(false);
                }
                catch (error) {
                    if (error instanceof Error) {
                        setPatchDetailsError(error.message);
                    } else {
                        setPatchDetailsError(String(error));
                    }
                }
                finally {
                    setNewLayout(null);
                    setNewLayoutPreview(null);
                }
            }

        // Crop functions

        /* Fetch CropHarvestTime reference table from Django
        / to populate crop options */
        async function fetchCropOptions() {
            try {
                const response = await fetch(`${apiEndpoint}/crop_harvest_times/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
            });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch available crop types');
                }

                const cropTypes = [];
                for (const crop of data) {
                    cropTypes.push(crop.crop_type);
                }

                setCropOptions(cropTypes);


            }
            catch (error) {
                if (error instanceof Error) {
                    setCropsError(error.message);
                } else {
                    setCropsError(String(error));
                }
            }
        }

        async function handleAddCrop(e: React.SubmitEvent<HTMLFormElement>) {
            e.preventDefault();
            setCropsError('');

            try {
                const response = await fetch(`${apiEndpoint}/crops/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify({
                        patch_id: patch?.id,
                        crop_type: newCropType,
                        crop_variety: newCropVariety === '' ? null : newCropVariety,
                        planted_date: newCropPlantedDate,
                        number_planted: newNumberPlanted === '' ? null : newNumberPlanted,
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to add crop');
                }

                // Reset the form fields
                setNewCropType('');
                setNewCropVariety('');
                setNewCropPlantedDate('');
                setNewNumberPlanted('');

                // Fetch the updated list of crops
                fetchCrops();

                // Update crops version for alerts
                setCropsVersion((prevVersion) => prevVersion + 1);
            }
            catch (error) {
                if (error instanceof Error) {
                    setCropsError(error.message);
                } else {
                    setCropsError(String(error));
                }
            }
        }

        async function fetchCrops() {
            // Fetch the crops from Django
            try {
                const response = await fetch(`${apiEndpoint}/crops/?patch_id=${id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Token ${token}`,
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch crops');
                }

                setCrops(data || []);

            }
            catch (error) {
                if (error instanceof Error) {
                    setCropsError(error.message);
                }
                else {
                    setCropsError(String(error));
                }
            }
        }

         async function deleteCrop(cropId: number) {
                setCropsError('');

                // Send request to Django to delete the crop
                try {
                    const response = await fetch(`${apiEndpoint}/crops/${cropId}/`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Token ${token}`,
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Failed to delete crop from database.');
                    }

                    // Remove crop from front end
                    setCrops(crops.filter((crop) => crop.id != cropId));

                    // Remove any harvest alerts for this crop
                    setCropsVersion((prevVersion) => prevVersion + 1);
                }
                catch (error) {
                    if (error instanceof Error) {
                        setCropsError(error.message);
                    } else {
                        setCropsError(String(error));
                    }
                }
            }

            async function handleEditCrop(cropId: number,
            updatedCrop: {
                crop_type: string;
                crop_variety: string | null;
                planted_date: string;
                number_planted: string | null;
                number_dead: string;
            }
) {
    setCropsError('');

    // Send request to Django to update the crop
    try {
        const response = await fetch(`${apiEndpoint}/crops/${cropId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`,
            },
            body: JSON.stringify(updatedCrop),
        });

        if (!response.ok) {
            throw new Error('Failed to update crop.');
        }

        // Fetch the updated list of crops
        fetchCrops();
    } catch (error) {
        if (error instanceof Error) {
            setCropsError(error.message);
            throw error;
        }
    }
}

        // Harvest functions
        async function fetchHarvests() {
            // Fetch harvests from Django
            const response = await fetch(`${apiEndpoint}/harvests/?patch_id=${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch harvests.');
            }

            const data = await response.json();

            setHarvests(data || []);  
        }

        function getHarvestTotal(cropId: number): number {
            // Return the total harvest for a specific crop.
            const cropHarvest = harvests.find((harvest) => harvest.crop === cropId);

            return cropHarvest ? cropHarvest.total : 0;
        }

        function getHarvestsForCrop(cropId: number): Harvest[] {
            // Return all harvests for a specific crop
            return harvests.filter((harvest) => harvest.crop === cropId);
        }

        async function handleAddHarvest(cropId: number, harvestDate: string, quantity: string) {


    const response = await fetch(`${apiEndpoint}/harvests/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
            crop: cropId,
            harvest_date: harvestDate,
            quantity,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to add harvest.');
    }
    
    // Fetch the updated list of harvests
    fetchHarvests();
    
}

    async function handleDeleteHarvest(harvestId: number) {
        // Send the request to Django to delete the harvest
        const response = await fetch(`${apiEndpoint}/harvests/${harvestId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete harvest.');
        }

        // Fetch the updated list of harrvests
        fetchHarvests();
    }

    async function handleEditHarvest(harvestId: number, editingHarvestDate: string, editingHarvestQuantity: string) {
        // Send the request to Django to update the harvest
        const response = await fetch(`${apiEndpoint}/harvests/${harvestId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                harvest_date: editingHarvestDate,
                quantity: editingHarvestQuantity,
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update harvest.');
        }

        // Update the harvest state with the edited harvest
        setHarvests(
            harvests.map((harvest) =>
                harvest.id === harvestId ? {
                ...harvest,
                harvest_date: editingHarvestDate,
                quantity: Number(editingHarvestQuantity),
            }
            : harvest));
    }

    // Watering schedule functions
    async function fetchWateringSchedule() {
        // Fetch the watering schedule from Django
        try {
            const response = await fetch(`${apiEndpoint}/watering_schedules/?patch_id=${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to fetch watering schedule');
            }

            setWateringSchedule(data[0] || null);
            setWateringFrequency(data[0]?.frequency.toString() || '');
        }
        catch (error) {
            if (error instanceof Error) {
                setWateringScheduleError(error.message);
            } else {
                setWateringScheduleError(String(error));
            }
        }
    }

    async function handleSetWateringSchedule(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setWateringScheduleError('');

        // Send data to Django to create or update the watering schedule
        if (!wateringSchedule || !wateringSchedule.id) {
            try {
                const response = await fetch(`${apiEndpoint}/watering_schedules/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify(
                        {
                            patch: patch?.id,
                            frequency: wateringFrequency,
                        }
                    )
                });

                if (!response.ok) {
                    throw new Error('Failed to set watering schedule'); 
                }

                // Fetch the newly created watering schedule
                fetchWateringSchedule();
            }
            catch (error) {
                if (error instanceof Error) {
                    setWateringScheduleError(error.message);
                } else {
                    setWateringScheduleError(String(error));
                }
            }
        } else {
            try {
                const response = await fetch (`${apiEndpoint}/watering_schedules/${wateringSchedule.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify({
                        frequency: wateringFrequency,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update watering schedule');
                }

                // Fetch the updated watering schedule
                fetchWateringSchedule();
            }
            catch (error) {
                if (error instanceof Error) {
                    setWateringScheduleError(error.message);
                } else {
                    setWateringScheduleError(String(error));
                }
            }
        }
    }

    // Fertilising schedule functions
    async function fetchFertilisingSchedule() {
        // Fetch the fertilising schedule from Django
        try {
            const response = await fetch(`${apiEndpoint}/fertilising_schedules/?patch_id=${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to fetch fertilising schedule');
            }

            setFertilisingSchedule(data[0] || null);
            setFertilisingFrequency(data[0]?.frequency.toString() || '');
        }
        catch (error) {
            if (error instanceof Error) {
                setFertilisingScheduleError(error.message);
            } else {
                setFertilisingScheduleError(String(error));
            }
        }
    }

    async function handleSetFertilisingSchedule(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setFertilisingScheduleError('');

        // Send data to Django to create or update the watering schedule
        if (!fertilisingSchedule || !fertilisingSchedule.id) {
            try {
                const response = await fetch(`${apiEndpoint}/fertilising_schedules/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify(
                        {
                            patch: patch?.id,
                            frequency: fertilisingFrequency,
                        }
                    )
                });

                if (!response.ok) {
                    throw new Error('Failed to set fertilising schedule');
                }

                // Fetch the newly created fertilising schedule
                fetchFertilisingSchedule();
            }
            catch (error) {
                if (error instanceof Error) {
                    setFertilisingScheduleError(error.message);
                } else {
                    setFertilisingScheduleError(String(error));
                }
            }
        } else {
            try {
                const response = await fetch (`${apiEndpoint}/fertilising_schedules/${fertilisingSchedule.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify({
                        frequency: fertilisingFrequency,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update fertilising schedule');
                }

                // Fetch the updated fertilising schedule
                fetchFertilisingSchedule();
            }
            catch (error) {
                if (error instanceof Error) {
                    setFertilisingScheduleError(error.message);
                } else {
                    setFertilisingScheduleError(String(error));
                }
            }
        }
    }

        // Expense functions
        async function fetchExpenses() {
            // Fetch the expenses from Django
            try {
                const response = await fetch(`${apiEndpoint}/expenses/?patch_id=${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch expenses');
                }

                if (data.length > 0) {
                    setExpenses(
                        data.map((expense: Expense) => ({
                            ...expense,
                            amount: Number(expense.amount).toFixed(2)
                        }))
                    );
                } else {
                    setExpenses([]);
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    setExpensesError(error.message);
                } else {
                    setExpensesError(String(error));
                }
            }
        }

        async function handleAddExpense(e: React.SubmitEvent<HTMLFormElement>) {
            e.preventDefault();
            setExpensesError('');

            // Send data to Django to create a new expense
            try {
                const response = await fetch(`${apiEndpoint}/expenses/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(
                        {
                            patch: patch?.id,
                            date: newExpenseDate,
                            category: newExpenseCategory,
                            amount: newExpenseAmount,
                            description: newExpenseDescription,
                        }
                    ),
                });

                if (!response.ok) {
                    throw new Error('Failed to add expense');
                }

                // Reset the form fields
                setNewExpenseDate('');
                setNewExpenseCategory('');
                setNewExpenseAmount('');
                setNewExpenseDescription('');

                // Fetch the updated list of expenses
                fetchExpenses();
            }
            catch (error) {
                if (error instanceof Error) {
                    setExpensesError(error.message);
                } else {
                    setExpensesError(String(error));
                }
            }
        }

        async function deleteExpense(expenseId: number) {
            setExpensesError('');

            // Send the request to Django to delete the expense
            try {
                const response = await fetch(`${apiEndpoint}/expenses/${expenseId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to delete expense from database');
                }

                // Remove expense from front end
                setExpenses(expenses.filter((expense) => expense.id !== expenseId));
            }
            catch (error) {
                if (error instanceof Error) {
                    setExpensesError(error.message);
                } else {
                    setExpensesError(String(error));
                }
            }
        }

        async function getExpenseCategories() {
            // Get the expense categories from Django
            try {
                const response = await fetch(`${apiEndpoint}/expense_categories/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch expense categories');
                }

                setExpenseCategories(data || []);
            }
            catch (error) {
                if (error instanceof Error) {
                    setExpensesError(error.message);
                } else {
                    setExpensesError(String(error));
                }
            }
        }

        async function handleEditExpense(expenseId: number) {
            setExpensesError('');
            if (!editedExpenseDate || !editedExpenseCategory || !editedExpenseAmount || !editedExpenseDescription) {
                setExpensesError('Date, category, amount, and description are required.');
                return;
            }

            // Send request to Django to update the expense
            try {
                const response = await fetch(`${apiEndpoint}/expenses/${expenseId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: editedExpenseDate,
                        category: editedExpenseCategory,
                        amount: editedExpenseAmount,
                        description: editedExpenseDescription,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update expense');
                }

                // Reset the edit state
                setEditedExpenseId(null);
                setEditedExpenseDate('');
                setEditedExpenseCategory('');
                setEditedExpenseAmount('');
                setEditedExpenseDescription('');

                // Update the expense in the state
                setExpenses(expenses.map((expense) => 
                    expense.id === expenseId ? {
                        ...expense,
                        date: editedExpenseDate,
                        category: editedExpenseCategory,
                        amount: Number(editedExpenseAmount),
                        description: editedExpenseDescription,
                    } : expense
                ));
                
                // Fetch the updated list of expenses
                fetchExpenses();
            }
            catch (error) {
                if (error instanceof Error) {
                    setExpensesError(error.message);
                } else {
                    setExpensesError(String(error));
                }
            }
        }

        function getTotalExpenses(): number {
            // Add up the total expenses for the patch

            let total = 0;
            for (const expense of expenses) {
                total += Number(expense.amount);
            }

            return total;
        }

        // Chore functions
        async function handleAddChore(e: React.SubmitEvent<HTMLFormElement>) {
            e.preventDefault();
            setChoresError('');

            // Send data to Django to create a new chore
            try {
                const response = await fetch(`${apiEndpoint}/chores/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify({
                        patch_id: patch?.id,
                        due_date: newChoreDueDate === '' ? null : newChoreDueDate,
                        description: newChoreDescription,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to add chore');
                }

                // Reset the form fields
                setNewChoreDescription('');
                setNewChoreDueDate('');

                // Fetch the updated list of chores
                fetchChores();

                }
                catch (error) {
                    if (error instanceof Error) {
                        setChoresError(error.message);
                    } else {
                        setChoresError(String(error));
                    }
                }
            }
        
        async function fetchChores() {
            try {
                const response = await fetch(`${apiEndpoint}/chores/?patch_id=${id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Token ${token}`,
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch chores');
                }

                setChores(data || []);

            }
            catch (error) {
                if (error instanceof Error) {
                    setChoresError(error.message);
                }
                else {
                    setChoresError(String(error));
                }
            }
        }

        async function ToggleChoreCompletion(chore: Chore) {
            setChoresError('');
            
            try {
                const response = await fetch(`${apiEndpoint}/chores/${chore.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify({
                        completed: !chore.completed,
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update chore completion status');
                }

                fetchChores();
            } catch (error) {
                if (error instanceof Error) {
                    setChoresError(error.message);
                } else {
                    setChoresError(String(error));
                }
        }
        }

        async function deleteChore(choreId: number) {
            setChoresError('');

            // Send request to Django to delete the chore
            try {
                const response = await fetch(`${apiEndpoint}/chores/${choreId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Token ${token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete chore from database');
                }

                // Remove chore from front end
                setChores(chores.filter((chore) => chore.id !== choreId));
            }
            catch (error) {
                if (error instanceof Error) {
                    setChoresError(error.message);
                }
                else {
                    setChoresError(String(error));
                }
            }
        }

        async function handleEditChore(choreId: number) {
            setChoresError('');
            if (!editedChoreDescription) {
                setChoresError('Chore desicription is required.');
                return;
            }

            // Send request to Django to update the chore
            try {
                const response = await fetch(`${apiEndpoint}/chores/${choreId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                    },
                    body: JSON.stringify({
                        description: editedChoreDescription,
                        due_date: editedChoreDueDate === '' ? null : editedChoreDueDate,
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update chore.');
                }

                // Reset the edit state
                setEditedChoreId(null);
                setEditedChoreDescription('');
                setEditedChoreDueDate('');

                // Fetch the updated list of chores
                fetchChores();
                }
                catch (error) {
                    if (error instanceof Error) {
                        setChoresError(error.message);
                    } else {
                        setChoresError(String(error));
                    }
                }
            }

            // Note functions
            async function handleAddNote(e: React.SubmitEvent<HTMLFormElement>) {
                e.preventDefault();
                setNotesError('');

                // Return early if patch is not loaded yet
                if (!patch) return;

                const formData = new FormData();
                formData.append('patch_id', patch.id.toString());
                formData.append('description', newNoteDescription);
                if (newNotePhoto) formData.append('photo', newNotePhoto);

                // Send data to Django to create a new note
                try {
                    const response = await fetch(`${apiEndpoint}/notes/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Token ${token}`,
                        },
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('Failed to add note.');
                    }

                    // Reset the form fields
                    setNewNoteDescription('');
                    setNewNotePhoto(null);
                    setNewNotePhotoPreview(null);
                    setNotePhotoInputKey((prevKey) => prevKey + 1);
                    

                    // Fetch the updated list of notes
                    fetchNotes();
                }
                catch (error) {
                    if (error instanceof Error) {
                        setNotesError(error.message);
                    } else {
                        setNotesError(String(error));
                    }
                }
            }

            async function fetchNotes() {
                // Fetch notes from Django
                try {
                    const response = await fetch(`${apiEndpoint}/notes/?patch_id=${id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Token ${token}`,
                        }
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error('Failed to fetch notes.');
                    }

                    setNotes(data || []);
                }
                catch (error) {
                    if (error instanceof Error) {
                        setNotesError(error.message);
                    } else {
                        setNotesError(String(error));
                    }
                }
            }

            async function deleteNote(noteId: number) {
                setNotesError('');

                // Send request to Django to delete the note
                try {
                    const response = await fetch(`${apiEndpoint}/notes/${noteId}/`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Token ${token}`,
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Failed to delete note from database.');
                    }

                    // Remove note from front end
                    setNotes(notes.filter((note) => note.id != noteId));
                }
                catch (error) {
                    if (error instanceof Error) {
                        setNotesError(error.message);
                    } else {
                        setNotesError(String(error));
                    }
                }
            }

            async function handleEditNote(noteId: number) {
                setNotesError('');

                // Return early if the note description is empty
                if (!editedNoteDescription) {
                    setNotesError('Note description is required.');
                    return;
                }

                const formData = new FormData();
                formData.append('description', editedNoteDescription);
                if (editedNotePhoto) formData.append('photo', editedNotePhoto);

                // Send request to Django to update note
                try {
                    const response = await fetch(`${apiEndpoint}/notes/${noteId}/`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Token ${token}`,
                        },
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update note.');
                    }

                    // Reset the edit state
                    setEditedNoteId(null);
                    setEditedNoteDescription('');
                    setEditedNotePhoto(null);
                    setEditedNotePhotoPreview(null);

                    // Fetch the updated list of notes
                    fetchNotes();
                }
                catch (error) {
                    if (error instanceof Error) {
                        setNotesError(error.message);
                    } else {
                        setNotesError(String(error));
                    }
                }
            }
        

    return (
        <>
        {/* Patch Details */}
            <h1 className="text-2xl font-bold text-center">{patch.patch_name}</h1>
            <div className="flex gap-4 justify-between items-center mb-4 mt-8">
                <h2 className="text-xl font-bold text-center">Basic Details</h2>
                <div className="flex gap-4">
                    <button onClick={() => {
                    if (isEditingDetails) {
                        handleSaveDetails();
                    } else {
                        setIsEditingDetails(true);
                        setEditedPatchName(patch.patch_name);
                        setEditedPatchDate(patch.start_date);
                        setEditedPatchSize(patch.size ?? '');
                        setEditedPatchLocation(patch.location ?? '');
                    }
                }
                    }
                 className="text-amber-200 bg-emerald-600
                        font-bold text-xl p-2 rounded-full hover:bg-emerald-700
                        transition-colors duration-300 cursor-pointer">{isEditingDetails ? 'Save Details' : 'Edit Details'}</button>
                {isEditingDetails && <button onClick={() => {
                    setIsEditingDetails(false);
                    setPatchDetailsError('');
                    setPatchNameError('');
                    setPatchDateError('');
                    setNewLayout(null);
                    setNewLayoutPreview(null);
                }
                    }
                 className="text-amber-200 bg-slate-600
                        font-bold text-xl p-2 rounded-full hover:bg-slate-700
                        transition-colors duration-300 cursor-pointer">
                            Cancel</button>}
                </div>
            </div>
             <div className="mt-8 mx-auto max-w-4xl
            p-4 rounded-xl shadow-lg bg-white flex sm:flex-row
             sm:justify-center flex-col gap-4 items-center ">
                    <div>
                        {(patch.layout_url || newLayoutPreview) && 
                        <div className="flex justify-center items-center">
                            <img src={newLayoutPreview ?? patch.layout_url} 
                        alt="Patch Layout" className=" max-w-xs sm:max-w-sm 
                        object-cover rounded-lg" />
                        </div>}
                        {isEditingDetails && (
                            <div>
                                <label htmlFor="new_layout" className="block mb-2 
                    font-semibold">Layout <span className="text-slate-500
                     font-normal italic">(optional: jpg, jpeg, or png)</span>:
                     </label>
                    <input type="file" id="new_layout" name="new_layout" 
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

                            setNewLayout(file);
                            setNewLayoutPreview(URL.createObjectURL(file)); // ChatGPT code
                        }
                     }}
                     accept=".jpg, .jpeg, .png"
                      />
                      <div className="flex justify-center">
                        <button type="button" 
                      onClick={() => {setIsCreatingLayout(true)}}
                      className="mt-2 text-amber-200 bg-emerald-600
                        font-bold p-2 rounded-full hover:bg-emerald-700
                        transition-colors duration-300 cursor-pointer w-full"
                      >Create Layout</button>
                      </div>
                      {isCreatingLayout && (
                        <CreateLayout setIsActive={setIsCreatingLayout} setLayout={setNewLayout} />
                      )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col justify-center 
                    items-center sm:items-start gap-2">
                        {isEditingDetails && <p className="text-red-500
                         font-bold text-center mb-4">{patchDetailsError}</p>}
                    <p><label htmlFor="patch_name" className="font-semibold">Patch Name: </label> 
                    {isEditingDetails ? <input type="text" id="patch_name" 
                    name="patch_name" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={editedPatchName} onChange={(e) => setEditedPatchName(e.target.value)}
                     required /> : patch.patch_name}</p>
                     {patchNameError && <p className="text-red-500 
                     font-bold text-center mb-4">{patchNameError}</p>}
                    <p><label htmlFor="start_date" className="font-semibold">Start Date: </label> 
                    {isEditingDetails ? <input type="date" id="start_date"
                     name="start_date" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={editedPatchDate} onChange={(e) => setEditedPatchDate(e.target.value)}
                     required /> : new Date(patch.start_date).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}</p>
                     {patchDateError && <p className="text-red-500 font-bold text-center mb-4">{patchDateError}</p>}
                    <p><label htmlFor="size" className="font-semibold">Size: </label> 
                    {isEditingDetails ? <input type="text" id="size" name="size" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={editedPatchSize ?? ''} onChange={(e) => setEditedPatchSize(e.target.value)}
                      /> : patch.size ? patch.size : <span className="text-slate-500 italic">No Size</span>}</p>
                    <p><label htmlFor="location" className="font-semibold">Location: </label> 
                    {isEditingDetails ? <input type="text" id="location"
                     name="location" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={editedPatchLocation ?? ''} onChange={(e) => setEditedPatchLocation(e.target.value)}
                      /> : patch.location ? patch.location : <span 
                      className="text-slate-500 italic">No Location</span>}</p>
                    </div>
                </div>

                        {/* Crops */}
                <h2 className="text-xl font-bold mb-4 mt-8">Crops</h2>
<div className="mt-8 mx-auto max-w-4xl p-4 rounded-xl shadow-lg bg-white">
    {cropsError && <p className="text-red-500 font-bold text-center mb-4">{cropsError}</p>}
    {crops.length !== 0 && (
        <div className="flex flex-col gap-4">
            {crops.map((crop) => (
                <CropCard key={crop.id} crop={crop} cropOptions={cropOptions}
                    harvests={getHarvestsForCrop(crop.id)}
                    harvestTotal={getHarvestTotal(crop.id)}
                    onUpdateCrop={handleEditCrop}
                    onDeleteCrop={deleteCrop}
                    onAddHarvest={handleAddHarvest}
                    onDeleteHarvest={handleDeleteHarvest}
                    onUpdateHarvest={handleEditHarvest}
                    
                />
))}
        </div>
    )}

    <form
    onSubmit={handleAddCrop}
    className="flex flex-wrap flex-col gap-4 mt-4"
>
    <div className="flex flex-col md:flex-row gap-2 items-center">
        <label
            htmlFor="crop_type" className="block mb-2 font-semibold"
        >
            Crop Type:
        </label>

        <select
            id="crop_type" name="crop_type"
            className="w-full md:flex-1 px-4 py-2 appearance-none
             rounded-full cursor-pointer bg-amber-100 
             focus:outline-4 focus:outline-emerald-600"
            value={newCropType} onChange={(e) => setNewCropType(e.target.value)}
            required
        >
            <option value="" disabled>
                Select Crop Type
            </option>

            {cropOptions.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    </div>

    <div className="flex flex-col md:flex-row gap-2 items-center">
        <label
            htmlFor="crop_variety" className="block mb-2 font-semibold"
        >
            Crop Variety{" "}
            <span className="text-slate-500 font-normal italic">
                (optional)
            </span>
            :
        </label>

        <input
            type="text" id="crop_variety" name="crop_variety"
            className="p-2 rounded-full bg-amber-100 grow 
            focus:outline-4 focus:outline-emerald-600"
            value={newCropVariety}
            onChange={(e) => setNewCropVariety(e.target.value)}
            placeholder="Sungold"
        />
    </div>

    <div className="flex flex-col md:flex-row gap-2 items-center">
        <label
            htmlFor="crop_planted_date" className="block mb-2 font-semibold"
        >
            Planted Date:
        </label>

        <input
            type="date" id="crop_planted_date" name="crop_planted_date"
            className="p-2 rounded-full bg-amber-100 grow
             focus:outline-4 focus:outline-emerald-600"
            value={newCropPlantedDate}
            onChange={(e) => setNewCropPlantedDate(e.target.value)}
            required
        />
    </div>

    <div className="flex flex-col md:flex-row gap-2 items-center">
        <label
            htmlFor="crop_number_planted" className="block mb-2 font-semibold"
        >
            Number Planted{" "}
            <span className="text-slate-500 font-normal italic">
                (optional)
            </span>
            :
        </label>

        <input
            type="number" id="crop_number_planted" name="crop_number_planted"
            className="p-2 rounded-full bg-amber-100 grow 
            focus:outline-4 focus:outline-emerald-600"
            value={newNumberPlanted}
            onChange={(e) => setNewNumberPlanted(e.target.value)}
            min={1} step={1} placeholder="1"
        />
    </div>

    <div>
        <button
            type="submit"
            className="text-amber-200 bg-emerald-600 font-bold p-2
             rounded-full hover:bg-emerald-700 transition-colors duration-300
              w-full cursor-pointer"
        >
            Add Crop
        </button>
    </div>
</form>

</div>


{/* Watering and Fertilising Schedules */}
 <h2 className="text-xl font-bold mb-4 mt-8">Watering and Fertilising Schedules</h2>
 <div className="mt-8 mx-auto max-w-4xl
            p-4 rounded-xl shadow-lg bg-white flex flex-col gap-4 items-center ">
                <p className="text-red-500 font-bold text-center mb-4">{wateringScheduleError}</p>
                <form onSubmit={handleSetWateringSchedule}>
                    <h3 className="text-lg font-bold mb-4 text-center">
                        Watering Schedule </h3>
                    <label htmlFor="watering_schedule" className="block text-center
                     sm:inline">Water every </label>
                    <input type="number" id="watering_schedule" 
                    name="watering_schedule"
                    className="p-2 rounded-full bg-amber-100
                    focus:outline-4 focus:outline-emerald-600"
                    value={wateringFrequency}
                    onChange={(e) => setWateringFrequency(e.target.value)}
                    min={1} step={1} placeholder="1" required />
                    <span className="block text-center sm:inline sm:ml-2">day(s)</span>
                    <button type="submit"
                    className="block w-full mt-4 sm:mt-0 sm:w-auto sm:inline text-amber-200
                     bg-emerald-600 font-bold p-2
                     rounded-full hover:bg-emerald-700 transition-colors 
                     duration-300 sm:ml-4 cursor-pointer">
                        Set
                    </button>
                </form>
                <p>Last watered: {wateringSchedule?.last_watered_date && new Date(wateringSchedule.last_watered_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}</p>
                <p>Next watering: {wateringSchedule?.next_watering_date && new Date(wateringSchedule.next_watering_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}</p>
            </div>

            <div className="mt-8 mx-auto max-w-4xl
            p-4 rounded-xl shadow-lg bg-white flex flex-col gap-4 items-center ">
                <p className="text-red-500 font-bold text-center mb-4">{fertilisingScheduleError}</p>
                <form onSubmit={handleSetFertilisingSchedule}>
                    <h3 className="text-lg font-bold mb-4 text-center">Fertilising Schedule </h3>
                    <label htmlFor="fertilising_schedule" className="block
                     text-center sm:inline">Fertilise every </label>
                    <input type="number" id="fertilising_schedule" name="fertilising_schedule"
                    className="p-2 rounded-full bg-amber-100
                    focus:outline-4 focus:outline-emerald-600"
                    value={fertilisingFrequency}
                    onChange={(e) => setFertilisingFrequency(e.target.value)}
                    min={1} step={1} placeholder="1" required />
                    <span className="block text-center sm:inline sm:ml-2">day(s)</span>
                    <button type="submit"
                    className="block w-full mt-4 sm:mt-0 sm:w-auto sm:inline text-amber-200
                     bg-emerald-600 font-bold p-2
                     rounded-full hover:bg-emerald-700 transition-colors 
                     duration-300 sm:ml-4 cursor-pointer">
                        Set
                    </button>
                </form>
                <p>Last fertilised: {fertilisingSchedule?.last_fertilised_date && new Date(fertilisingSchedule.last_fertilised_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}</p>
                <p>Next fertilising: {fertilisingSchedule?.next_fertilising_date && new Date(fertilisingSchedule.next_fertilising_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}</p>
            </div>


            {/* Expenses */}
            <h2 className="text-xl font-bold mb-4 mt-8">Expenses</h2>
            <div className="mt-8 mx-auto max-w-4xl
            p-4 rounded-xl shadow-lg bg-white flex flex-col gap-4 items-center ">
                {expensesError && <p className="text-red-500 font-bold
                 text-center mb-4">{expensesError}</p>}
                {expenses.length !== 0 && (
                    <>
                    <p className="text-lg text-center">
                    <span className="font-semibold">Total Expenses:</span> {getTotalExpenses().toFixed(2)}
                </p>
                    <table className="w-full block md:table md:table-fixed">
                    <thead className="hidden md:table-header-group
                     bg-emerald-600 text-white">
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th colSpan={2}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group w-full">
                       {expenses.map((expense) => {
                            const isEditingExpense = expense.id === editedExpenseId;

                            return (
                                <tr key={expense.id} className="bg-orange-100 
                                hover:bg-emerald-100 text-center
                                 transition-colors duration-300
                                block md:table-row mb-4 md:mb-0 p-4 md:p-0
                                 rounded-xl ">
                                    <td className="py-2 px-2 block md:table-cell
                                     text-center">
                                        <label htmlFor="expense_date" className="inline-block md:hidden
                                         font-bold w-32">Date:</label>
                                        {isEditingExpense ? (
                                            <input 
                                                type="date" 
                                                id="expense_date" 
                                                name="expense_date" 
                                                className="p-2 rounded-full
                                                 bg-amber-100 grow w-full min-w-0
                                                focus:outline-4
                                                 focus:outline-emerald-600
                                                border border-emerald-600"
                                                required 
                                                value={editedExpenseDate} 
                                                onChange={(e) => setEditedExpenseDate(e.target.value)} 
                                            />
                                        ) : expense.date ? (
                                            new Date(expense.date).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })
                                        ) : (
                                            expense.date
                                        )}
                                    </td>
                                    <td className="py-2 px-2 block 
                                    md:table-cell text-center">
                                        <label htmlFor="expense_category" className="inline-block 
                                        md:hidden font-bold w-32">Category:</label>
                                        {isEditingExpense ? (
                                            <select
                                                id="expense_category"
                                                name="expense_category"
                                                className="w-full min-w-0
                                                md:flex-1 px-4 py-2 
                                                appearance-none rounded-full
                                                 cursor-pointer
                                                  bg-amber-100 focus:outline-4
                                                  focus:outline-emerald-600 
                                                  border border-emerald-600"
                                                  required
                                                value={editedExpenseCategory}
                                                onChange={(e) => setEditedExpenseCategory(e.target.value)}
                                            >
                                                <option value="" disabled>
                                                    Select Expense Category
                                                </option>
                                                {expenseCategories.map((category) => (
                                                    <option key={category} value={category}>
                                                        {category}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            expense.category
                                        )}
                                    </td>

                                    <td className="py-2 px-2 block 
                                    md:table-cell text-center">
                                        <label htmlFor="expense_description" className="inline-block 
                                        md:hidden font-bold w-32">Description:</label>
                                        {isEditingExpense ? (
                                            <input 
                                                type="text" 
                                                id="expense_description" 
                                                name="expense_description" 
                                                className="p-2 rounded-full
                                                 bg-amber-100 grow w-full min-w-0
                                                focus:outline-4
                                                 focus:outline-emerald-600
                                                border border-emerald-600"
                                                required
                                                value={editedExpenseDescription} 
                                                onChange={(e) => setEditedExpenseDescription(e.target.value)} 
                                            />
                                        ) : (
                                            expense.description
                                        )}
                                    </td>
                                    <td className="py-2 px-2 block 
                                    md:table-cell text-center">
                                        <label htmlFor="expense_amount" className="inline-block 
                                        md:hidden font-bold w-32">Amount:</label>
                                        {isEditingExpense ? (
                                            <input
                                                type="number"
                                                id="expense_amount"
                                                name="expense_amount"
                                                className="p-2 rounded-full
                                                 bg-amber-100 grow w-full min-w-0
                                                focus:outline-4
                                                 focus:outline-emerald-600
                                                border border-emerald-600"
                                                 min={0.01} step={0.01}
                                                 required
                                                value={editedExpenseAmount}
                                                onChange={(e) => setEditedExpenseAmount(e.target.value)}
                                            />
                                        ) : (
                                            expense.amount
                                        )}
                                    </td>
                                    <td className="p-2 block md:table-cell 
                                    text-center">
                                        {isEditingExpense ? (
                                            <div className="flex gap-2 
                                            justify-center">
                                                <button 
                                                    onClick={() => handleEditExpense(expense.id)}
                                                    className="bg-emerald-600
                                                     text-amber-200 font-bold p-2 
                                                     rounded-full
                                                      hover:bg-emerald-700
                                                      transition-colors 
                                                      duration-300 text-sm 
                                                      w-full md:w-auto
                                                       cursor-pointer"
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setExpensesError('');
                                                        setEditedExpenseId(null);
                                                        setEditedExpenseDate('');
                                                        setEditedExpenseCategory('');
                                                        setEditedExpenseAmount('');
                                                        setEditedExpenseDescription('');
                                                    }}
                                                    className="bg-slate-500
                                                     text-amber-200 font-bold p-2
                                                      rounded-full
                                                       hover:bg-slate-600
                                                        transition-colors
                                                         duration-300 text-sm 
                                                        w-full
                                                         md:w-auto cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setEditedExpenseId(expense.id);
                                                    setEditedExpenseDate(expense.date);                                                setEditedExpenseCategory(expense.category);
                                                    setEditedExpenseDescription(expense.description);
                                                    setEditedExpenseAmount(expense.amount.toString());
 
                                                }}
                                                className="bg-amber-600
                                                 text-amber-200 font-bold p-2
                                                  rounded-full hover:bg-amber-700
                                                   transition-colors duration-300
                                                    text-sm w-full md:w-auto
                                                     cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-2 block md:table-cell 
                                    text-left md:text-center">
                                        <button 
                                            onClick={() => setExpenseToDelete(expense.id)}
                                            className="bg-red-600 text-amber-200 
                                            font-bold p-2 rounded-full
                                             hover:bg-red-700 transition-colors 
                                             duration-300 text-sm w-full 
                                             md:w-auto cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                        {expenseToDelete === expense.id && <ConfirmDelete setIsActive={() => setExpenseToDelete(null)} onConfirm={() => deleteExpense(expense.id)} item="expense"></ConfirmDelete>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </>
                )}
                <form onSubmit={handleAddExpense}
                className="flex flex-wrap flex-col gap-4 mt-4 justify-center
                 items-center">
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="expense_date" 
                    className="block mb-2 font-semibold">Date: </label>
                    <input type="date" id="expense_date" name="expense_date" 
                    className="p-2 rounded-full bg-amber-100 grow
                     focus:outline-4 focus:outline-emerald-600" 
                     value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)}
                     required />
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="expense_category" 
                    className="block mb-2 font-semibold">Category: </label>
                     <select id="expense_category" name="expense_category"
                                    value={newExpenseCategory}
                                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                                    className="w-full md:flex-1 px-4 py-2
                                     appearance-none rounded-full 
                                     cursor-pointer bg-amber-100
                                      focus:outline-4 focus:outline-emerald-600"
                                       required
                                >
                                    <option value="" disabled>
                                        Select Expense Category
                                    </option>
                                    {expenseCategories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                        </div> 
                     <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="expense_description" 
                    className="block mb-2 font-semibold">Description: </label>
                     <input type="text" id="expense_description"
                      name="expense_description" 
                    className="p-2 rounded-full bg-amber-100 grow
                     focus:outline-4 focus:outline-emerald-600" 
                     value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} 
                     placeholder="Tomato seeds"
                     required/> 
                     </div>
                     <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="expense_amount" 
                    className="block mb-2 font-semibold">Amount: </label>
                     <input type="number" id="expense_amount" name="expense_amount" 
                    className="p-2 rounded-full bg-amber-100 grow
                     focus:outline-4 focus:outline-emerald-600"
                     min={0.01} step={0.01} 
                     value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} 
                     placeholder="1.50"
                     required/> 
                     </div>
                     <button type="submit" className="text-amber-200 bg-emerald-600
                        font-bold p-2 rounded-full hover:bg-emerald-700
                        transition-colors duration-300 cursor-pointer">Add Expense</button>
                </form>
            </div>


            {/* Chores */}
                <h2 className="text-xl font-bold mb-4 mt-8">Chores</h2>
                <div className="mt-8 mx-auto max-w-4xl
            p-4 rounded-xl shadow-lg bg-white flex flex-col gap-4 items-center ">
                {choresError && <p className="text-red-500 font-bold text-center mb-4">{choresError}</p>}
                {chores.length !== 0 && (
                    <table className="w-full block md:table">
                    <thead className="hidden md:table-header-group
                     bg-emerald-600 text-white">
                        <tr>
                            <th>Completed</th>
                            <th>Due Date</th>
                            <th>Description</th>
                            <th colSpan={2}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group w-full">
                       {chores.map((chore) => {
                            const isEditingChore = chore.id === editedChoreId;

                            return (
                                <tr key={chore.id} className={`                                 hover:bg-emerald-100 text-center ${chore.completed ? 'bg-slate-100' : 'bg-orange-100'}
                                 transition-colors duration-300
                                block md:table-row mb-4 md:mb-0 p-4 md:p-0 rounded-xl`}>
                                    <td className="py-2 px-2 block md:table-cell
                                     text-center">
                                        <span className="inline-block md:hidden
                                         font-bold w-32">Completed:</span>
                                        <input 
                                            type="checkbox" 
                                            className="accent-emerald-600"
                                            checked={chore.completed}
                                            onChange={() => ToggleChoreCompletion(chore)}
                                        />
                                    </td>
                                    <td className="py-2 px-2 block md:table-cell 
                                    text-center">
                                        <span className="inline-block md:hidden
                                         font-bold w-32">Due Date:</span>
                                        {isEditingChore ? (
                                            <input 
                                                type="date" 
                                                id="chore_due_date" 
                                                name="chore_due_date" 
                                                className="p-2 rounded-full
                                                 bg-amber-100 grow
                                                focus:outline-4
                                                 focus:outline-emerald-600
                                                border border-emerald-600" 
                                                value={editedChoreDueDate} 
                                                onChange={(e) => setEditedChoreDueDate(e.target.value)} 
                                            />
                                        ) : chore.due_date ? (<span className={chore.completed ? "line-through text-slate-500" : ""}>{
                                            new Date(chore.due_date).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}</span>
                                        ) : (
                                            <span className={`text-slate-500
                                             italic ${chore.completed ? "line-through" : ""}`}>No Due Date</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-2 block
                                     md:table-cell text-center">
                                        <span className="inline-block
                                         md:hidden font-bold w-32">Description:</span>
                                        {isEditingChore ? (
                                            <input 
                                                type="text" 
                                                id="chore_description" 
                                                name="chore_description" 
                                                className="p-2 rounded-full
                                                 bg-amber-100 grow
                                                focus:outline-4
                                                 focus:outline-emerald-600
                                                border border-emerald-600" 
                                                value={editedChoreDescription} 
                                                onChange={(e) => setEditedChoreDescription(e.target.value)} 
                                            />
                                        ) : (
                                            <span className={chore.completed ? "line-through text-slate-500" : ""}>{chore.description}</span>
                                        )}
                                    </td>
                                    <td className="p-2 block md:table-cell
                                     text-center">
                                        {isEditingChore ? (
                                            <div className="flex gap-2
                                             justify-center">
                                                <button 
                                                    onClick={() => handleEditChore(chore.id)}
                                                    className="bg-emerald-600
                                                     text-amber-200 font-bold p-2
                                                      rounded-full
                                                      hover:bg-emerald-700 
                                                      transition-colors duration-300 
                                                       text-sm w-full md:w-auto 
                                                       cursor-pointer"
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setChoresError('');
                                                        setEditedChoreId(null);
                                                        setEditedChoreDescription('');
                                                        setEditedChoreDueDate('');
                                                    }}
                                                    className="bg-slate-500
                                                     text-amber-200 font-bold p-2
                                                      rounded-full
                                                       hover:bg-slate-600
                                                        transition-colors 
                                                        duration-300 
                                                        text-sm w-full md:w-auto 
                                                        cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setEditedChoreId(chore.id);
                                                    setEditedChoreDescription(chore.description);
                                                    setEditedChoreDueDate(chore.due_date ?? '');
                                                }}
                                                className="bg-amber-600
                                                 text-amber-200 font-bold p-2
                                                  rounded-full hover:bg-amber-700
                                                   transition-colors duration-300
                                                    text-sm w-full md:w-auto 
                                                    cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-2 block md:table-cell
                                     text-left md:text-center">
                                        <button 
                                            onClick={() => setChoreToDelete(chore.id)}
                                            className="bg-red-600 text-amber-200
                                             font-bold p-2 rounded-full
                                              hover:bg-red-700 transition-colors
                                               duration-300 text-sm w-full
                                                md:w-auto cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                        {choreToDelete === chore.id && <ConfirmDelete setIsActive={() => setChoreToDelete(null)} onConfirm={() => deleteChore(chore.id)} item="chore"></ConfirmDelete>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                )}
                <form onSubmit={handleAddChore}
                className="flex flex-wrap flex-col md:flex-row gap-4 mt-4">
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="chore_due_date" 
                    className="block mb-2 font-semibold">Due Date: </label>
                    <input type="date" id="chore_due_date" name="chore_due_date" 
                    className="p-2 rounded-full bg-amber-100 grow
                     focus:outline-4 focus:outline-emerald-600" 
                     value={newChoreDueDate} onChange={(e) => setNewChoreDueDate(e.target.value)} />
                    </div> 
                     <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="chore_description" 
                    className="block mb-2 font-semibold">Chore Description: </label>
                     <input type="text" id="chore_description" name="chore_description" 
                    className="p-2 rounded-full bg-amber-100 grow
                     focus:outline-4 focus:outline-emerald-600" 
                     value={newChoreDescription} onChange={(e) => setNewChoreDescription(e.target.value)} 
                     placeholder="Pull weeds"
                     required/> 
                     </div>
                     <button type="submit" className="text-amber-200 bg-emerald-600
                        font-bold p-2 rounded-full hover:bg-emerald-700
                        transition-colors duration-300 cursor-pointer">Add Chore</button>
                </form>
            </div>

            {/* Notes */}
            <h2 className="text-xl font-bold mb-4 mt-8">Notes</h2>
                <div className="mt-8 mx-auto max-w-4xl
            p-4 rounded-xl shadow-lg bg-white flex flex-col gap-4 items-center ">
                {notesError && <p className="text-red-500 font-bold text-center mb-4">{notesError}</p>}
                <div className="flex flex-col justify-center items-center gap-4 w-full">
                    {notes.length !== 0 && notes.map((note) => {
        const isEditingNote = note.id === editedNoteId;

        return (
            <div key={note.id} className="flex flex-col sm:flex-row gap-4
             bg-orange-100 hover:bg-emerald-100 p-4 rounded-xl 
             transition-colors duration-300 items-center sm:items-center w-full">
                <div className="flex flex-col items-center">
                    {isEditingNote ? (
                        <div className="flex flex-col items-center gap-2">
                            {(note.photo_url || editedNotePhotoPreview) && <img 
                                src={editedNotePhotoPreview ?? note.photo_url ?? ''} 
                                alt="Note Photo" 
                                className="max-w-xs sm:max-w-sm object-cover rounded-lg" 
                            />}
                            <label htmlFor="note_photo" className="mb-2 font-semibold">Photo <span 
                    className="text-slate-500 font-normal italic">
                        (optional: jpg, jpeg, or png)</span>:</label>
                            <input 
                                type="file" 
                                id="note_photo"
                                className="w-full p-2 rounded-full bg-amber-100 
                                border border-emerald-600 focus:outline-4 
                                focus:outline-emerald-600 file:cursor-pointer 
                                file:bg-emerald-600 hover:file:bg-emerald-700
                                 file:text-white file:rounded-full file:px-4 
                                 file:border-none transition-colors duration-300"
                                accept=".jpg, .jpeg, .png"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];

                                        /* Start Google Gemini generated code */
                                        // Max file size allowed by Cloudinary
                                        const maxFileSize = 10485760; // 10MB
                                        if (file.size > maxFileSize) {
                                            alert('File size exceeds the maximum limit of 10MB. Please choose a smaller file.');
                                            return;
                                        }
                                        /* End Google Gemini generated code */

                                        setEditedNotePhoto(file);
                                        setEditedNotePhotoPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        note.photo_url && (
                            <img src={note.photo_url} alt="Note" className="max-w-xs
                             sm:max-w-sm object-cover rounded-lg mb-2" />
                        )
                    )}
                </div>
                <div className="flex flex-col justify-between items-center
                 h-full w-full min-w-0">
                    <div className="flex flex-col items-center w-full">
                        {isEditingNote ? (<>
                            <label htmlFor="note_description" className="mb-2 font-semibold">Description:</label>
                            <textarea 
                                className="p-2 rounded-xl bg-amber-100
                                 w-full border border-emerald-600 
                                 focus:outline-4 focus:outline-emerald-600 mb-4"
                                 id="note_description"
                                value={editedNoteDescription}
                                onChange={(e) => setEditedNoteDescription(e.target.value)}
                                rows={4}
                            />
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <p className="mb-2 text-center wrap-break-word">{note.description}</p>
                                <p className="text-slate-500 text-xs
                                 text-center mb-4">
                                    {new Date(note.date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                    {isEditingNote ? (
                        <div className="flex flex-col gap-2 items-center
                         w-full mt-auto">
                            <div className="flex gap-2 justify-center w-full">
                                <button 
                                    onClick={() => handleEditNote(note.id)}
                                    className="bg-emerald-600 text-amber-200
                                     font-bold p-2 rounded-full
                                      hover:bg-emerald-700 transition-colors
                                       duration-300 text-sm w-full md:w-auto
                                        px-4 cursor-pointer"
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={() => {
                                        setNotesError('');
                                        setEditedNoteId(null);
                                        setEditedNoteDescription('');
                                        setEditedNotePhoto(null);
                                        setEditedNotePhotoPreview(null);
                                    }}
                                    className="bg-slate-500 text-amber-200
                                     font-bold p-2 rounded-full hover:bg-slate-600
                                      transition-colors duration-300 text-sm w-full
                                       md:w-auto px-4 cursor-pointer"
                                >
                                    Cancel
                                </button>    
                            </div>
                            <div className="w-full flex justify-center">
                                <button type="button" 
                                    onClick={() => setNoteToDelete(note.id)}
                                    className="bg-red-600 text-amber-200
                                     font-bold p-2 rounded-full hover:bg-red-700 
                                     transition-colors duration-300 text-sm w-full
                                      md:w-auto px-4 cursor-pointer"
                                >
                                    Delete
                                </button>
                                {noteToDelete === note.id && <ConfirmDelete setIsActive={() => setNoteToDelete(null)} onConfirm={() => deleteNote(note.id)} item="note"></ConfirmDelete>}
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4 justify-center w-full mt-auto">
                            <button 
                                onClick={() => {
                                    setEditedNoteId(note.id);
                                    setEditedNoteDescription(note.description);
                                    setEditedNotePhotoPreview(note.photo_url ?? null);
                                }}
                                className="bg-amber-600 text-amber-200
                                 font-bold p-2 rounded-full hover:bg-amber-700
                                  transition-colors duration-300 text-sm w-full
                                   md:w-auto px-4 cursor-pointer"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => setNoteToDelete(note.id)}
                                className="bg-red-600 text-amber-200 font-bold 
                                p-2 rounded-full hover:bg-red-700
                                 transition-colors duration-300
                                  text-sm w-full md:w-auto px-4 cursor-pointer"
                            >
                                Delete
                            </button>
                            {noteToDelete === note.id && <ConfirmDelete setIsActive={() => setNoteToDelete(null)} onConfirm={() => deleteNote(note.id)} item="note"></ConfirmDelete>}
                        </div>
                    )}
                </div>
            </div>
        );
    })}
                 </div>
                    
            
                <form onSubmit={handleAddNote}
                className="flex flex-wrap flex-col gap-4 mt-4">
                    {newNotePhotoPreview && (
                        <div className="flex flex-col items-center">
                            <img src={newNotePhotoPreview} alt="New Note Preview" className="max-w-xs sm:max-w-sm object-cover rounded-lg mb-2" />
                        </div>)}
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="note_photo" 
                    className="block mb-2 font-semibold">Photo <span 
                    className="text-slate-500 font-normal italic">
                        (optional: jpg, jpeg, or png)</span>: </label>
                    <input key={notePhotoInputKey} type="file" id="note_photo" name="note_photo" 
                    className="w-full p-2 rounded-full bg-amber-100
                     focus:outline-4 focus:outline-emerald-600 
                     file:cursor-pointer file:bg-emerald-600 
                    hover:file:bg-emerald-700 file:text-white file:rounded-full
                     file:px-4 file:border-none transition-colors duration-300"
                     accept=".jpg, .jpeg, .png" 
                     onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];

                            const maxFileSize = 10485760; // 10MB
                                        if (file.size > maxFileSize) {
                                            alert('File size exceeds the maximum limit of 10MB. Please choose a smaller file.');
                                            return;
                                        }

                            setNewNotePhoto(file); 
                            setNewNotePhotoPreview(URL.createObjectURL(file));  
                        }
                     }} />
                    </div> 
                     <div className="flex flex-col md:flex-row gap-2 items-center">
                        <label htmlFor="note_description" 
                    className="block mb-2 font-semibold">Description: </label>
                     <textarea id="note_description" name="note_description" 
                    className="p-2 rounded-xl bg-amber-100 w-full
                     focus:outline-4 focus:outline-emerald-600"
                     placeholder="Today, I saw a rabbit in my patch. It was so cute! I just hope it doesn't eat my plants." 
                     rows={4}
                     value={newNoteDescription} onChange={(e) => setNewNoteDescription(e.target.value)} 
                     required/>
                     </div>
                     <button type="submit" className="text-amber-200 bg-emerald-600
                        font-bold p-2 rounded-full hover:bg-emerald-700
                        transition-colors duration-300 cursor-pointer">Add Note</button>
                </form>
            </div>
        </>
    );
}

export default Patch;