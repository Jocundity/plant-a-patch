import { useEffect } from 'react';
import gardenbedhands from '../assets/gardenbedhands.jpg';
import patch from '../assets/patch.png';
import weather from '../assets/weather.png';
import chat from '../assets/chat.png';
import diseaseid from '../assets/diseaseid.png';
import stats from '../assets/stats.png';

function Home() {

    useEffect(() => {
        document.title = 'Plant a Patch | Home';
    }, []);

    return (
        <>
        <div className="relative h-125 bg-cover bg-center 
        rounded-xl text-white text-center overflow-hidden shadow-lg mb-4"
        style={{backgroundImage: `url(${gardenbedhands})`}}>
            <div className="absolute inset-0 bg-black/60">
                <div className="flex flex-col h-full 
                justify-center items-center p-4">
                    <p className="text-3xl font-thin text-amber-100">Welcome to</p>
                    <h1 className="text-6xl font-bold text-emerald-100 
                    underline decoration-orange-300 decoration-4 
                    decoration-wavy underline-offset-4 mb-2">Plant a Patch</h1>
                      <p>Your guide to all things that grow</p>
                </div>
            </div>
        </div>
        <h2 className="text-2xl font-bold text-center">Features</h2>
        <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-4 mb-4
            p-4 rounded-xl shadow-lg bg-white">
                <div>
                    <img src={patch} alt="patch page screenshot"
                     className="max-w-80 rounded-lg shadow-lg"/>
                </div>
                <div className="flex flex-col justify-center items-center text-center gap-4">
                    <h3 className="text-xl font-bold text-center
                     text-emerald-600 underline decoration-orange-300 
                     decoration-2 decoration-wavy underline-offset-6 mb-2">
                        Create a patch and keep track of everything.
                    </h3>
                    <p>Log your crops, how many die, and how many and when you're able to harvest fruit from them. Can't remember when the seed packet said they'd be ready? Don't worry! We'll calculate the harvest rate for you. </p>
                    <p>Set up watering and fertilising schedules. We'll remind you when they're due, so you never forget. </p>
                    <p>Keep track of your expenses, so you know how much money you're spending and what you're spending it on. </p>
                    <p>Set up a list of chores and tick them off once you've completed them. </p>
                    <p>Take photos and notes of important milestones and things you're concerned about, so you never forget. </p>
                </div>
            </div>
            <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-8 mb-4
            p-4 rounded-xl shadow-lg bg-white">
                <div className="md:order-2">
                    <img src={weather} alt="weather widget screenshot"
                     className="max-w-80 rounded-lg shadow-lg"/>
                </div>
                <div className="flex flex-col justify-center items-center text-center gap-4">
                    <h3 className="text-xl font-bold text-center
                     text-emerald-600 underline decoration-orange-300 
                     decoration-2 decoration-wavy underline-offset-6 mb-2">
                        Get ahead of the weather and protect your crops.
                    </h3>
                    <p>We'll show you your weekly forecast and alert you of any time it's going to be hot, cold, or rainy, so you can plan to take care of your crops accordingly. </p>
                    <p>We'll also use last year's weather data to predict this year's spring and autumn frost dates, so you don't lose your plants to a chilly night.</p>
                    <p>Our weather alerts work anywhere in the world, so you don't have to worry about what country you're in. Just type in your city, and you're all set! Our frost alerts work for both the northern and southern hemispheres, and we're happy to give you the temperature in either Celsius or Fahrenheit.</p>  
                </div>
            </div>
            <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-8 mb-4
            p-4 rounded-xl shadow-lg bg-white">
                <div>
                    <img src={chat} alt="chatbot page screenshot"
                     className="max-w-80 rounded-lg shadow-lg"/>
                </div>
                <div className="flex flex-col justify-center items-center text-center gap-4">
                    <h3 className="text-xl font-bold text-center
                     text-emerald-600 underline decoration-orange-300 
                     decoration-2 decoration-wavy underline-offset-6 mb-2">
                        Ask for and receive advice that's personalised to you.
                    </h3>
                    <p>Our chatbot knows what you're growing and where your patch is located, so you can ask it for advice based on your crops and your region. </p>
                    <p>Our growing guides are also LLM-powered to help you learn more about growing crops in your area. Cick on one to receive care instructions, learn about common pests and diseases, and find out which crops you should plant next to each other and which ones you should keep far apart. </p>   
                </div>
            </div>
            <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-8 mb-4
            p-4 rounded-xl shadow-lg bg-white">
                <div className="md:order-2">
                    <img src={diseaseid} alt="disease identifier page screenshot"
                     className="max-w-80 rounded-lg shadow-lg"/>
                </div>
                <div className="flex flex-col justify-center items-center text-center gap-4">
                    <h3 className="text-xl font-bold text-center
                     text-emerald-600 underline decoration-orange-300 
                     decoration-2 decoration-wavy underline-offset-6 mb-2">
                        Snap a photo of a spotty leaf to get a diagnosis and treatment for the disease.
                    </h3>
                    <p>Our plant disease identifier feature allows you to upload a photo of any foliage that doesn't look quite right. We'll diagnose the problem and tell you how to get your plant healthy again. </p>
                    <p>Are you environmentally conscious? Don't worry! We provide organic treatment options too.</p>
                </div>
            </div>
            <div className="flex flex-col
                 md:flex-row justify-center items-center gap-4 mt-8 mb-4
            p-4 rounded-xl shadow-lg bg-white">
                <div>
                    <img src={stats} alt="stats page screenshot" 
                    className="max-w-80 rounded-lg shadow-lg"/>
                </div>
                <div className="flex flex-col justify-center 
                items-center text-center gap-4">
                    <h3 className="text-xl font-bold text-center
                     text-emerald-600 underline decoration-orange-300 
                     decoration-2 decoration-wavy underline-offset-6 mb-2">
                        Look at statistics and graphs to see how your patches and crops are doing.
                    </h3>
                    <p>Our statistics page provides you with a quick way to compare your patches and crops. Take a glance at the bar charts to compare expenses and crop deaths. </p>
                    <p>Wondering about how productive your plants are? Check out the line graphs to see your harvests over time for each patch and each crop.</p>
                </div>
            </div>

        </>
    );

}

export default Home;