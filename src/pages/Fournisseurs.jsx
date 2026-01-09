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
} from "@mui/icons-material";
import FournisseurDialog from "../components/FournisseurDialog";

const Fournisseurs = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingFournisseur, setEditingFournisseur] = useState(null);
  const [sortField, setSortField] = useState("nom");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    const savedFournisseurs = localStorage.getItem("fournisseurs");
    if (savedFournisseurs) {
      setFournisseurs(JSON.parse(savedFournisseurs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fournisseurs", JSON.stringify(fournisseurs));
  }, [fournisseurs]);

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

  const handleFournisseurSaved = (fournisseurData, action) => {
    if (action === "edit") {
      setFournisseurs(
        fournisseurs.map((f) =>
          f.id === fournisseurData.id ? fournisseurData : f
        )
      );
    } else {
      setFournisseurs([...fournisseurs, fournisseurData]);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      setFournisseurs(fournisseurs.filter((f) => f.id !== id));
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
        fournisseur.nom.toLowerCase().includes(searchLower) ||
        fournisseur.address.toLowerCase().includes(searchLower) ||
        fournisseur.telephone.includes(searchTerm) ||
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
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
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

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}

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

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </>
          )}

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Business className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Gestion des Fournisseurs
                  </h1>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    Gérez vos fournisseurs et leurs informations
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddDialog}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <Add />
                <span className="hidden sm:inline">Nouveau Fournisseur</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un fournisseur par nom, adresse, téléphone, email, numéros d'identification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Business className="w-5 h-5" />
              Fournisseurs ({filteredAndSortedFournisseurs.length})
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Page {currentPage} sur {totalPages})
              </span>
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
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                            Nom du Fournisseur
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("address")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-green-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <LocationOn className="w-4 h-4" />
                            Adresse
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("telephone")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-green-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Téléphone
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Description className="w-4 h-4" />
                            Informations
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
                          key={fournisseur.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {fournisseur.nom}
                            </div>
                            {fournisseur.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Email className="w-3 h-3" />
                                {fournisseur.email}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <LocationOn className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {fournisseur.address}
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
                              <div className="grid grid-cols-2 gap-2">
                                {fournisseur.n_rc && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs">
                                      <span className="font-medium">RC:</span>{" "}
                                      {fournisseur.n_rc}
                                    </span>
                                  </div>
                                )}
                                {fournisseur.n_if && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs">
                                      <span className="font-medium">IF:</span>{" "}
                                      {fournisseur.n_if}
                                    </span>
                                  </div>
                                )}
                                {fournisseur.n_ic && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs">
                                      <span className="font-medium">IC:</span>{" "}
                                      {fournisseur.n_ic}
                                    </span>
                                  </div>
                                )}
                                {fournisseur.n_ice && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs">
                                      <span className="font-medium">ICE:</span>{" "}
                                      {fournisseur.n_ice}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {fournisseur.compte_bancaire && (
                                <div className="flex items-center gap-2 pt-1 border-t">
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
                                onClick={() =>
                                  handleOpenEditDialog(fournisseur)
                                }
                                className="p-2 text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(fournisseur.id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Delete className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:hidden space-y-4 mt-4">
                {currentFournisseurs.map((fournisseur) => (
                  <div
                    key={fournisseur.id}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditDialog(fournisseur)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(fournisseur.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Delete className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <LocationOn className="w-4 h-4 text-gray-400 mt-1" />
                        <p className="text-gray-700">{fournisseur.address}</p>
                      </div>

                      {(fournisseur.n_rc ||
                        fournisseur.n_if ||
                        fournisseur.n_ic ||
                        fournisseur.n_ice) && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            Numéros d'identification :
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {fournisseur.n_rc && (
                              <div className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                RC: {fournisseur.n_rc}
                              </div>
                            )}
                            {fournisseur.n_if && (
                              <div className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                IF: {fournisseur.n_if}
                              </div>
                            )}
                            {fournisseur.n_ic && (
                              <div className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                IC: {fournisseur.n_ic}
                              </div>
                            )}
                            {fournisseur.n_ice && (
                              <div className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                ICE: {fournisseur.n_ice}
                              </div>
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

          {filteredAndSortedFournisseurs.length > 0 && <Pagination />}
        </div>
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
