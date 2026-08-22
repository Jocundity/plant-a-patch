import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useState, useEffect } from "react";

function Chatbot() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [prevInteraction, setPrevInteraction] = useState(""); // Hold previous interaction for multi-turn conversations
    const [messages, setMessages] = useState<string []>([]);

    useEffect(() => {
        document.title = 'Plant a Patch | Chatbot';
    }, []);

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(""); // Clear any previous error messages
        setIsLoading(true); // Set loading state to true while waiting for response

        const token = localStorage.getItem('token');
        const apiEndpoint = import.meta.env.VITE_API_URL;
        
        // Send the prompt to Django to fetch a response from the Gemini API
        try {
            const response = await fetch(`${apiEndpoint}/ask_chatbot/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify({
                    prompt: prompt,
                    prev_interaction: prevInteraction,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chatbot.');
            }

            const data = await response.json();
            setPrevInteraction(data.id); // Store the id of the last interaction for multi-turn conversations
            setMessages((prevMessages) => [...prevMessages, prompt, data.message]); // Append the user prompt and chatbot response to the messages array
            setPrompt(""); // Clear the prompt input field

        }
        catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error));
            }
        }
        finally {
            setIsLoading(false); // Reset loading state
        }

    }

    return (<>
        <div className="max-w-lg mx-auto mt-8 
            p-4 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold mb-4 text-center">Chatbot</h1>
                {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
                {messages.length > 0 && 
                    messages.map((message, index) => {
                        const isUserMessage = index % 2 === 0;
                        return (
                            <div key={index} className={`mb-2 p-2 rounded-xl ${isUserMessage ? 'bg-emerald-100 text-right' : 'bg-orange-100 text-left'}`}>
                                <ReactMarkdown rehypePlugins={[remarkGfm]}>{message}</ReactMarkdown>
                            </div>
                        );
                    })}
                {isLoading && <p className="text-center mb-4 motion-safe:animate-pulse">Loading response...</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="prompt" className="block mb-2 
                    font-semibold">Prompt:</label>
                    <textarea id="prompt" name="prompt" 
                    className="w-full p-2 rounded-xl bg-amber-100
                     focus:outline-4 focus:outline-emerald-600" 
                     value={prompt} onChange={(e) => setPrompt(e.target.value)}
                     placeholder="How often do I need to water my tomatoes?"
                     rows={4}
                     required ></textarea>
                </div>
                <button type="submit" className="w-full bg-emerald-600
                 text-white p-2 rounded-full hover:bg-emerald-700 
                 transition-colors duration-300 cursor-pointer">Submit</button>
            </form>
        </div>
    </>);
}

export default Chatbot;