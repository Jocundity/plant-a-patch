import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Alerts from './components/Alerts';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreatePatch from './pages/CreatePatch';
import Patch from './pages/Patch';
import Stats from './pages/Stats';
import PlantDiseaseIdentifier from './pages/PlantDiseaseIdentifier';
import Chatbot from './pages/Chatbot';
import GrowingGuides from './pages/GrowingGuides';
import CropGrowingGuide from './pages/CropGrowingGuide';
import Footer from './components/Footer';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('token') !== null);

  const [patchId, setPatchId] = useState(0)
  const [schedulesVersion, setSchedulesVersion] = useState(0); // Use to trigger re-fetching of watering/fertilising schedules when a schedule is marked as completed
  const [cropsVersion, setCropsVersion] = useState(0); 

  // Variables for weather alerts
  const [isRainingOn, setIsRainingOn] = useState('');
  const [isHotOn, setIsHotOn] = useState('');
  const [isFreezingOn, setIsFreezingOn] = useState('');


  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}/>
      {isLoggedIn && (
        <Alerts 
          isRainingOn={isRainingOn}
          setIsRainingOn={setIsRainingOn}
          isHotOn={isHotOn}
          setIsHotOn={setIsHotOn}
          isFreezingOn={isFreezingOn}
          setIsFreezingOn={setIsFreezingOn} 
          schedulesVersion={schedulesVersion}
          setSchedulesVersion={setSchedulesVersion}
          cropsVersion={cropsVersion}
        />
      )}
      <main className="grow p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn}/>} />
          <Route path="/signup" element={<Signup setIsLoggedIn={setIsLoggedIn}/>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard 
            setPatchId={setPatchId} 
            setIsRainingOn={setIsRainingOn} 
            setIsHotOn={setIsHotOn} 
            setIsFreezingOn={setIsFreezingOn}
            setSchedulesVersion={setSchedulesVersion}
            setCropsVersion={setCropsVersion}
            /></ProtectedRoute>} />
          <Route path="/createpatch" element={<ProtectedRoute><CreatePatch setPatchId={setPatchId} /></ProtectedRoute>} />
          <Route path="/patch/:id/" element={<ProtectedRoute><Patch schedulesVersion={schedulesVersion} setCropsVersion={setCropsVersion}/></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/plant-disease-identifier" element={<ProtectedRoute><PlantDiseaseIdentifier /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/growing-guides" element={<ProtectedRoute><GrowingGuides /></ProtectedRoute>} />
          <Route path="/growing-guides/:crop_type" element={<ProtectedRoute><CropGrowingGuide /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
      <span style={{ display: 'none' }}>{patchId}</span> {/* Hidden, but need to use variable to prevent compiler error */}
    </div>
    
  );
}

export default App;
