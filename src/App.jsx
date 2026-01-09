import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import { useState } from "react";
import Clients from "./pages/Clients";
import ProformaInvoice from "./pages/ProformaInvoice";
import SaleInvoicePage from "./pages/SaleInvoicePage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import Fournisseurs from "./pages/Fournisseurs";
import BonsAchat from "./pages/BonsAchat";

const App = () => {
  const [open, setOpen] = useState(true);

  return (
    <Router>
      <div className="flex">
        <Sidebar open={open} setOpen={setOpen} />
        <div
          className={`flex-1 transition-all duration-300 ${
            open ? "ml-64" : "ml-20"
          }`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/facture-proformat" element={<ProformaInvoice />} />
            <Route path="/facture" element={<SaleInvoicePage />} />
            <Route path="/historique-vente" element={<SalesHistoryPage />} />
            <Route path="/fournisseurs" element={<Fournisseurs />} />
            <Route path="/bon-achat" element={<BonsAchat />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
