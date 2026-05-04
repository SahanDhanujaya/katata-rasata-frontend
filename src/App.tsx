import { BrowserRouter, Routes, Route } from "react-router-dom";
import Billing from "./pages/Billing";
import AddItem from "./pages/AddItem";
import ViewBills from "./pages/ViewBills";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Billing />} />
        <Route path="/add" element={<AddItem />} />
        <Route path="/report" element={<ViewBills />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;