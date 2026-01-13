import { useState, useEffect } from "react";
import {
  Search,
  Delete,
  AttachMoney,
  CheckCircle,
  Warning,
  Receipt,
  Person,
  CalendarToday,
  FilterList,
  Download,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Paid,
  Pending,
  ArrowUpward,
  ArrowDownward,
  Clear,
  Cancel,
  Inventory,
  ExpandMore,
  ExpandLess,
  TrendingUp,
} from "@mui/icons-material";
import * as XLSX from "xlsx";

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [clientFilter, setClientFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const [selectedSale, setSelectedSale] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [actionMessage, setActionMessage] = useState("");

  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const salesData = await window.db.getSales();

      // Migration des ventes existantes pour inclure le bénéfice
      const updatedSales = salesData.map((sale) => {
        if (!sale.totalProfit) {
          const calculatedProfit =
            sale.products?.reduce((profit, product) => {
              return profit + (product.totalProfit || 0);
            }, 0) || 0;

          return {
            ...sale,
            totalProfit: calculatedProfit,
          };
        }
        return sale;
      });

      // Mettre à jour les ventes migrées dans la base de données
      for (const sale of updatedSales) {
        if (!sale.totalProfit) {
          const calculatedProfit =
            sale.products?.reduce((profit, product) => {
              return profit + (product.totalProfit || 0);
            }, 0) || 0;

          await window.db.updateSale(sale._id || sale.id, {
            totalProfit: calculatedProfit,
          });
        }
      }

      setSales(updatedSales);
      setFilteredSales(updatedSales);
    } catch (error) {
      console.error("Erreur lors du chargement des ventes:", error);
      setSales([]);
      setFilteredSales([]);
    }
  };

  useEffect(() => {
    let result = [...sales];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (sale) =>
          (sale.client?.nom?.toLowerCase().includes(term) ||
            sale.invoiceNumber?.toLowerCase().includes(term) ||
            sale.id?.toString().includes(term) ||
            sale.products?.some((product) =>
              product.name?.toLowerCase().includes(term)
            )) &&
          sale
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((sale) => sale.status === statusFilter);
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter((sale) => new Date(sale.date) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((sale) => new Date(sale.date) <= endDate);
    }

    if (clientFilter) {
      const term = clientFilter.toLowerCase();
      result = result.filter(
        (sale) =>
          sale.client?.nom?.toLowerCase().includes(term) ||
          sale.client?.telephone?.includes(term)
      );
    }

    if (minAmount) {
      const min = parseFloat(minAmount);
      result = result.filter((sale) => sale.total >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      result = result.filter((sale) => sale.total <= max);
    }

    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (
        sortField === "total" ||
        sortField === "payedAmount" ||
        sortField === "remainingAmount" ||
        sortField === "totalProfit"
      ) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

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

    setFilteredSales(result);
    setCurrentPage(1);
  }, [
    sales,
    searchTerm,
    statusFilter,
    dateRange,
    clientFilter,
    minAmount,
    maxAmount,
    sortField,
    sortDirection,
  ]);

  const stats = {
    total: filteredSales.length,
    totalAmount: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    totalPaid: filteredSales.reduce((sum, sale) => sum + sale.payedAmount, 0),
    totalRemaining: filteredSales.reduce(
      (sum, sale) => sum + sale.remainingAmount,
      0
    ),
    totalProfit: filteredSales.reduce(
      (sum, sale) => sum + (sale.totalProfit || 0),
      0
    ),
    completed: filteredSales.filter(
      (sale) => sale.status === "completementpayer"
    ).length,
    partial: filteredSales.filter((sale) => sale.status === "partielementpayer")
      .length,
    pending: filteredSales.filter((sale) => sale.status === "nonpayer").length,
  };

  const formatStatus = (status) => {
    switch (status) {
      case "completementpayer":
        return "Payée";
      case "partielementpayer":
        return "Partielle";
      case "nonpayer":
        return "Impayée";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completementpayer":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "partielementpayer":
        return <Pending className="w-4 h-4 text-amber-500" />;
      case "nonpayer":
        return <Cancel className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completementpayer":
        return "bg-emerald-100 text-emerald-800";
      case "partielementpayer":
        return "bg-amber-100 text-amber-800";
      case "nonpayer":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleProducts = (saleId) => {
    if (expandedSale === saleId) {
      setExpandedSale(null);
    } else {
      setExpandedSale(saleId);
    }
  };

  const getTotalItems = (sale) => {
    return (
      sale.products?.reduce((total, product) => total + product.quantity, 0) ||
      0
    );
  };

  const handleOpenPaymentDialog = (sale) => {
    setSelectedSale(sale);
    setPaymentAmount(sale.remainingAmount);
    setShowPaymentDialog(true);
  };

  const handleOpenDeleteDialog = (sale) => {
    setSelectedSale(sale);
    setShowDeleteDialog(true);
  };

  const handleCloseDialogs = () => {
    setShowPaymentDialog(false);
    setShowDeleteDialog(false);
    setSelectedSale(null);
  };

  const handleMakePayment = async () => {
    if (!selectedSale || paymentAmount <= 0) return;

    try {
      const updatedSales = sales.map((sale) => {
        if ((sale._id || sale.id) === (selectedSale._id || selectedSale.id)) {
          const newPayedAmount = sale.payedAmount + parseFloat(paymentAmount);
          const newRemaining = Math.max(0, sale.total - newPayedAmount);
          const newStatus =
            newRemaining === 0
              ? "completementpayer"
              : newPayedAmount === 0
                ? "nonpayer"
                : "partielementpayer";

          const updatedSale = {
            ...sale,
            payedAmount: newPayedAmount,
            remainingAmount: newRemaining,
            status: newStatus,
          };

          // Mettre à jour dans NeDB
          window.db.updateSale(sale._id || sale.id, updatedSale);

          return updatedSale;
        }
        return sale;
      });

      setSales(updatedSales);

      // Mettre à jour également les factures correspondantes
      const invoices = await window.db.getInvoices();
      for (const invoice of invoices) {
        if (
          invoice.id === selectedSale.id ||
          invoice.invoiceNumber === selectedSale.invoiceNumber
        ) {
          const newPayedAmount =
            invoice.payedAmount + parseFloat(paymentAmount);
          const newRemaining = Math.max(0, invoice.totalTTC - newPayedAmount);
          const newStatus =
            newRemaining === 0
              ? "completementpayer"
              : newPayedAmount === 0
                ? "nonpayer"
                : "partielementpayer";

          await window.db.updateInvoice(invoice._id || invoice.id, {
            payedAmount: newPayedAmount,
            remainingAmount: newRemaining,
            status: newStatus,
          });
        }
      }

      setActionMessage(
        `Paiement de ${parseFloat(paymentAmount).toFixed(2)} DA enregistré pour la vente #${selectedSale.id}`
      );
      setTimeout(() => setActionMessage(""), 3000);

      handleCloseDialogs();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du paiement:", error);
      setActionMessage("Erreur lors de l'enregistrement du paiement");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const handlePayFullRemaining = () => {
    if (!selectedSale) return;
    setPaymentAmount(selectedSale.remainingAmount);
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;

    try {
      await window.db.deleteSale(selectedSale._id || selectedSale.id);

      const updatedSales = sales.filter(
        (sale) =>
          (sale._id || sale.id) !== (selectedSale._id || selectedSale.id)
      );
      setSales(updatedSales);

      setActionMessage(`Vente #${selectedSale.id} supprimée`);
      setTimeout(() => setActionMessage(""), 3000);

      handleCloseDialogs();
    } catch (error) {
      console.error("Erreur lors de la suppression de la vente:", error);
      setActionMessage("Erreur lors de la suppression de la vente");
      setTimeout(() => setActionMessage(""), 3000);
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
    setClientFilter("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleExportExcel = () => {
    const data = filteredSales.map((sale) => ({
      ID: sale.id,
      Date: new Date(sale.date).toLocaleDateString("fr-FR"),
      Client: sale.client?.nom || "Non spécifié",
      Téléphone: sale.client?.telephone || "",
      "Total (DA)": sale.total,
      "Payé (DA)": sale.payedAmount,
      "Reste (DA)": sale.remainingAmount,
      "Bénéfice (DA)": sale.totalProfit || 0,
      Statut: formatStatus(sale.status),
      Articles: getTotalItems(sale),
      "N° Facture": sale.invoiceNumber || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Historique des ventes");

    XLSX.writeFile(
      workbook,
      `historique_ventes_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    setActionMessage("Export Excel terminé");
    setTimeout(() => setActionMessage(""), 3000);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

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
          <span className="font-semibold">{indexOfFirstItem + 1}</span> à{" "}
          <span className="font-semibold">
            {Math.min(indexOfLastItem, filteredSales.length)}
          </span>{" "}
          sur <span className="font-semibold">{filteredSales.length}</span>{" "}
          ventes
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

  const SaleProducts = ({ sale }) => {
    if (!sale.products || sale.products.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          Aucun produit dans cette vente
        </div>
      );
    }

    return (
      <div className="mt-2">
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Produit
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Quantité
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Prix unitaire
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Sous-total
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Bénéfice
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sale.products.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {product.id}
                    </div>
                    {product.purchasePrice && (
                      <div className="text-xs text-gray-500">
                        Achat: {product.purchasePrice.toFixed(2)} DA
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {product.quantity}
                      </span>
                      <span className="text-xs text-gray-500">unité(s)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-blue-600">
                      {product.unitPrice?.toFixed(2) || "0.00"} DA
                    </div>
                    {product.profitPerUnit && (
                      <div className="text-xs text-green-600">
                        +{product.profitPerUnit.toFixed(2)} DA/unité
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-emerald-600">
                      {product.subtotal?.toFixed(2) || "0.00"} DA
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-green-600">
                      {product.totalProfit?.toFixed(2) || "0.00"} DA
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.unitPrice
                        ? `${(((product.unitPrice - (product.purchasePrice || 0)) / product.unitPrice) * 100).toFixed(1)}%`
                        : "0%"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-3 text-right font-medium text-gray-700"
                >
                  Total des articles:
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">
                  {sale.total.toFixed(2)} DA
                </td>
              </tr>
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-3 text-right font-medium text-gray-700"
                >
                  Bénéfice total:
                </td>
                <td className="px-4 py-3 font-bold text-green-600">
                  {(sale.totalProfit || 0).toFixed(2)} DA
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Historique des Ventes
              </h1>
              <p className="text-sm text-gray-600">
                Suivez et gérez toutes vos ventes
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:shadow flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter Excel</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FilterList className="w-4 h-4" />
              <span className="hidden sm:inline">Filtres</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par client, produit, N° de vente ou N° de facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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

      {/* Filtres avancés */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Filtres avancés
            </h3>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1"
            >
              <Clear className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="completementpayer">Payées</option>
                <option value="partielementpayer">Partielles</option>
                <option value="nonpayer">Impayées</option>
              </select>
            </div>

            {/* Filtre par date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Filtre par client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <input
                type="text"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                placeholder="Nom ou téléphone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Filtre par montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant min (DA)
              </label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant max (DA)
              </label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ventes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Chiffre d'affaires: {stats.totalAmount.toFixed(2)} DA
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payé</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.totalPaid.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Paid className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {((stats.totalPaid / stats.totalAmount) * 100 || 0).toFixed(1)}% du
            total
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Restant</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.totalRemaining.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Pending className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.pending} vente(s) impayée(s)
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bénéfice Total</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalProfit.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Marge:{" "}
            {((stats.totalProfit / stats.totalAmount) * 100 || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Tableau des ventes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-700 to-indigo-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Inventory className="w-4 h-4" />
                    Produits
                  </div>
                </th>
                <th
                  onClick={() => handleSort("id")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    ID
                    {sortField === "id" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpward className="w-3 h-3" />
                      ) : (
                        <ArrowDownward className="w-3 h-3" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("date")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarToday className="w-4 h-4" />
                    Date
                    {sortField === "date" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpward className="w-3 h-3" />
                      ) : (
                        <ArrowDownward className="w-3 h-3" />
                      ))}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Person className="w-4 h-4" />
                    Client
                  </div>
                </th>
                <th
                  onClick={() => handleSort("total")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Total
                    {sortField === "total" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpward className="w-3 h-3" />
                      ) : (
                        <ArrowDownward className="w-3 h-3" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("payedAmount")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Payé
                    {sortField === "payedAmount" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpward className="w-3 h-3" />
                      ) : (
                        <ArrowDownward className="w-3 h-3" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("remainingAmount")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Reste
                    {sortField === "remainingAmount" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpward className="w-3 h-3" />
                      ) : (
                        <ArrowDownward className="w-3 h-3" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("totalProfit")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Bénéfice
                    {sortField === "totalProfit" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpward className="w-3 h-3" />
                      ) : (
                        <ArrowDownward className="w-3 h-3" />
                      ))}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600">Aucune vente trouvée</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Modifiez vos critères de recherche ou créez une nouvelle
                        vente
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((sale) => (
                  <>
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleProducts(sale.id)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          {expandedSale === sale.id ? (
                            <ExpandLess className="w-4 h-4" />
                          ) : (
                            <ExpandMore className="w-4 h-4" />
                          )}
                          <span className="text-sm">
                            {getTotalItems(sale)} article(s)
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          #{sale.id}
                        </div>
                        {sale.invoiceNumber && (
                          <div className="text-xs text-blue-600 mt-1">
                            Facture: {sale.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(sale.date).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(sale.date).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Person className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {sale.client?.nom || "Client non spécifié"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sale.client?.telephone || "Non renseigné"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          {sale.total.toFixed(2)} DA
                        </div>
                        <div className="text-xs text-gray-500">
                          {sale.products?.length || 0} type(s) de produit
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-emerald-600">
                          {sale.payedAmount.toFixed(2)} DA
                        </div>
                        <div className="text-xs text-gray-500">
                          {((sale.payedAmount / sale.total) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`font-medium ${
                            sale.remainingAmount > 0
                              ? "text-amber-600"
                              : "text-gray-600"
                          }`}
                        >
                          {sale.remainingAmount.toFixed(2)} DA
                        </div>
                        {sale.remainingAmount > 0 && (
                          <div className="text-xs text-amber-600">
                            En attente de paiement
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-green-600">
                          {sale.totalProfit?.toFixed(2) || "0.00"} DA
                        </div>
                        <div className="text-xs text-gray-500">
                          {sale.total
                            ? `${((sale.totalProfit / sale.total) * 100).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sale.status)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              sale.status
                            )}`}
                          >
                            {formatStatus(sale.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {sale.remainingAmount > 0 && (
                            <button
                              onClick={() => handleOpenPaymentDialog(sale)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                              title="Enregistrer un paiement"
                            >
                              <AttachMoney className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDeleteDialog(sale)}
                            className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                            title="Supprimer la vente"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Ligne des produits détaillés */}
                    {expandedSale === sale.id && (
                      <tr>
                        <td colSpan="10" className="px-6 py-4 bg-gray-50">
                          <SaleProducts sale={sale} />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination />

      {/* Dialog de paiement */}
      {showPaymentDialog && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AttachMoney className="text-emerald-600 w-5 h-5" />
                  Enregistrer un paiement
                </h2>
                <button
                  onClick={handleCloseDialogs}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Clear className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Informations de la vente
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vente #:</span>
                    <span className="font-medium">{selectedSale.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">
                      {selectedSale.client?.nom || "Non spécifié"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-emerald-600">
                      {selectedSale.total.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bénéfice:</span>
                    <span className="font-bold text-green-600">
                      {selectedSale.totalProfit?.toFixed(2) || "0.00"} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Déjà payé:</span>
                    <span className="font-medium">
                      {selectedSale.payedAmount.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reste à payer:</span>
                    <span className="font-bold text-amber-600">
                      {selectedSale.remainingAmount.toFixed(2)} DA
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant du paiement (DA)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AttachMoney className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedSale.remainingAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-xs text-gray-500">DA</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={handlePayFullRemaining}
                    className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200"
                  >
                    Payer tout le reste (
                    {selectedSale.remainingAmount.toFixed(2)} DA)
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm font-medium">
                  <span>Nouveau montant payé:</span>
                  <span className="text-emerald-600">
                    {(
                      selectedSale.payedAmount + parseFloat(paymentAmount || 0)
                    ).toFixed(2)}{" "}
                    DA
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium mt-1">
                  <span>Nouveau reste à payer:</span>
                  <span className="text-amber-600">
                    {Math.max(
                      0,
                      selectedSale.remainingAmount -
                        parseFloat(paymentAmount || 0)
                    ).toFixed(2)}{" "}
                    DA
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={handleCloseDialogs}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMakePayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-sm font-medium rounded-lg hover:shadow flex items-center gap-1 disabled:opacity-50"
                >
                  <AttachMoney className="w-4 h-4" />
                  Enregistrer le paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de suppression */}
      {showDeleteDialog && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Warning className="text-rose-600 w-5 h-5" />
                  Confirmer la suppression
                </h2>
                <button
                  onClick={handleCloseDialogs}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Clear className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-rose-100 rounded-full">
                    <Warning className="w-8 h-8 text-rose-600" />
                  </div>
                </div>
                <p className="text-gray-700 text-center mb-2">
                  Êtes-vous sûr de vouloir supprimer cette vente ?
                </p>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
                  <div className="text-sm text-rose-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Vente #:</span>
                      <span className="font-medium">{selectedSale.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client:</span>
                      <span className="font-medium">
                        {selectedSale.client?.nom || "Non spécifié"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">
                        {selectedSale.total.toFixed(2)} DA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bénéfice:</span>
                      <span className="font-bold text-green-600">
                        {selectedSale.totalProfit?.toFixed(2) || "0.00"} DA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Articles:</span>
                      <span className="font-medium">
                        {getTotalItems(selectedSale)} article(s)
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Cette action est irréversible. La vente sera définitivement
                  supprimée.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={handleCloseDialogs}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteSale}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-700 text-white text-sm font-medium rounded-lg hover:shadow flex items-center gap-1"
                >
                  <Delete className="w-4 h-4" />
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
