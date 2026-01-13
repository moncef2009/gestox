import { useState, useEffect } from "react";
import {
  Add,
  Delete,
  Business,
  Search,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Description,
  Badge,
  Edit,
  Phone,
  LocationOn,
  Email,
  AccountBalance,
  ArrowUpward,
  ArrowDownward,
  Clear,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import FournisseurDialog from "../components/FournisseurDialog";

const Fournisseurs = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingFournisseur, setEditingFournisseur] = useState(null);
  const [sortField, setSortField] = useState("nom");
  const [sortDirection, setSortDirection] = useState("asc");
  const [actionMessage, setActionMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    try {
      const fournisseursData = await window.db.getFournisseurs();
      setFournisseurs(fournisseursData);
    } catch (error) {
      console.error("Erreur lors du chargement des fournisseurs:", error);
      setFournisseurs([]);
      setActionMessage("Erreur lors du chargement des fournisseurs");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  const handleOpenAddDialog = () => {
    setEditingFournisseur(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFournisseur(null);
  };

  const handleFournisseurSaved = async (fournisseurData, action) => {
    try {
      if (action === "edit") {
        // Mise à jour dans NeDB
        await window.db.updateFournisseur(
          editingFournisseur._id || editingFournisseur.id,
          fournisseurData
        );
        
        // Mettre à jour l'état local
        setFournisseurs(fournisseurs.map((f) => 
          (f._id === editingFournisseur._id || f.id === editingFournisseur.id) 
            ? { ...fournisseurData, _id: editingFournisseur._id || editingFournisseur.id } 
            : f
        ));
        
        setActionMessage("Fournisseur modifié avec succès");
      } else {
        // Ajout dans NeDB
        const savedFournisseur = await window.db.addFournisseur(fournisseurData);
        
        // Mettre à jour l'état local avec l'ID retourné par NeDB
        setFournisseurs([...fournisseurs, savedFournisseur]);
        setActionMessage("Fournisseur ajouté avec succès");
      }
      
      setTimeout(() => setActionMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du fournisseur:", error);
      setActionMessage("Erreur lors de la sauvegarde du fournisseur");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const handleDelete = async (fournisseur) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${fournisseur.nom}" ?`)) {
      try {
        // Supprimer de NeDB
        await window.db.deleteFournisseur(fournisseur._id || fournisseur.id);
        
        // Mettre à jour l'état local
        setFournisseurs(fournisseurs.filter((f) => 
          (f._id || f.id) !== (fournisseur._id || fournisseur.id)
        ));
        
        setActionMessage(`Fournisseur "${fournisseur.nom}" supprimé avec succès`);
        setTimeout(() => setActionMessage(""), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression du fournisseur:", error);
        setActionMessage("Erreur lors de la suppression du fournisseur");
        setTimeout(() => setActionMessage(""), 3000);
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedFournisseurs = fournisseurs
    .filter((fournisseur) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        fournisseur.nom?.toLowerCase().includes(searchLower) ||
        fournisseur.address?.toLowerCase().includes(searchLower) ||
        fournisseur.telephone?.includes(searchTerm) ||
        (fournisseur.email &&
          fournisseur.email.toLowerCase().includes(searchLower)) ||
        (fournisseur.n_rc && fournisseur.n_rc.includes(searchTerm)) ||
        (fournisseur.n_if && fournisseur.n_if.includes(searchTerm)) ||
        (fournisseur.n_ic && fournisseur.n_ic.includes(searchTerm)) ||
        (fournisseur.n_ice && fournisseur.n_ice.includes(searchTerm)) ||
        (fournisseur.n_cnss && fournisseur.n_cnss.includes(searchTerm)) ||
        (fournisseur.compte_bancaire &&
          fournisseur.compte_bancaire.includes(searchTerm))
      );
    })
    .sort((a, b) => {
      let aValue = a[sortField] || "";
      let bValue = b[sortField] || "";

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalFournisseurs = filteredAndSortedFournisseurs.length;
  const totalPages = Math.ceil(totalFournisseurs / itemsPerPage);
  const indexOfLastFournisseur = currentPage * itemsPerPage;
  const indexOfFirstFournisseur = indexOfLastFournisseur - itemsPerPage;
  const currentFournisseurs = filteredAndSortedFournisseurs.slice(
    indexOfFirstFournisseur,
    indexOfLastFournisseur
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-4 py-3 bg-white rounded-lg border border-gray-200">
        <div className="text-sm text-gray-700 mb-3 sm:mb-0">
          Affichage de{" "}
          <span className="font-semibold">{indexOfFirstFournisseur + 1}</span> à{" "}
          <span className="font-semibold">
            {Math.min(indexOfLastFournisseur, totalFournisseurs)}
          </span>{" "}
          sur <span className="font-semibold">{totalFournisseurs}</span>{" "}
          fournisseurs
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Première page"
          >
            <FirstPage className="w-5 h-5" />
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Page précédente"
          >
            <NavigateBefore className="w-5 h-5" />
          </button>

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                currentPage === number
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Page suivante"
          >
            <NavigateNext className="w-5 h-5" />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Dernière page"
          >
            <LastPage className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const stats = {
    total: fournisseurs.length,
    withEmail: fournisseurs.filter((f) => f.email).length,
    withRC: fournisseurs.filter((f) => f.n_rc).length,
    withNIF: fournisseurs.filter((f) => f.n_if).length,
    withBankAccount: fournisseurs.filter((f) => f.compte_bancaire).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow">
              <Business className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
              <p className="text-sm text-gray-600">
                Gestion des fournisseurs et partenaires
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddDialog}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:shadow flex items-center gap-2"
          >
            <Add className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Fournisseur</span>
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, adresse, email, RC, NIF, NIS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <Clear className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Message d'action */}
        {actionMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle className="w-4 h-4" />
              {actionMessage}
            </div>
          </div>
        )}
      </header>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Fournisseurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Business className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avec Email</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.withEmail}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Email className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avec RC</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.withRC}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Badge className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avec NIF</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.withNIF}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Description className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compte Bancaire</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.withBankAccount}
              </p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <AccountBalance className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des fournisseurs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Business className="w-5 h-5" />
            Liste des Fournisseurs ({filteredAndSortedFournisseurs.length})
          </h2>
          <div className="text-sm text-gray-500 hidden lg:block">
            Cliquez sur les en-têtes pour trier
          </div>
        </div>

        {fournisseurs.length === 0 ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🏭</div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Aucun fournisseur enregistré
            </h3>
            <p className="text-green-700 mb-4">
              Commencez par ajouter votre premier fournisseur !
            </p>
            <button
              onClick={handleOpenAddDialog}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Add />
              Ajouter un fournisseur
            </button>
          </div>
        ) : filteredAndSortedFournisseurs.length === 0 ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-amber-700 mb-4">
              Aucun fournisseur ne correspond à votre recherche.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
            >
              <Search />
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <>
            {/* Vue desktop - Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-green-700 to-emerald-800">
                    <tr>
                      <th
                        onClick={() => handleSort("nom")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-green-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Business className="w-4 h-4" />
                          Fournisseur
                          {sortField === "nom" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("address")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-green-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LocationOn className="w-4 h-4" />
                          Adresse
                          {sortField === "address" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("telephone")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-green-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Téléphone
                          {sortField === "telephone" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Description className="w-4 h-4" />
                          Identification
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentFournisseurs.map((fournisseur) => (
                      <tr
                        key={fournisseur._id || fournisseur.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {fournisseur.nom?.charAt(0)?.toUpperCase() || "F"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {fournisseur.nom}
                              </div>
                              {fournisseur.email && (
                                <div className="text-xs text-gray-500">
                                  {fournisseur.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <LocationOn className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700">
                              {fournisseur.address || "Non spécifiée"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {fournisseur.telephone}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {fournisseur.n_rc && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  RC: {fournisseur.n_rc}
                                </span>
                              )}
                              {fournisseur.n_if && (
                                <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                                  IF: {fournisseur.n_if}
                                </span>
                              )}
                              {fournisseur.n_ic && (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                  IC: {fournisseur.n_ic}
                                </span>
                              )}
                              {fournisseur.n_ice && (
                                <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                                  ICE: {fournisseur.n_ice}
                                </span>
                              )}
                            </div>
                            {fournisseur.compte_bancaire && (
                              <div className="flex items-center gap-2 pt-1">
                                <AccountBalance className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  {fournisseur.compte_bancaire}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditDialog(fournisseur)}
                              className="p-2 text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(fournisseur)}
                              className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Delete className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vue mobile - Cards */}
            <div className="lg:hidden space-y-4 mb-4">
              {currentFournisseurs.map((fournisseur) => (
                <div
                  key={fournisseur._id || fournisseur.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {fournisseur.nom?.charAt(0)?.toUpperCase() || "F"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {fournisseur.nom}
                          </h3>
                          {fournisseur.email && (
                            <div className="flex items-center gap-2 mt-1 text-gray-600">
                              <Email className="w-4 h-4" />
                              <span className="text-sm">
                                {fournisseur.email}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{fournisseur.telephone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditDialog(fournisseur)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(fournisseur)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <LocationOn className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700">
                        {fournisseur.address || "Adresse non spécifiée"}
                      </p>
                    </div>

                    {(fournisseur.n_rc ||
                      fournisseur.n_if ||
                      fournisseur.n_ic ||
                      fournisseur.n_ice) && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Numéros d'identification :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {fournisseur.n_rc && (
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              RC: {fournisseur.n_rc}
                            </span>
                          )}
                          {fournisseur.n_if && (
                            <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                              IF: {fournisseur.n_if}
                            </span>
                          )}
                          {fournisseur.n_ic && (
                            <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              IC: {fournisseur.n_ic}
                            </span>
                          )}
                          {fournisseur.n_ice && (
                            <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded">
                              ICE: {fournisseur.n_ice}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {fournisseur.compte_bancaire && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center gap-2">
                          <AccountBalance className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {fournisseur.compte_bancaire}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {filteredAndSortedFournisseurs.length > 0 && <Pagination />}
      </div>

      <FournisseurDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onFournisseurSaved={handleFournisseurSaved}
        editingFournisseur={editingFournisseur}
      />
    </div>
  );
};

export default Fournisseurs;