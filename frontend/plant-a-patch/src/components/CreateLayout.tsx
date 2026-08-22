import { useRef, useState } from "react";
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "react-sketch-canvas";

type createLayoutProps = {
    setIsActive: (value: boolean) => void;
    setLayout: (value: File | null) => void;
}

function CreateLayout({ setIsActive, setLayout }: createLayoutProps) {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [strokeColour, setStrokeColour] = useState("#FFFFFF");
    const [backgroundColour, setBackgroundColour] = useState("#431407");
    const [eraser, setEraser] = useState(false);
    const [error, setError] = useState('');

    return (
        <div className="w-screen h-screen fixed inset-0 z-75
         bg-black/50 flex justify-center items-center">
            <div className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-emerald-100">
                <div className="flex justify-end mb-4">
                    <button type="button"
                     onClick={() => setIsActive(false)}
                    className="text-emerald-600 hover:text-orange-300 
                    font-extrabold text-xl px-2 cursor-pointer"
                    aria-label="Close create patch layout widget">Close ×</button>
                </div>
                {error && <div>
                        <p className="text-red-500 font-bold text-center mb-4">{error}</p>
                    </div>}
                <div className="flex justify-between my-4">
                    <button type="button"
                    onClick={() => canvasRef.current?.undo()}
                    className="bg-amber-200 text-emerald-600
                        font-bold p-2 rounded-full hover:bg-amber-100
                        transition-colors duration-300 cursor-pointer"
                        aria-labelledby="Undo Action">Undo Action</button>
                    <button type="button"
                    onClick={() => canvasRef.current?.redo()}
                    className="bg-amber-200 text-emerald-600
                        font-bold p-2 rounded-full hover:bg-amber-100
                        transition-colors duration-300 cursor-pointer"
                        aria-labelledby="Redo Action">Redo Action</button>
                    <button type="button"
                    onClick={() => canvasRef.current?.clearCanvas()}
                    className="bg-amber-200 text-emerald-600
                        font-bold p-2 rounded-full hover:bg-amber-100
                        transition-colors duration-300 cursor-pointer"
                        aria-labelledby="Clear Canvas">Clear Canvas</button>
                </div>
                <div className="w-full aspect-square">
                    <ReactSketchCanvas
                    ref={canvasRef}
                    width="100%"
                    height="100%"
                    canvasColor={backgroundColour}
                    strokeColor={strokeColour}
                    ></ReactSketchCanvas>
                </div>
                <div className="text-center mt-4">
                    <button type="button"
                    onClick={() => {
                        setEraser(!eraser);
                        canvasRef.current?.eraseMode(!eraser);
                    }}
                    className="bg-amber-200 text-emerald-600
                        font-bold p-2 rounded-full hover:bg-amber-100
                        transition-colors duration-300 cursor-pointer"
                        aria-label="Switch between pen and eraser mode">
                            {eraser ? "Switch to Pen" : "Switch to Eraser"}
                    </button>
                </div>
                <div className="flex justify-between gap-4 mt-4">
                    <div className="flex items-center gap-2">
                    <label htmlFor="stroke_colour" className="font-bold">Stroke Colour: </label>
                    <input type="color" id="stroke_colour" name="stroke_colour"
                     value={strokeColour} onChange={(e) => setStrokeColour(e.target.value)}
                     className="border-2 border-emerald-600 rounded cursor-pointer"/>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="background_colour" className="font-bold">Background Colour: </label>
                    <input type="color" id="background_colour" name="background_colour"
                     value={backgroundColour} onChange={(e) => setBackgroundColour(e.target.value)}
                     className="border-2 border-emerald-600 rounded cursor-pointer"/>
                </div>
                </div>
                <div className="text-center mt-8">
                    <button type="button"
                    onClick={async () => {
                        const dataURL = await canvasRef.current?.exportImage("jpeg");
                        
                        if (!dataURL) {
                            setError("Failed to export layout.")
                            return;
                        }

                        // Start ChaGPT generated code
                        // Convert the dataURL to a Blob
                        const response = await fetch(dataURL);
                        const blob = await response.blob();

                        // Convert the Blob to a File
                        const file = new File([blob], "layout.jpeg", { type: "image/jpeg" });
                        // End ChatGPT generated code

                        // Send the layout file back to the parent component and close the layout creator
                        setLayout(file);                        
                        setIsActive(false);
                    }}
                    className="w-full bg-emerald-600 text-white
                        font-bold p-2 rounded-full hover:bg-emerald-700
                        transition-colors duration-300 cursor-pointer"
                        aria-label="Save patch layout and close widget"
                    >Save Layout</button>
                </div>
            </div>
        </div>

    );
}

export default CreateLayout;