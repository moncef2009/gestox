import { useState, useEffect } from "react";
import {
  Add,
  Delete,
  Search,
  LocalShipping,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Business,
  AttachMoney,
  CalendarToday,
  CheckCircle,
  Warning,
  Error,
  FilterList,
  Clear,
  Download,
  Inventory,
  ArrowUpward,
  ArrowDownward,
  Edit as EditIcon,
} from "@mui/icons-material";
import AchatDialog from "../components/AchatDialog";
import * as XLSX from "xlsx";

const Achats = () => {
  const [achats, setAchats] = useState([]);
  const [filteredAchats, setFilteredAchats] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [selectedAchat, setSelectedAchat] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [expandedAchat, setExpandedAchat] = useState(null);
  const [editingAchat, setEditingAchat] = useState(null);

  useEffect(() => {
    loadAchats();
    loadProduits();
  }, []);

  const loadAchats = async () => {
    try {
      const achatsData = await window.db.getAchats();
      const updatedAchats = achatsData.map((achat) => {
        if (!achat.payedAmount) {
          return {
            ...achat,
            payedAmount: 0,
            remainingAmount: achat.total,
            status: "non-payer",
          };
        }
        // S'assurer que remainingAmount est calculé
        const remaining = achat.total - (achat.payedAmount || 0);
        return {
          ...achat,
          remainingAmount: Math.max(0, remaining),
          status:
            achat.status ||
            (remaining === 0
              ? "completement-payer"
              : achat.payedAmount > 0
                ? "partielement-payer"
                : "non-payer"),
        };
      });

      setAchats(updatedAchats);
    } catch (error) {
      console.error("Erreur lors du chargement des achats:", error);
      setAchats([]);
    }
  };

  const loadProduits = async () => {
    try {
      const produitsData = await window.db.getProducts();
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };

  useEffect(() => {
    let result = [...achats];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (achat) =>
          achat.numero?.toLowerCase().includes(term) ||
          achat.fournisseurNom?.toLowerCase().includes(term) ||
          achat.notes?.toLowerCase().includes(term) ||
          achat.produits?.some((p) => p.nom?.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((achat) => achat.status === statusFilter);
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter((achat) => new Date(achat.date) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((achat) => new Date(achat.date) <= endDate);
    }

    if (fournisseurFilter) {
      const term = fournisseurFilter.toLowerCase();
      result = result.filter((achat) =>
        achat.fournisseurNom?.toLowerCase().includes(term)
      );
    }

    if (minAmount) {
      const min = parseFloat(minAmount);
      result = result.filter((achat) => achat.total >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      result = result.filter((achat) => achat.total <= max);
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
        sortField === "remainingAmount"
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

    setFilteredAchats(result);
    setCurrentPage(1);
  }, [
    achats,
    searchTerm,
    statusFilter,
    dateRange,
    fournisseurFilter,
    minAmount,
    maxAmount,
    sortField,
    sortDirection,
  ]);

  const handleOpenPaymentDialog = (achat) => {
    setSelectedAchat(achat);
    const remaining = achat.remainingAmount || achat.total - achat.payedAmount;
    setPaymentAmount(remaining);
    setPaymentError("");
    setShowPaymentDialog(true);
  };

  const handleCloseDialogs = () => {
    setShowPaymentDialog(false);
    setShowDeleteDialog(false);
    setSelectedAchat(null);
    setPaymentError("");
  };

  const handlePaymentAmountChange = (value) => {
    const amount = parseFloat(value) || 0;

    if (selectedAchat) {
      const maxAllowed =
        selectedAchat.remainingAmount ||
        selectedAchat.total - selectedAchat.payedAmount;

      if (amount > maxAllowed) {
        setPaymentError(
          `Le montant ne peut pas dépasser ${maxAllowed.toFixed(2)} DA`
        );
        setPaymentAmount(maxAllowed);
      } else if (amount < 0) {
        setPaymentError("Le montant ne peut pas être négatif");
        setPaymentAmount(0);
      } else {
        setPaymentError("");
        setPaymentAmount(amount);
      }
    }
  };

  const handleMakePayment = async () => {
    if (!selectedAchat || paymentAmount <= 0) return;

    if (paymentError) {
      return;
    }

    try {
      const updatedAchats = achats.map((achat) => {
        if (achat._id === selectedAchat._id || achat.id === selectedAchat.id) {
          const newPayedAmount = achat.payedAmount + parseFloat(paymentAmount);
          const newRemaining = Math.max(0, achat.total - newPayedAmount);
          const newStatus =
            newRemaining === 0
              ? "completement-payer"
              : newPayedAmount === 0
                ? "non-payer"
                : "partielement-payer";

          return {
            ...achat,
            payedAmount: newPayedAmount,
            remainingAmount: newRemaining,
            status: newStatus,
          };
        }
        return achat;
      });

      setAchats(updatedAchats);

      const achatToUpdate = updatedAchats.find(
        (achat) =>
          achat._id === selectedAchat._id || achat.id === selectedAchat.id
      );

      if (achatToUpdate) {
        await window.db.updateAchat(achatToUpdate._id || achatToUpdate.id, {
          payedAmount: achatToUpdate.payedAmount,
          remainingAmount: achatToUpdate.remainingAmount,
          status: achatToUpdate.status,
        });
      }

      setActionMessage(
        `Paiement de ${parseFloat(paymentAmount).toFixed(2)} DA enregistré pour l'achat #${selectedAchat.numero}`
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
    if (!selectedAchat) return;
    const remaining =
      selectedAchat.remainingAmount ||
      selectedAchat.total - selectedAchat.payedAmount;
    handlePaymentAmountChange(remaining);
  };

  const handleOpenAddDialog = () => {
    setEditingAchat(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (achat) => {
    setEditingAchat(achat);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAchat(null);
  };

  const handleAchatSaved = async (achatData) => {
    try {
      // Calculer le remainingAmount et le status
      const remaining = Math.max(
        0,
        achatData.total - (achatData.payedAmount || 0)
      );
      const status =
        remaining === 0
          ? "completement-payer"
          : (achatData.payedAmount || 0) > 0
            ? "partielement-payer"
            : "non-payer";

      const newAchat = {
        ...achatData,
        payedAmount: achatData.payedAmount || 0,
        remainingAmount: remaining,
        status: status,
      };

      let savedAchat;
      if (achatData._id) {
        // Mise à jour d'un achat existant
        savedAchat = await window.db.updateAchat(achatData._id, newAchat);

        // Mettre à jour la liste locale
        setAchats((prev) =>
          prev.map((a) =>
            a._id === achatData._id ? { ...newAchat, _id: achatData._id } : a
          )
        );

        // Mettre à jour le stock si nécessaire
        await updateStockAfterEdit(achatData, editingAchat);
      } else {
        // Nouvel achat
        savedAchat = await window.db.addAchat(newAchat);
        const achatWithId = { ...newAchat, _id: savedAchat._id };
        setAchats([...achats, achatWithId]);

        await updateStockAfterNewAchat(achatWithId);
      }

      setActionMessage(
        achatData._id ? "Achat modifié avec succès" : "Achat ajouté avec succès"
      );
      setTimeout(() => setActionMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'achat:", error);
      setActionMessage("Erreur lors de l'ajout de l'achat");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const updateStockAfterNewAchat = async (achatData) => {
    try {
      const produits = await window.db.getProducts();

      for (const produitAchete of achatData.produits) {
        if (produitAchete.isNew) {
          const nouveauProduit = {
            id: produitAchete.id,
            name: produitAchete.nom,
            purchasePrice: produitAchete.prixAchat,
            sellingPriceRetail: produitAchete.prixAchat * 1.3,
            sellingPriceWholesale: produitAchete.prixAchat * 1.2,
            currentQuantity: produitAchete.quantiteAchetee,
            alertQuantity: produitAchete.quantiteAchetee * 0.2,
            unit: produitAchete.unite,
            tva: produitAchete.tva,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "",
          };

          await window.db.addProduct(nouveauProduit);
        } else {
          const existingProduct = produits.find(
            (p) => p.id === produitAchete.id
          );
          if (existingProduct) {
            const updatedProduct = {
              ...existingProduct,
              currentQuantity:
                existingProduct.currentQuantity + produitAchete.quantiteAchetee,
              purchasePrice: produitAchete.prixAchat,
              updatedAt: new Date().toISOString(),
            };

            await window.db.updateProduct(
              existingProduct._id || existingProduct.id,
              updatedProduct
            );
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du stock:", error);
    }
  };

  const updateStockAfterEdit = async (newAchat, oldAchat) => {
    try {
      const produits = await window.db.getProducts();

      // Restaurer les anciennes quantités
      if (oldAchat && oldAchat.produits) {
        for (const oldProduit of oldAchat.produits) {
          if (!oldProduit.isNew) {
            const existingProduct = produits.find(
              (p) => p.id === oldProduit.id
            );
            if (existingProduct) {
              const restoredQuantity =
                existingProduct.currentQuantity - oldProduit.quantiteAchetee;
              await window.db.updateProduct(
                existingProduct._id || existingProduct.id,
                {
                  currentQuantity: Math.max(0, restoredQuantity),
                  updatedAt: new Date().toISOString(),
                }
              );
            }
          }
        }
      }

      // Appliquer les nouvelles quantités
      for (const newProduit of newAchat.produits) {
        if (!newProduit.isNew) {
          const existingProduct = produits.find((p) => p.id === newProduit.id);
          if (existingProduct) {
            const updatedProduct = {
              ...existingProduct,
              currentQuantity:
                existingProduct.currentQuantity + newProduit.quantiteAchetee,
              purchasePrice: newProduit.prixAchat,
              updatedAt: new Date().toISOString(),
            };

            await window.db.updateProduct(
              existingProduct._id || existingProduct.id,
              updatedProduct
            );
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du stock:", error);
    }
  };

  const handleOpenDeleteDialog = (achat) => {
    setSelectedAchat(achat);
    setShowDeleteDialog(true);
  };

  const handleDeleteAchat = async () => {
    if (!selectedAchat) return;

    try {
      await window.db.deleteAchat(selectedAchat._id || selectedAchat.id);

      const updatedAchats = achats.filter(
        (a) => (a._id || a.id) !== (selectedAchat._id || selectedAchat.id)
      );
      setAchats(updatedAchats);

      await restoreStockAfterDelete(selectedAchat);

      setActionMessage(`Achat #${selectedAchat.numero} supprimé`);
      setTimeout(() => setActionMessage(""), 3000);

      handleCloseDialogs();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'achat:", error);
      setActionMessage("Erreur lors de la suppression");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const restoreStockAfterDelete = async (achat) => {
    try {
      const produits = await window.db.getProducts();

      for (const produitAchete of achat.produits) {
        const existingProduct = produits.find((p) => p.id === produitAchete.id);
        if (existingProduct) {
          const updatedProduct = {
            ...existingProduct,
            currentQuantity:
              existingProduct.currentQuantity - produitAchete.quantiteAchetee,
            updatedAt: new Date().toISOString(),
          };

          await window.db.updateProduct(
            existingProduct._id || existingProduct.id,
            updatedProduct
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la restauration du stock:", error);
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
    setFournisseurFilter("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleExportExcel = () => {
    const data = filteredAchats.map((achat) => ({
      ID: achat._id || achat.id,
      Date: new Date(achat.date).toLocaleDateString("fr-FR"),
      Fournisseur: achat.fournisseurNom || "Non spécifié",
      "Total (DA)": achat.total.toFixed(2),
      "Payé (DA)": achat.payedAmount.toFixed(2),
      "Reste (DA)": (
        achat.remainingAmount || achat.total - achat.payedAmount
      ).toFixed(2),
      Statut: formatStatus(achat.status),
      Produits: achat.produits
        .map((p) => `${p.nom} (${p.quantiteAchetee})`)
        .join(", "),
      Notes: achat.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Achats");

    XLSX.writeFile(
      workbook,
      `achats_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    setActionMessage("Export Excel terminé");
    setTimeout(() => setActionMessage(""), 3000);
  };

  const formatStatus = (status) => {
    switch (status) {
      case "completement-payer":
        return "Payé";
      case "partielement-payer":
        return "Partiel";
      case "non-payer":
        return "Impayé";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completement-payer":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "partielement-payer":
        return <Warning className="w-4 h-4 text-amber-500" />;
      case "non-payer":
        return <Error className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completement-payer":
        return "bg-emerald-100 text-emerald-800";
      case "partielement-payer":
        return "bg-amber-100 text-amber-800";
      case "non-payer":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleProduits = (achatId) => {
    if (expandedAchat === achatId) {
      setExpandedAchat(null);
    } else {
      setExpandedAchat(achatId);
    }
  };

  const stats = {
    total: achats.length,
    totalTTC: achats.reduce((sum, a) => sum + a.total, 0),
    totalPayed: achats.reduce((sum, a) => sum + a.payedAmount, 0),
    totalRemaining: achats.reduce(
      (sum, a) => sum + (a.remainingAmount || a.total - a.payedAmount),
      0
    ),
    fournisseurs: [...new Set(achats.map((a) => a.fournisseurNom))].length,
    completed: achats.filter((a) => a.status === "completement-payer").length,
    partial: achats.filter((a) => a.status === "partielement-payer").length,
    pending: achats.filter((a) => a.status === "non-payer").length,
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAchats.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAchats.length / itemsPerPage);

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
            {Math.min(indexOfLastItem, filteredAchats.length)}
          </span>{" "}
          sur <span className="font-semibold">{filteredAchats.length}</span>{" "}
          achats
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
                  ? "bg-blue-600 text-white"
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

  const AchatProduits = ({ achat }) => {
    if (!achat.produits || achat.produits.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          Aucun produit dans cet achat
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
                  Prix d'achat (DA)
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Sous-total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {achat.produits.map((produit, index) => {
                const sousTotal = produit.quantiteAchetee * produit.prixAchat;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {produit.nom}
                      </div>
                      <div className="text-xs text-gray-500">
                        {produit.isNew ? "Nouveau produit" : "Produit existant"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {produit.quantiteAchetee}
                        </span>
                        <span className="text-xs text-gray-500">
                          {produit.unite}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-600">
                        {produit.prixAchat.toFixed(2)} DA
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-emerald-600">
                        {sousTotal.toFixed(2)} DA
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
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
              <LocalShipping className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Historique des Achats
              </h1>
              <p className="text-sm text-gray-600">
                Gestion des achats fournisseurs
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:shadow flex items-center gap-2"
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
            <button
              onClick={handleOpenAddDialog}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:shadow flex items-center gap-2"
            >
              <Add className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvel Achat</span>
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
            placeholder="Rechercher par numéro, fournisseur, produit..."
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
                <option value="completement-payer">Payés</option>
                <option value="partielement-payer">Partiels</option>
                <option value="non-payer">Impayés</option>
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

            {/* Filtre par fournisseur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fournisseur
              </label>
              <input
                type="text"
                value={fournisseurFilter}
                onChange={(e) => setFournisseurFilter(e.target.value)}
                placeholder="Nom du fournisseur"
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
              <p className="text-sm text-gray-600">Total Achats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <LocalShipping className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Montant total: {stats.totalTTC.toFixed(2)} DA
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payé</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.totalPayed.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.completed} achat(s) payé(s)
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
              <Warning className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.pending} achat(s) impayé(s)
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fournisseurs</p>
              <p className="text-2xl font-bold text-purple-900">
                {stats.fournisseurs}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Business className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.partial} achat(s) partiellement payé(s)
          </div>
        </div>
      </div>

      {/* Tableau des achats */}
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
                  onClick={() => handleSort("numero")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Numéro
                    {sortField === "numero" &&
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
                <th
                  onClick={() => handleSort("fournisseurNom")}
                  className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Business className="w-4 h-4" />
                    Fournisseur
                    {sortField === "fournisseurNom" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpward className="w-3 h-3" />
                      ) : (
                        <ArrowDownward className="w-3 h-3" />
                      ))}
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
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <LocalShipping className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600">Aucun achat trouvé</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Modifiez vos critères de recherche ou créez un nouvel
                        achat
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((achat) => {
                  const remainingAmount =
                    achat.remainingAmount || achat.total - achat.payedAmount;

                  return (
                    <>
                      <tr
                        key={achat._id || achat.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              toggleProduits(achat._id || achat.id)
                            }
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                          >
                            {expandedAchat === (achat._id || achat.id)
                              ? "▼"
                              : "▶"}
                            <span className="text-sm">
                              {achat.produits?.length || 0} produit(s)
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-gray-900">
                            {achat.numero}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(achat.date).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Business className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {achat.fournisseurNom}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">
                            {achat.total.toFixed(2)} DA
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-emerald-600">
                            {achat.payedAmount.toFixed(2)} DA
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`font-medium ${
                              remainingAmount > 0
                                ? "text-amber-600"
                                : "text-gray-600"
                            }`}
                          >
                            {remainingAmount.toFixed(2)} DA
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(achat.status)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                achat.status
                              )}`}
                            >
                              {formatStatus(achat.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditDialog(achat)}
                              className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            {remainingAmount > 0 && (
                              <button
                                onClick={() => handleOpenPaymentDialog(achat)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                                title="Enregistrer un paiement"
                              >
                                <AttachMoney className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenDeleteDialog(achat)}
                              className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Delete className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedAchat === (achat._id || achat.id) && (
                        <tr>
                          <td colSpan="9" className="px-6 py-4 bg-gray-50">
                            <AchatProduits achat={achat} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination />

      {/* Dialog de paiement */}
      {showPaymentDialog && selectedAchat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AttachMoney className="text-emerald-600 w-5 h-5" />
                  Enregistrer un paiement fournisseur
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
                  Informations de l'achat
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Achat #:</span>
                    <span className="font-medium">{selectedAchat.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fournisseur:</span>
                    <span className="font-medium">
                      {selectedAchat.fournisseurNom}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-emerald-600">
                      {selectedAchat.total.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Déjà payé:</span>
                    <span className="font-medium">
                      {selectedAchat.payedAmount.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reste à payer:</span>
                    <span className="font-bold text-amber-600">
                      {selectedAchat.remainingAmount
                        ? selectedAchat.remainingAmount.toFixed(2)
                        : (
                            selectedAchat.total - selectedAchat.payedAmount
                          ).toFixed(2)}{" "}
                      DA
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
                    max={
                      selectedAchat.remainingAmount ||
                      selectedAchat.total - selectedAchat.payedAmount
                    }
                    value={paymentAmount}
                    onChange={(e) => handlePaymentAmountChange(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                      paymentError
                        ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                        : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-xs text-gray-500">DA</span>
                  </div>
                </div>

                {paymentError && (
                  <p className="text-sm text-rose-600 mt-1">{paymentError}</p>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    type="button"
                    onClick={handlePayFullRemaining}
                    className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 transition-colors"
                  >
                    Payer tout le reste (
                    {selectedAchat.remainingAmount
                      ? selectedAchat.remainingAmount.toFixed(2)
                      : (
                          selectedAchat.total - selectedAchat.payedAmount
                        ).toFixed(2)}{" "}
                    DA)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePaymentAmountChange(
                        selectedAchat.remainingAmount / 2
                      )
                    }
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                  >
                    Payer la moitié
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentAmountChange(0)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                  >
                    Annuler le paiement
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Montant payé actuel:</span>
                    <span className="text-emerald-600">
                      {selectedAchat.payedAmount.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Montant à ajouter:</span>
                    <span className="text-blue-600">
                      {paymentAmount.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>Nouveau montant payé:</span>
                    <span className="text-emerald-700">
                      {(
                        selectedAchat.payedAmount +
                        parseFloat(paymentAmount || 0)
                      ).toFixed(2)}{" "}
                      DA
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Nouveau reste à payer:</span>
                    <span
                      className={`${
                        (selectedAchat.remainingAmount ||
                          selectedAchat.total - selectedAchat.payedAmount) -
                          parseFloat(paymentAmount || 0) >
                        0
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {Math.max(
                        0,
                        (selectedAchat.remainingAmount ||
                          selectedAchat.total - selectedAchat.payedAmount) -
                          parseFloat(paymentAmount || 0)
                      ).toFixed(2)}{" "}
                      DA
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={handleCloseDialogs}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMakePayment}
                  disabled={
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0 ||
                    paymentError
                  }
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-sm font-medium rounded-lg hover:shadow flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      {showDeleteDialog && selectedAchat && (
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
                  Êtes-vous sûr de vouloir supprimer cet achat ?
                </p>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
                  <div className="text-sm text-rose-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Achat #:</span>
                      <span className="font-medium">
                        {selectedAchat.numero}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fournisseur:</span>
                      <span className="font-medium">
                        {selectedAchat.fournisseurNom}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">
                        {selectedAchat.total.toFixed(2)} DA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produits:</span>
                      <span className="font-medium">
                        {selectedAchat.produits?.length || 0} produit(s)
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Cette action est irréversible. L'achat sera définitivement
                  supprimé et les quantités en stock seront ajustées.
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
                  onClick={handleDeleteAchat}
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

      <AchatDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onAchatSaved={handleAchatSaved}
        editingAchat={editingAchat}
      />
    </div>
  );
};

export default Achats;
