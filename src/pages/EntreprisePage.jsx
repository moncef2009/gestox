import React, { useState, useEffect } from "react";
import {
  Business,
  Phone,
  Email,
  LocationOn,
  Edit,
  Assignment,
  Receipt,
  CorporateFare,
  Description,
  CalendarToday,
} from "@mui/icons-material";
import CompanyDialog from "../components/CompanyDialog";

const EntreprisePage = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Charger les informations de l'entreprise
  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const companies = await window.db.getCompanies();

      // Trouver l'entreprise courante ou la première entreprise
      let currentCompany = companies.find((c) => c.isCurrent === true);
      if (!currentCompany && companies.length > 0) {
        currentCompany = companies[0];
      }

      setCompany(currentCompany);
    } catch (error) {
      console.error("Erreur lors du chargement de l'entreprise:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySaved = (companyData, action) => {
    console.log(
      `Entreprise ${action === "edit" ? "modifiée" : "créée"}:`,
      companyData
    );
    // Recharger les informations de l'entreprise
    loadCompany();
    setCompanyDialogOpen(false);
    setEditingCompany(null);
  };

  const handleEditCompany = () => {
    if (company) {
      setEditingCompany(company);
      setCompanyDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Chargement des informations...
          </p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Business className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Aucune entreprise configurée
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez créer une entreprise pour utiliser toutes les
            fonctionnalités de l'application.
          </p>
          <button
            onClick={() => setCompanyDialogOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
          >
            <Business />
            Créer une entreprise
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête avec bouton de modification */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Business className="text-blue-600" />
              Informations de l'Entreprise
            </h1>
            <p className="text-gray-600">
              Gérer les informations de votre entreprise pour la facturation et
              les documents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte principale des informations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CorporateFare className="text-blue-600" />
                  {company.name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Dernière mise à jour:{" "}
                  {new Date(company.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Informations principales */}
              <div className="space-y-6">
                {/* Adresse */}
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <LocationOn className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Adresse</h3>
                    <p className="text-gray-900 whitespace-pre-line">
                      {company.address}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Phone className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">
                        Téléphone
                      </h3>
                      <p className="text-gray-900">{company.phone}</p>
                    </div>
                  </div>

                  {company.email && (
                    <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Email className="text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">
                          Email
                        </h3>
                        <p className="text-gray-900">{company.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Numéros d'identification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {company.rc && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Assignment className="text-gray-500 text-sm" />
                        Registre de Commerce
                      </h3>
                      <p className="text-gray-900 font-medium">{company.rc}</p>
                    </div>
                  )}

                  {company.nif && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Assignment className="text-gray-500 text-sm" />
                        N° Identifiant Fiscal
                      </h3>
                      <p className="text-gray-900 font-medium">{company.nif}</p>
                    </div>
                  )}

                  {company.nis && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Assignment className="text-gray-500 text-sm" />
                        N° Identifiant Statistique
                      </h3>
                      <p className="text-gray-900 font-medium">{company.nis}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Carte secondaire - Informations supplémentaires */}
          <div className="space-y-6">
            {/* Bouton de modification */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-4">
                Modifier les informations
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Cliquez sur le bouton ci-dessous pour modifier les informations
                de votre entreprise.
              </p>
              <button
                onClick={handleEditCompany}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg shadow hover:shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Edit />
                Modifier l'entreprise
              </button>
            </div>

            {/* Note */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Description className="text-blue-600" />
                Important
              </h3>
              <p className="text-gray-600 text-sm">
                Ces informations apparaîtront sur tous vos documents commerciaux
                (factures, bons de commande, etc.). Assurez-vous qu'elles sont
                toujours à jour.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pour modifier l'entreprise */}
      <CompanyDialog
        open={companyDialogOpen}
        onClose={() => {
          setCompanyDialogOpen(false);
          setEditingCompany(null);
        }}
        onCompanySaved={handleCompanySaved}
        editingCompany={editingCompany}
      />
    </div>
  );
};

export default EntreprisePage;
