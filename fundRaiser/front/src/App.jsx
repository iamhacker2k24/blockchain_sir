import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import CreateCampaign from "./components/pages/CreateCampaign";
import MyCampaigns from "./components/pages/MyCampaigns";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Header />} />
        <Route path="/create-campaign" element={<CreateCampaign/>} />
        <Route path="/my-campaigns" element={<MyCampaigns/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;