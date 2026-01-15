import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import { useState, useEffect } from "react";
import Clients from "./pages/Clients";
import ProformaInvoice from "./pages/ProformaInvoice";
import SaleInvoicePage from "./pages/SaleInvoicePage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import Fournisseurs from "./pages/Fournisseurs";
import CompanyDialog from "./components/CompanyDialog";
import EntreprisePage from "./pages/EntreprisePage";
import Achats from "./pages/Achats";

const App = () => {
  const [open, setOpen] = useState(true);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier l'entreprise au démarrage
  useEffect(() => {
    checkCompanyExist();
  }, []);

  const checkCompanyExist = async () => {
    try {
      setLoading(true);
      const companies = await window.db.getCompanies();

      if (companies && companies.length > 0) {
        setHasCompany(true);

        // Vérifier s'il y a une entreprise courante
        const currentCompany = companies.find(
          (company) => company.isCurrent === true
        );
        if (!currentCompany && companies.length === 1) {
          await window.db.updateCompany(companies[0]._id, { isCurrent: true });
        }
      } else {
        setHasCompany(false);
        setTimeout(() => setCompanyDialogOpen(true), 500);
      }
    } catch (error) {
      console.error("Erreur vérification entreprise:", error);
      setHasCompany(true); // Permettre l'accès en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySaved = async (companyData, action) => {
    console.log(
      `Entreprise ${action === "edit" ? "modifiée" : "créée"} :`,
      companyData
    );

    if (action === "add") {
      await window.db.updateCompany(companyData._id, { isCurrent: true });
    }

    setHasCompany(true);
    setCompanyDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Initialisation de l'application...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Vérification de la configuration
          </p>
        </div>
      </div>
    );
  }

  // Si pas d'entreprise, on ne montre pas l'interface principale
  if (!hasCompany) {
    return (
      <>
        {/* Dialog pour créer/modifier une entreprise */}
        <CompanyDialog
          open={companyDialogOpen}
          onClose={() => {
            if (!hasCompany) {
              alert(
                "Vous devez créer une entreprise pour utiliser l'application."
              );
              return;
            }
            setCompanyDialogOpen(false);
          }}
          onCompanySaved={handleCompanySaved}
          editingCompany={null}
        />
      </>
    );
  }

  return (
    <>
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
              <Route path="/historique-achat" element={<Achats />} />
              <Route path="/entreprise" element={<EntreprisePage />} />
            </Routes>
          </div>
        </div>
      </Router>

      {/* Dialog entreprise */}
      <CompanyDialog
        open={companyDialogOpen}
        onClose={() => setCompanyDialogOpen(false)}
        onCompanySaved={handleCompanySaved}
        editingCompany={null}
      />
    </>
  );
};

export default App;