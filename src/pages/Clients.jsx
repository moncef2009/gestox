import { useState, useEffect } from "react";
import {
  Add,
  Delete,
  Person,
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
} from "@mui/icons-material";
import ClientDialog from "../components/ClientDialog";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [sortField, setSortField] = useState("nom");
  const [sortDirection, setSortDirection] = useState("asc");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    const savedClients = localStorage.getItem("clients");
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("clients", JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  const handleOpenAddDialog = () => {
    setEditingClient(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (client) => {
    setEditingClient(client);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
  };

  const handleClientSaved = (clientData, action) => {
    if (action === "edit") {
      // Mise à jour
      setClients(clients.map((c) => (c.id === clientData.id ? clientData : c)));
    } else {
      // Ajout - le clientData contient déjà l'UUID généré par ClientDialog
      setClients([...clients, clientData]);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      setClients(clients.filter((c) => c.id !== id));
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

  const filteredAndSortedClients = clients
    .filter((client) => {
      return (
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone.includes(searchTerm) ||
        (client.n_rc && client.n_rc.includes(searchTerm)) ||
        (client.n_if && client.n_if.includes(searchTerm)) ||
        (client.n_is && client.n_is.includes(searchTerm))
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

  // Calcul de la pagination
  const totalClients = filteredAndSortedClients.length;
  const totalPages = Math.ceil(totalClients / itemsPerPage);

  // Calcul des clients à afficher sur la page actuelle
  const indexOfLastClient = currentPage * itemsPerPage;
  const indexOfFirstClient = indexOfLastClient - itemsPerPage;
  const currentClients = filteredAndSortedClients.slice(
    indexOfFirstClient,
    indexOfLastClient
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
          <span className="font-semibold">{indexOfFirstClient + 1}</span> à{" "}
          <span className="font-semibold">
            {Math.min(indexOfLastClient, totalClients)}
          </span>{" "}
          sur <span className="font-semibold">{totalClients}</span> clients
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
                  ? "bg-blue-600 text-white"
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Person className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Gestion des Clients
                  </h1>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    Gérez vos clients et leurs informations
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddDialog}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <Add />
                <span className="hidden sm:inline">Nouveau Client</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un client par nom, adresse, téléphone, N° RC, N° IF, N° IS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Liste des clients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Person className="w-5 h-5" />
              Clients ({filteredAndSortedClients.length})
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Page {currentPage} sur {totalPages})
              </span>
            </h2>
            <div className="text-sm text-gray-500 hidden lg:block">
              Cliquez sur les en-têtes pour trier
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Aucun client enregistré
              </h3>
              <p className="text-blue-700 mb-4">
                Commencez par ajouter votre premier client !
              </p>
              <button
                onClick={handleOpenAddDialog}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <Add />
                Ajouter un client
              </button>
            </div>
          ) : filteredAndSortedClients.length === 0 ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-amber-700 mb-4">
                Aucun client ne correspond à votre recherche.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Search />
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <>
              {/* Vue desktop - Table */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-700 to-indigo-800">
                      <tr>
                        <th
                          onClick={() => handleSort("nom")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Person className="w-4 h-4" />
                            Nom du Client
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("address")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <LocationOn className="w-4 h-4" />
                            Adresse
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("telephone")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Téléphone
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Description className="w-4 h-4" />
                            Numéros d'identification
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentClients.map((client) => (
                        <tr
                          key={client.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {client.nom}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <LocationOn className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {client.address}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {client.telephone}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {client.n_rc && (
                                <div className="flex items-center gap-2">
                                  <Badge className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm">
                                    <span className="font-medium">RC:</span>{" "}
                                    {client.n_rc}
                                  </span>
                                </div>
                              )}
                              {client.n_if && (
                                <div className="flex items-center gap-2">
                                  <Badge className="w-4 h-4 text-emerald-500" />
                                  <span className="text-sm">
                                    <span className="font-medium">IF:</span>{" "}
                                    {client.n_if}
                                  </span>
                                </div>
                              )}
                              {client.n_is && (
                                <div className="flex items-center gap-2">
                                  <Badge className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm">
                                    <span className="font-medium">IS:</span>{" "}
                                    {client.n_is}
                                  </span>
                                </div>
                              )}
                              {!client.n_rc && !client.n_if && !client.n_is && (
                                <span className="text-sm text-gray-400 italic">
                                  Aucun numéro d'identification
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditDialog(client)}
                                className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(client.id)}
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

              {/* Vue mobile - Cards */}
              <div className="lg:hidden space-y-4 mt-4">
                {currentClients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {client.nom}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{client.telephone}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditDialog(client)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Delete className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <LocationOn className="w-4 h-4 text-gray-400 mt-1" />
                        <p className="text-gray-700">{client.address}</p>
                      </div>

                      {(client.n_rc || client.n_if || client.n_is) && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            Numéros d'identification :
                          </p>
                          <div className="space-y-1">
                            {client.n_rc && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  RC: {client.n_rc}
                                </span>
                              </div>
                            )}
                            {client.n_if && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                  IF: {client.n_if}
                                </span>
                              </div>
                            )}
                            {client.n_is && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  IS: {client.n_is}
                                </span>
                              </div>
                            )}
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
          {filteredAndSortedClients.length > 0 && <Pagination />}
        </div>
      </div>

      {/* Utilisation du composant ClientDialog autonome */}
      <ClientDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onClientSaved={handleClientSaved}
        editingClient={editingClient}
      />
    </div>
  );
};

export default Clients;
