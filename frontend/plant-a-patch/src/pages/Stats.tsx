import { useState, useEffect } from "react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";


type Harvest = {
    id: number;
    crop: number;
    crop_type: string;
    patch_name: string;
    harvest_date: string;
    quantity: number;
    total: number;
}

type Crop = {
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

type Expense = {
    id: number;
    patch: number;
    patch_name: string;
    date: string;
    amount: number;
    description: string;
    category: string;
}


// Group expenses by category
type CategoryExpenses = { 
    category: string;
    amount: number
}

// Group expenses by patch
type PatchExpenses = { 
    patch_name: string;
    amount: number
}

// Group deaths by crop type
type CropDeaths = {
    crop_type: string;
    number_dead: number;
}

// Group deaths by patch
type PatchDeaths = {
    patch_name: string;
    number_dead: number;
}


function Stats() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [harvested, setHarvested] = useState<Harvest[]>([]);
    const [deaths, setDeaths] = useState<Crop[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    // Group harvested by crop type and patch for the line chart
    const cropTypes = Array.from(new Set(harvested.map(harvest => harvest.crop_type)));
    const patchNames = Array.from(new Set(harvested.map(harvest => harvest.patch_name)));
    const harvestedPerCrop = groupHarvestedByCrop(harvested);
    const harvestedPerPatch = groupHarvestedByPatch(harvested);

    // Group deaths by crop type and patch for the bar chart
    const deathsPerCrop: CropDeaths[] = groupDeathsByCrop(deaths);
    const deathsPerPatch: PatchDeaths[] = groupDeathsByPatch(deaths);

    // Group expenses by category and patch for the bar chart
    const expensesPerCategory: CategoryExpenses[] = groupExpensesByCategory(expenses);
    const expensesPerPatch: PatchExpenses[] = groupExpensesByPatch(expenses);

    // Totals
    const totalHarvested = harvested.reduce((total, harvest) => total + Number(harvest.quantity), 0);
    const totalDeaths = deaths.reduce((total, death) => total + Number(death.number_dead), 0);
    const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);

    useEffect(() => {
        document.title = 'Plant a Patch | Stats';
    })

    useEffect(() => {
        const token = localStorage.getItem("token");
        const apiEndpoint = import.meta.env.VITE_API_URL;

        async function fetchHarvests() {
            // Fetch the harvesrs from Django
            try {
                const response = await fetch(`${apiEndpoint}/harvests/`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Token ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch harvests`);
                }

                const data = await response.json();
                setHarvested(data);
            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(String(error));
                }
            }
            
        }

        async function fetchCrops() {
            // Fetch the crops from Django
            try {
                const response = await fetch(`${apiEndpoint}/crops/`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Token ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch crops`);
                }

                const data = await response.json();
                setDeaths(data);
            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(String(error));
                }
            }
            
        }

        async function fetchExpenses() {
            // Fetch the expenses from Django
            try {
                const response = await fetch(`${apiEndpoint}/expenses/`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Token ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch expenses`);
                }

                const data = await response.json();
                setExpenses(data);
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

        fetchHarvests();
        fetchCrops();
        fetchExpenses();
    }, []);

    // Start ChatGPT generated code
    function groupHarvestedByCrop(harvests: Harvest[]) {
    // Sort harvests by date (oldest first)
    const sortedHarvests = [...harvests].sort(
        (a, b) =>
            new Date(a.harvest_date).getTime() -
            new Date(b.harvest_date).getTime()
    );

    // Store grouped data by date
    const grouped: Record<string, any> = {};

    sortedHarvests.forEach((harvest) => {
        const { harvest_date, crop_type, quantity } = harvest;

        // Create a new date entry if it does not exist
        if (!grouped[harvest_date]) {
            grouped[harvest_date] = {
                harvest_date,
            };

            // Add every crop with a default value of 0
            cropTypes.forEach((crop) => {
                grouped[harvest_date][crop] = 0;
            });
        }

        // Add the harvested quantity to the correct crop
        grouped[harvest_date][crop_type] += Number(quantity);
    });

    // Convert object into array for Recharts
    return Object.values(grouped);
} // End ChatGPT generated code

 function groupHarvestedByPatch(harvests: Harvest[]) {
    // Sort harvests by date (oldest first)
    const sortedHarvests = [...harvests].sort(
        (a, b) =>
            new Date(a.harvest_date).getTime() -
            new Date(b.harvest_date).getTime()
    );

    // Store grouped data by date
    const grouped: Record<string, any> = {};

    sortedHarvests.forEach((harvest) => {
        const { harvest_date, patch_name, quantity } = harvest;

        // Create a new date entry if it does not exist
        if (!grouped[harvest_date]) {
            grouped[harvest_date] = {
                harvest_date,
            };

            // Add every patch with a default value of 0
            patchNames.forEach((crop) => {
                grouped[harvest_date][crop] = 0;
            });
        }

        // Add the harvested quantity to the correct patch
        grouped[harvest_date][patch_name] += Number(quantity);
    });

    // Convert object into array for Recharts
    return Object.values(grouped);
}



    function groupDeathsByCrop(deaths: Crop[]): CropDeaths[]{
        // Group deaths by crop type and sum the amount for each crop type

        const result: CropDeaths[] = [];

        // Create a map with the crop as the key and the total amount as the value
        const cropAmountMap: Record<string, number> = {};
        
        // Loop through the deaths array and add the amount the corresponding crop type in the map
        deaths.forEach(death => {
            if (cropAmountMap[death.crop_type]) {
                cropAmountMap[death.crop_type] += Number(death.number_dead);
            } else {
                cropAmountMap[death.crop_type] = Number(death.number_dead);
            }
        });

        // Loop through the map to create an array of objects
        for (const crop in cropAmountMap) {
            result.push({crop_type: crop, number_dead: cropAmountMap[crop]});
        }

        return result;
    }

    function groupDeathsByPatch(deaths: Crop[]): PatchDeaths[]{
        // Group deaths by patch and sum the amount for each patch

        const result: PatchDeaths[] = [];

        // Create a map with the crop as the key and the total amount as the value
        const cropAmountMap: Record<string, number> = {};
        
        // Loop through the deaths array and add the amount the corresponding patch in the map
        deaths.forEach(death => {
            if (cropAmountMap[death.patch_name]) {
                cropAmountMap[death.patch_name] += Number(death.number_dead);
            } else {
                cropAmountMap[death.patch_name] = Number(death.number_dead);
            }
        });

        // Loop through the map to create an array of objects
        for (const patch in cropAmountMap) {
            result.push({patch_name: patch, number_dead: cropAmountMap[patch]});
        }

        return result;
    }

    
    function groupExpensesByCategory(expenses: Expense[]): CategoryExpenses[]{
        // Group expenses by category and sum the amount in each category

        const result: CategoryExpenses[] = [];

        // Create a map with the category as the key and the total amount as the value
        const categoryAmountMap: Record<string, number> = {};
        
        // Loop through the expenses array and add the amount the corresponding category in the map
        expenses.forEach(expense => {
            if (categoryAmountMap[expense.category]) {
                categoryAmountMap[expense.category] += Number(expense.amount);
            } else {
                categoryAmountMap[expense.category] = Number(expense.amount);
            }
        });

        // Loop through the map to create an array of objects
        for (const category in categoryAmountMap) {
            result.push({category: category, amount: categoryAmountMap[category]});
        }

        return result;
    }

    function groupExpensesByPatch(expenses: Expense[]): PatchExpenses[]{
        // Group expenses by patch and sum the amount in each patch

        const result: PatchExpenses[] = [];

        // Create a map with the patch as the key and the total amount as the value
        const patchAmountMap: Record<string, number> = {};
        
        // Loop through the expenses array and add the amount the corresponding patch in the map
        expenses.forEach(expense => {
            if (patchAmountMap[expense.patch_name]) {
                patchAmountMap[expense.patch_name] += Number(expense.amount);
            } else {
                patchAmountMap[expense.patch_name] = Number(expense.amount);
            }
        });

        // Loop through the map to create an array of objects
        for (const patch in patchAmountMap) {
            result.push({patch_name: patch, amount: patchAmountMap[patch]});
        }

        return result;
    }

    // Random colour generator for the line chart
    function getRandomColour(): string {
        const r: number = Math.floor(Math.random() * 200);
        const g: number = Math.floor(Math.random() * 200);
        const b: number = Math.floor(Math.random() * 200);

        return `rgb(${r}, ${g}, ${b})`;
    }

    return (
        <>
            <h1 className="text-2xl font-bold mb-4 text-center">Statistics</h1>
            {isLoading && <p className="text-center motion-safe:animate-pulse">Loading...</p>}
            {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
            {/* Harvested */}
            <div className="flex flex-row flex-wrap gap-4 justify-between items-center mt-8">
                <h2 className="text-xl font-bold text-center">Number Harvested</h2>
                <h2 className="text-xl font-bold text-center text-emerald-600
                    bg-amber-200 p-2 rounded-full
                    ">Total Number Harvested: {totalHarvested}</h2>
            </div>
             <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                    <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold text-center">Number Harvested per Crop Type</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={harvestedPerCrop}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="harvest_date"
                                tickFormatter={(date) =>
                                    new Date(date).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                })}
                             />
                            <YAxis />
                            <Tooltip 
                                cursor={{ fill: "oklch(98.7% 0.022 95.277)" }}
                                labelFormatter={(date) =>
                            new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    } 
                                />
                            <Legend />
                            {cropTypes.map((cropType) => (
                                <Line
                                    key={cropType}
                                    type="monotone"
                                    dataKey={cropType}
                                    name={cropType}
                                    stroke={getRandomColour()}
                                    strokeWidth={2}
                                    activeDot={{ r: 8 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold text-center">Number Harvested per Patch</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={harvestedPerPatch}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="harvest_date"
                                tickFormatter={(date) =>
                                    new Date(date).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                })}
                             />
                            <YAxis />
                            <Tooltip 
                                cursor={{ fill: "oklch(98.7% 0.022 95.277)" }}
                                labelFormatter={(date) =>
                            new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    } />
                            <Legend />
                            {patchNames.map((patchName) => (
                                <Line
                                    key={patchName}
                                    type="monotone"
                                    dataKey={patchName}
                                    name={patchName}
                                    stroke={getRandomColour()}
                                    strokeWidth={2}
                                    activeDot={{ r: 8 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            {/* Plant Deaths */}
            <div>
                <div className="flex flex-row flex-wrap gap-4 justify-between items-center mt-8">
                    <h2 className="text-xl font-bold text-center">Plant Deaths</h2>
                    <h2 className="text-xl font-bold text-center text-emerald-600
                    bg-amber-200 p-2 rounded-full
                    ">Total Plant Deaths: {totalDeaths}</h2>
                </div>
                <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                    <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold text-center">Plant Deaths per Crop Type</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={deathsPerCrop}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="crop_type" />
                            <YAxis />
                            <Tooltip cursor={{ fill: "oklch(98.7% 0.022 95.277)" }} />
                            <Legend />
                            <Bar dataKey="number_dead"
                            name="Number Dead" 
                            fill="oklch(59.6% 0.145 163.225)"
                            activeBar={{ fill: "oklch(83.7% 0.128 66.29)" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold text-center">Plant Deaths per Patch</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={deathsPerPatch}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="patch_name" />
                            <YAxis />
                            <Tooltip cursor={{ fill: "oklch(98.7% 0.022 95.277)" }} />
                            <Legend />
                            <Bar dataKey="number_dead"
                            name="Number Dead" 
                            fill="oklch(59.6% 0.145 163.225)"
                            activeBar={{ fill: "oklch(83.7% 0.128 66.29)" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
            {/* Expenses */}
            <div>
                <div className="flex flex-row flex-wrap gap-4 justify-between items-center mt-8">
                    <h2 className="text-xl font-bold text-center">Expenses</h2>
                    <h2 className="text-xl font-bold text-center text-emerald-600
                    bg-amber-200 p-2 rounded-full
                    ">Total Expenses: {totalExpenses.toFixed(2)}</h2>
                </div>
                <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                    <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold text-center">Expenses per Category</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={expensesPerCategory}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip cursor={{ fill: "oklch(98.7% 0.022 95.277)" }} />
                            <Legend />
                            <Bar dataKey="amount" 
                            name="Amount"
                            fill="oklch(59.6% 0.145 163.225)"
                            activeBar={{ fill: "oklch(83.7% 0.128 66.29)" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold text-center">Expenses per Patch</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={expensesPerPatch}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="patch_name" />
                            <YAxis />
                            <Tooltip cursor={{ fill: "oklch(98.7% 0.022 95.277)" }} />
                            <Legend />
                            <Bar dataKey="amount"
                            name="Amount" 
                            fill="oklch(59.6% 0.145 163.225)"
                            activeBar={{ fill: "oklch(83.7% 0.128 66.29)" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 </div>
            </div>
        </>
    );
}

export default Stats;