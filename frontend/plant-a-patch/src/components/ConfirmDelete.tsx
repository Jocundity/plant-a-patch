type ConfirmDeleteProps = {
    setIsActive: (value: boolean) => void;
    onConfirm: () => void;
    item: string;
}

function ConfirmDelete({ setIsActive, onConfirm, item }: ConfirmDeleteProps) {

    function handleConfirm() {
        onConfirm(); // Execute the passed in delete function
        setIsActive(false); // Close the modal
    }

    return (
        <div className="w-screen h-screen fixed inset-0 z-75
         bg-black/50 flex justify-center items-center">
            <div className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <div className="flex justify-end mb-4">
                    <button type="button"
                     onClick={() => setIsActive(false)}
                    className="text-amber-500 hover:text-amber-600 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Close create patch layout widget">Close ×</button>
                </div>
                <div className="text-center">
                    <p>Are you sure you want to delete this {item}?</p>
                </div>
                <div className="flex justify-between gap-4 mt-4">
                    <button type="button"
                    className="bg-red-600 text-amber-200 font-bold p-2 rounded-full
                     hover:bg-red-700 transition-colors duration-300"
                    onClick={handleConfirm}>Delete</button>
                    <button type="button"
                    className="bg-slate-500 text-amber-200 font-bold p-2 rounded-full
                     hover:bg-slate-600 transition-colors duration-300"
                     onClick={() => setIsActive(false)}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDelete;