import { useState } from 'react';
import type { Crop, Harvest } from '../pages/Patch';
import ConfirmDelete from './ConfirmDelete';

type CropCardProps = {
    crop: Crop;
    cropOptions: string[];

    onUpdateCrop: (
        cropId: number,
        updatedCrop: {
            crop_type: string;
            crop_variety: string | null;
            planted_date: string;
            number_planted: string | null;
            number_dead: string;
        }
    ) => Promise<void>;

    onDeleteCrop: (cropId: number) => Promise<void>;

    harvests: Harvest[];
    harvestTotal: number;

    onAddHarvest: (
        cropId: number,
        harvestDate: string,
        quantity: string,
    ) => Promise<void>;

    onDeleteHarvest: (harvestId: number) => Promise<void>;

    onUpdateHarvest: (harvestId: number, editingHarvestDate: string, editingHarvestQuantity: string) => Promise<void>;

    
};

function CropCard({
    crop,
    cropOptions,
    onUpdateCrop,
    onDeleteCrop,
    harvests,
    harvestTotal,
    onAddHarvest,
    onDeleteHarvest,
    onUpdateHarvest,
    
}: CropCardProps) {
    // Variable for the confirm delete modal
    const [isActive, setIsActive] = useState(false);

    // Variables for editing crops
    const [isEditing, setIsEditing] = useState(false);
    const [cropError, setCropError] = useState('');    
    const [cropType, setCropType] = useState(crop.crop_type);
    const [cropVariety, setCropVariety] = useState(crop.crop_variety ?? '');
    const [cropPlantedDate, setCropPlantedDate] = useState(crop.planted_date);
    const [numberPlanted, setNumberPlanted] = useState(
        crop.number_planted?.toString() ?? ''
    );
    const [numberDead, setNumberDead] = useState(
        crop.number_dead.toString()
    );

    // Variables for adding, editing, and deleting harvests
    const [harvestError, setHarvestError] = useState('');
    const [newHarvestDate, setNewHarvestDate] = useState('');
    const [newHarvestQuantity, setNewHarvestQuantity] = useState('');
    const [editingHarvestId, setEditingHarvestId] = useState<number | null>(null);
    const [editingHarvestDate, setEditingHarvestDate] = useState('');
    const [editingHarvestQuantity, setEditingHarvestQuantity] = useState('');
    const [harvestToDelete, setHarvestToDelete] = useState<number | null>(null);

    async function saveCrop() {
        setCropError('');

        if (!cropType) {
            setCropError('Crop type is required.');
            return;
        }

        if (!cropPlantedDate) {
            setCropError('Planted date is required.');
            return;
        }

        try {
            await onUpdateCrop(crop.id, {
                crop_type: cropType,
                crop_variety: cropVariety === '' ? null : cropVariety,
                planted_date: cropPlantedDate,
                number_planted: numberPlanted === '' ? null : numberPlanted,
                number_dead: numberDead,
            });

            setIsEditing(false);
        }
        catch (error) {
            if (error instanceof Error) {
                setCropError(error.message);
            }
        }
    }

    async function addHarvest(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setHarvestError('');

        try {
            await onAddHarvest(
                crop.id,
                newHarvestDate,
                newHarvestQuantity
            );

            setNewHarvestDate('');
            setNewHarvestQuantity('');
        } catch (error) {
            if (error instanceof Error) {
                setHarvestError(error.message);
            }
        }
    }

    function cancelEdit() {
        setIsEditing(false);
        setCropType(crop.crop_type);
        setCropVariety(crop.crop_variety ?? '');
        setCropPlantedDate(crop.planted_date);
        setNumberPlanted(crop.number_planted?.toString() ?? '');
        setNumberDead(crop.number_dead.toString());
    }

    async function deleteHarvest(harvestId: number) { 
        setHarvestError('');

        try {
            await onDeleteHarvest(harvestId);
        }
        catch (error) {
            if (error instanceof Error) {
                setHarvestError(error.message);
            } else {
                setHarvestError(String(error));
            }
        }


    }

    async function saveHarvest(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        
        if (editingHarvestId === null) return;

        setHarvestError('');

        try {
            await onUpdateHarvest(editingHarvestId, editingHarvestDate, editingHarvestQuantity);

            // Reset editing state
            setEditingHarvestId(null);
            setEditingHarvestDate('');
            setEditingHarvestQuantity('');
        }
        catch (error) {
            if (error instanceof Error) {
                setHarvestError(error.message);
            } else {
                setHarvestError(String(error));
            }
        }
    }

    return (
        <div className="bg-orange-100 hover:bg-emerald-100
         transition-colors p-4 rounded-xl">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex justify-center">
                    <img
                        src={crop.crop_photo_url}
                        alt={`${crop.crop_type} photo`}
                        className="max-w-3xs object-cover rounded-lg"
                    />
                </div>

                <div className="flex justify-between gap-4 w-full">
                    {cropError && (
                        <p className="text-red-500 font-bold">
                            {cropError}
                        </p>
                    )}

                    {isEditing ? (
                        <div className="flex flex-col gap-4 w-full">
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold" htmlFor="cropType">Crop Type:</label>
                                <select id="cropType"
                                    value={cropType}
                                    onChange={(e) => setCropType(e.target.value)}
                                    className="w-full md:flex-1 px-4 py-2
                                     appearance-none rounded-full cursor-pointer
                                      bg-amber-100 focus:outline-4
                                       focus:outline-emerald-600 border
                                        border-emerald-600" required
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

                            <div className="flex flex-col gap-2">
                                <label className="font-semibold" htmlFor="cropVariety">Variety <span className="font-normal text-slate-500 italic">(optional)</span>:</label>
                                <input id="cropVariety"
                                    type="text"
                                    value={cropVariety}
                                    onChange={(e) => setCropVariety(e.target.value)}
                                    placeholder="Sungold"
                                    className="p-2 rounded-full bg-amber-100 
                                    focus:outline-4 focus:outline-emerald-600 
                                    border border-emerald-600"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-semibold" htmlFor="cropPlantedDate">Planted Date:</label>
                                <input id="cropPlantedDate"
                                    type="date"
                                    value={cropPlantedDate}
                                    onChange={(e) => setCropPlantedDate(e.target.value)}
                                    className="p-2 rounded-full bg-amber-100 
                                    focus:outline-4 focus:outline-emerald-600
                                     border border-emerald-600" required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-semibold" htmlFor="numberPlanted">Number Planted <span className="font-normal text-slate-500 italic">(optional)</span>:</label>    
                                <input id="numberPlanted"
                                    type="number"
                                    min={1} step={1}
                                    value={numberPlanted}
                                    onChange={(e) => setNumberPlanted(e.target.value)}
                                    placeholder="1"
                                    className="p-2 rounded-full bg-amber-100
                                     focus:outline-4 focus:outline-emerald-600
                                      border border-emerald-600"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-semibold" htmlFor="numberDead">Number Dead <span className="font-normal text-slate-500 italic">(optional)</span>:</label>
                                <input id="numberDead"
                                    type="number"
                                    min={0} step={1}
                                    value={numberDead}
                                    onChange={(e) => setNumberDead(e.target.value)}
                                    placeholder="0"
                                    className="p-2 rounded-full bg-amber-100
                                     focus:outline-4 focus:outline-emerald-600
                                      border border-emerald-600"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={saveCrop}
                                    className="bg-emerald-600 text-amber-200
                                     font-bold p-2 rounded-full hover:bg-emerald-700
                                      transition-colors duration-300 text-sm 
                                      w-full md:w-auto cursor-pointer"
                                >
                                    Save
                                </button>

                                <button
                                    onClick={cancelEdit}
                                    className="bg-slate-500 text-amber-200
                                     font-bold p-2 rounded-full
                                      hover:bg-slate-600 transition-colors
                                       duration-300 text-sm w-full
                                        md:w-auto cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full">
                            <div>
                                <p>
                                    <span className="font-semibold">Crop Type:</span> {crop.crop_type}
                                </p>
                                {crop.crop_variety && (
                                    <p>
                                        <span className="font-semibold">Variety:</span> {crop.crop_variety}
                                    </p>
                                )}
                                {crop.planted_date && (
                                    <p>
                                        <span className="font-semibold">Planted Date:</span> {new Date(crop.planted_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                )}
                                {crop.estimated_harvest_date && (
                                    <p>
                                        <span className="font-semibold">Estimated Harvest Date:</span> {!isNaN(new Date(crop.estimated_harvest_date).getTime()) ? new Date(crop.estimated_harvest_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : crop.estimated_harvest_date}
                                    </p>
                                )}
                                {crop.number_planted && (
                                    <p>
                                        <span className="font-semibold">Number Planted:</span> {crop.number_planted}
                                    </p>
                                )}
                                <p>
                                    <span className="font-semibold">Number Dead:</span> {crop.number_dead}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-amber-600 text-amber-200
                                     font-bold p-2 rounded-full hover:bg-amber-700
                                      transition-colors duration-300 text-sm 
                                      w-full md:w-auto cursor-pointer"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => setIsActive(true)}
                                    className="bg-red-600 text-amber-200
                                     font-bold p-2 rounded-full hover:bg-red-700
                                      transition-colors duration-300 text-sm
                                       w-full md:w-auto cursor-pointer"
                                >
                                    Delete
                                </button>
                                {isActive && <ConfirmDelete setIsActive={setIsActive} onConfirm={() => onDeleteCrop(crop.id)} item="crop"></ConfirmDelete>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg">
                {harvestError && (
                    <p className="text-red-500 font-bold text-center">
                        {harvestError}
                    </p>
                )}
                <p className="text-lg text-center">
                    <span className="font-semibold">Total Harvest:</span> {harvestTotal}
                </p>
                {harvests.length > 0 && (
                    <div className="flex flex-col flex-wrap gap-4 justify-center items-center pt-4 w-full">
                        {harvests.map((harvest) => (
                            <div key={harvest.id} className="flex flex-col sm:flex-row
                             gap-4 items-center justify-between
                              bg-emerald-100 hover:bg-orange-100
                            transition-colors duration-300 p-2 rounded-lg w-full">
                                {editingHarvestId === harvest.id ? (
                                    <>
                                        <div>
                                            <label className="font-semibold" htmlFor={`editDate-${harvest.id}`}>Harvest Date: </label>
                                            <input type="date" id={`editDate-${harvest.id}`} value={editingHarvestDate}
                                                onChange={(e) => setEditingHarvestDate(e.target.value)}
                                                className="p-2 rounded-full
                                                 bg-amber-100 grow focus:outline-4
                                                  focus:outline-emerald-600
                                                  border
                                                  border-emerald-600" required
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold" htmlFor={`editQty-${harvest.id}`}>Quantity: </label>
                                            <input type="number" id={`editQty-${harvest.id}`} min={1} step={1} placeholder="1"
                                                value={editingHarvestQuantity}
                                                onChange={(e) => setEditingHarvestQuantity(e.target.value)}
                                                className="p-2 rounded-full
                                                 bg-amber-100 grow
                                                  focus:outline-4
                                                   focus:outline-emerald-600
                                                   border
                                                   border-emerald-600"
                                                    required
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={saveHarvest}
                                                className="bg-emerald-600
                                                 text-amber-200 font-bold p-2
                                                  rounded-full hover:bg-emerald-700
                                                   transition-colors duration-300
                                                    text-sm w-full md:w-auto
                                                     cursor-pointer"
                                            >
                                                Save
                                            </button>
                                            <button 
                                                type="button"
                                                className="bg-slate-500
                                                 text-amber-200 font-bold p-2
                                                  rounded-full hover:bg-slate-600
                                                   transition-colors duration-300 
                                                   text-sm w-full md:w-auto
                                                    cursor-pointer"
                                                onClick={() => {
                                                    setEditingHarvestId(null);
                                                    setEditingHarvestDate('');
                                                    setEditingHarvestQuantity('');
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p>
                                            <span className="font-semibold">Date:</span>{" "}
                                            {new Date(harvest.harvest_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Quantity:</span> {harvest.quantity}
                                        </p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    setEditingHarvestId(harvest.id);
                                                    setEditingHarvestDate(harvest.harvest_date);
                                                    setEditingHarvestQuantity(harvest.quantity.toString());
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

                                            <button
                                                onClick={() =>  setHarvestToDelete(harvest.id)}
                                                className="bg-red-600
                                                 text-amber-200 font-bold p-2
                                                  rounded-full hover:bg-red-700
                                                   transition-colors duration-300
                                                    text-sm w-full md:w-auto
                                                     cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                            {harvestToDelete === harvest.id && <ConfirmDelete setIsActive={() => setHarvestToDelete(null)} onConfirm={() => deleteHarvest(harvest.id)} item="harvest"></ConfirmDelete>}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={addHarvest}
                className="flex-col sm:flex-row flex flex-wrap gap-4
                 justify-center items-center pt-4">
                <div>
                    <label className="font-semibold" htmlFor="harvestDate">
                        Harvest Date: </label>
                    <input type="date" id="harvestDate" value={newHarvestDate}
                        onChange={(e) => setNewHarvestDate(e.target.value)}
                        className="p-2 rounded-full bg-amber-100 grow
                         focus:outline-4 focus:outline-emerald-600 border
                          border-emerald-600" required
                    />
                </div>

                <div>
                    <label className="font-semibold" htmlFor="harvestQuantity">
                        Quantity: </label>
                    <input type="number" id="harvestQuantity" min={1} step={1} placeholder="1"
                        value={newHarvestQuantity}
                        onChange={(e) => setNewHarvestQuantity(e.target.value)}
                        className="p-2 rounded-full bg-amber-100 grow
                         focus:outline-4 focus:outline-emerald-600
                          border border-emerald-600" required
                    />
                </div>

                <button type="submit"
                    className="bg-emerald-600 text-amber-200 font-bold p-2
                     rounded-full hover:bg-emerald-700 
                     transition-colors duration-300 cursor-pointer">
                    Add Harvest
                </button>
            </form>
        </div>
    );
}

export default CropCard;