import { useState, useEffect } from "react";
import {
  Add,
  Delete,
  Search,
  Save,
  Close,
  Edit,
  Person,
  ShoppingCart,
  CalendarToday,
  Numbers,
  Business,
  Email,
  Phone,
  LocationOn,
  AddCircle,
  Remove,
  Receipt,
  Store,
  Storefront,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Print,
  Download,
  ArrowUpward,
  ArrowDownward,
  Clear,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import ClientDialog from "../components/ClientDialog";
import DirectPrintInvoice from "../components/DirectPrintInvoice";

const ProformaInvoice = () => {
  // États pour les factures proforma
  const [invoices, setInvoices] = useState([]);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  // Informations de l'entreprise chargées depuis la base de données
  const [companyInfo, setCompanyInfo] = useState({
    name: "Votre Entreprise SARL",
    address: "123 Rue Principale, Ville, Pays",
    phone: "+213 XX XX XX XX",
    email: "contact@entreprise.dz",
    rc: "RC 123456789",
    nif: "NIF 987654321",
    nis: "NIS 456789123",
  });

  // États pour le formulaire de facture
  const [form, setForm] = useState({
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    client: null,
    companyInfo: {
      name: "Votre Entreprise SARL",
      address: "123 Rue Principale, Ville, Pays",
      phone: "+213 XX XX XX XX",
      email: "contact@entreprise.dz",
      rc: "RC 123456789",
      nif: "NIF 987654321",
      nis: "NIS 456789123",
    },
    items: [],
  });

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // États pour le tri
  const [sortField, setSortField] = useState("invoiceNumber");
  const [sortDirection, setSortDirection] = useState("desc");

  // États pour le dialog client
  const [showClientDialog, setShowClientDialog] = useState(false);

  // Etats pour l'impression de la facture
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] =
    useState(null);

  // Nouvel état pour l'impression directe
  const [directPrintInvoice, setDirectPrintInvoice] = useState(null);

  // Calculs automatiques
  const totalHT = form.items.reduce((sum, item) => sum + item.ht, 0);
  const totalTVA = form.items.reduce(
    (sum, item) => sum + (item.ttc - item.ht),
    0
  );
  const totalTTC = form.items.reduce((sum, item) => sum + item.ttc, 0);

  // Charger les données depuis NeDB
  useEffect(() => {
    loadData();
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const companies = await window.db.getCompanies();
      // Trouver l'entreprise courante
      let currentCompany = companies.find((c) => c.isCurrent === true);

      if (!currentCompany && companies.length > 0) {
        currentCompany = companies[0];
      }

      if (currentCompany) {
        const updatedCompanyInfo = {
          name: currentCompany.name || "Votre Entreprise SARL",
          address: currentCompany.address || "123 Rue Principale, Ville, Pays",
          phone: currentCompany.phone || "+213 XX XX XX XX",
          email: currentCompany.email || "contact@entreprise.dz",
          rc: currentCompany.rc || "RC 123456789",
          nif: currentCompany.nif || "NIF 987654321",
          nis: currentCompany.nis || "NIS 456789123",
        };

        setCompanyInfo(updatedCompanyInfo);

        // Mettre à jour le formulaire avec les informations de l'entreprise
        setForm((prev) => ({
          ...prev,
          companyInfo: updatedCompanyInfo,
        }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'entreprise:", error);
    }
  };

  const loadData = async () => {
    try {
      const [invoicesData, clientsData, productsData] = await Promise.all([
        window.db.getProformas(),
        window.db.getClients(),
        window.db.getProducts(),
      ]);

      setInvoices(invoicesData);
      setClients(clientsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setActionMessage("Erreur lors du chargement des données");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  // Filtrer les clients
  useEffect(() => {
    if (clientSearch.trim() === "") {
      setFilteredClients(clients.slice(0, 5));
    } else {
      const filtered = clients.filter(
        (client) =>
          client.nom?.toLowerCase().includes(clientSearch.toLowerCase()) ||
          client.telephone?.includes(clientSearch) ||
          (client.address &&
            client.address.toLowerCase().includes(clientSearch.toLowerCase()))
      );
      setFilteredClients(filtered.slice(0, 5));
    }
  }, [clientSearch, clients]);

  // Filtrer les produits
  useEffect(() => {
    if (productSearch.trim() === "") {
      setFilteredProducts(products.slice(0, 5));
    } else {
      const filtered = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
          (product.category &&
            product.category
              .toLowerCase()
              .includes(productSearch.toLowerCase())) ||
          (product.barcodes &&
            product.barcodes.some((barcode) =>
              barcode.toString().includes(productSearch)
            ))
      );
      setFilteredProducts(filtered.slice(0, 5));
    }
  }, [productSearch, products]);

  // Fonction utilitaire pour extraire l'année du numéro de facture
  const extractYearFromInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber) return null;
    const match = invoiceNumber.match(/-(\d{4})$/);
    return match ? parseInt(match[1]) : null;
  };

  // Fonction utilitaire pour extraire la séquence
  const extractSequenceFromInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber) return 0;
    const match = invoiceNumber.match(/^(\d{3})-/);
    return match ? parseInt(match[1]) : 0;
  };

  // Fonction pour générer le prochain numéro de facture
  const getNextInvoiceNumber = () => {
    const year = new Date().getFullYear();

    // Filtrer les factures de l'année en cours
    const currentYearInvoices = invoices.filter((invoice) => {
      if (!invoice.invoiceNumber) return false;
      const invoiceYear = extractYearFromInvoiceNumber(invoice.invoiceNumber);
      return invoiceYear === year;
    });

    // Trouver le plus grand numéro de séquence pour l'année en cours
    let maxSequence = 0;

    currentYearInvoices.forEach((invoice) => {
      if (invoice.invoiceNumber) {
        const sequence = extractSequenceFromInvoiceNumber(
          invoice.invoiceNumber
        );
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });

    // Incrémenter la séquence
    const newSequence = maxSequence + 1;

    // Formater le numéro de facture (001-2026)
    return `${newSequence.toString().padStart(3, "0")}-${year}`;
  };

  // Ouvrir le dialog pour créer une nouvelle facture
  const handleOpenNewInvoice = () => {
    setEditingInvoice(null);

    // Générer le numéro AVANT de définir le formulaire
    const newInvoiceNumber = getNextInvoiceNumber();

    setForm({
      invoiceNumber: newInvoiceNumber, // Définir directement le numéro généré
      date: new Date().toISOString().split("T")[0],
      client: null,
      companyInfo: companyInfo, // Utiliser les informations de l'entreprise chargées
      items: [],
    });
    setSelectedClient(null);
    setOpenInvoiceDialog(true);
  };

  // Ouvrir le dialog pour éditer une facture
  const handleOpenEditInvoice = async (invoice) => {
    setEditingInvoice(invoice);
    setForm(invoice);
    setSelectedClient(invoice.client);
    setOpenInvoiceDialog(true);
  };

  // Fermer le dialog
  const handleCloseDialog = () => {
    setOpenInvoiceDialog(false);
    setEditingInvoice(null);
  };

  // Gérer les changements du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("companyInfo.")) {
      const field = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        companyInfo: {
          ...prev.companyInfo,
          [field]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Ajouter un produit sélectionné
  const handleAddProduct = (product) => {
    // Vérifier si le produit est déjà dans la facture
    const existingIndex = form.items.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      // Si le produit existe déjà, augmenter la quantité
      const updatedItems = [...form.items];
      const currentItem = updatedItems[existingIndex];
      const unitPrice =
        currentItem.priceType === "retail"
          ? product.sellingPriceRetail
          : product.sellingPriceWholesale;

      updatedItems[existingIndex] = {
        ...currentItem,
        quantity: currentItem.quantity + 1,
        ht: (currentItem.quantity + 1) * unitPrice,
        ttc: (currentItem.quantity + 1) * unitPrice * (1 + product.tva / 100),
      };
      setForm((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    } else {
      // Ajouter un nouveau produit avec les prix détail et gros séparés
      const newItem = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        unitPrice: product.sellingPriceRetail,
        retailPrice: product.sellingPriceRetail,
        wholesalePrice: product.sellingPriceWholesale,
        quantity: 1,
        priceType: "retail", // "retail" ou "wholesale"
        tva: product.tva || 19,
        ht: product.sellingPriceRetail,
        ttc: product.sellingPriceRetail * (1 + (product.tva || 19) / 100),
      };

      setForm((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }

    setProductSearch("");
    setShowProductSearch(false);
  };

  // Gérer les changements d'items
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    const currentItem = updatedItems[index];
    const product = products.find((p) => p.id === currentItem.productId);

    if (!product) return;

    if (field === "quantity") {
      const quantity = parseFloat(value) || 1;
      const unitPrice =
        currentItem.priceType === "retail"
          ? product.sellingPriceRetail
          : product.sellingPriceWholesale;

      updatedItems[index] = {
        ...currentItem,
        quantity: quantity,
        unitPrice: unitPrice,
        ht: quantity * unitPrice,
        ttc: quantity * unitPrice * (1 + currentItem.tva / 100),
      };
    } else if (field === "priceType") {
      const priceType = value;
      const unitPrice =
        priceType === "retail"
          ? product.sellingPriceRetail
          : product.sellingPriceWholesale;

      updatedItems[index] = {
        ...currentItem,
        priceType: priceType,
        unitPrice: unitPrice,
        ht: currentItem.quantity * unitPrice,
        ttc: currentItem.quantity * unitPrice * (1 + currentItem.tva / 100),
      };
    }

    setForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Supprimer un item
  const handleRemoveItem = (index) => {
    const updatedItems = form.items.filter((_, i) => i !== index);
    setForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Sélectionner un client
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setForm((prev) => ({
      ...prev,
      client,
    }));
    setShowClientSearch(false);
    setClientSearch("");
  };

  // Supprimer le client sélectionné
  const handleRemoveClient = () => {
    setSelectedClient(null);
    setForm((prev) => ({
      ...prev,
      client: null,
    }));
  };

  // Sauvegarder la facture
  const handleSaveInvoice = async () => {
    if (!selectedClient) {
      setActionMessage("Veuillez sélectionner un client");
      setTimeout(() => setActionMessage(""), 3000);
      return;
    }

    if (form.items.length === 0) {
      setActionMessage("Veuillez ajouter au moins un produit");
      setTimeout(() => setActionMessage(""), 3000);
      return;
    }

    // Vérifier et générer un numéro de facture s'il est vide (sécurité)
    if (!form.invoiceNumber || form.invoiceNumber.trim() === "") {
      const newInvoiceNumber = getNextInvoiceNumber();
      setForm((prev) => ({ ...prev, invoiceNumber: newInvoiceNumber }));
      await saveInvoiceWithNumber(newInvoiceNumber);
      return;
    }

    await saveInvoiceWithNumber(form.invoiceNumber);
  };

  // Fonction helper pour sauvegarder avec le numéro
  const saveInvoiceWithNumber = async (invoiceNumber) => {
    try {
      const invoiceData = {
        ...form,
        invoiceNumber: invoiceNumber,
        client: selectedClient,
        totalHT,
        totalTVA,
        totalTTC,
        createdAt: editingInvoice
          ? editingInvoice.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let savedInvoice;

      if (editingInvoice) {
        // Mettre à jour la facture existante dans NeDB
        savedInvoice = await window.db.updateProforma(
          editingInvoice._id || editingInvoice.id,
          invoiceData
        );

        // Mettre à jour l'état local
        setInvoices(
          invoices.map((inv) =>
            (inv._id || inv.id) === (editingInvoice._id || editingInvoice.id)
              ? { ...invoiceData, _id: editingInvoice._id || editingInvoice.id }
              : inv
          )
        );
        setActionMessage("Facture modifiée avec succès");
      } else {
        // Ajouter une nouvelle facture dans NeDB
        savedInvoice = await window.db.addProforma(invoiceData);

        // Mettre à jour l'état local avec l'ID retourné par NeDB
        setInvoices([...invoices, savedInvoice]);
        setActionMessage("Facture créée avec succès");
      }

      setTimeout(() => setActionMessage(""), 3000);
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la facture:", error);
      setActionMessage("Erreur lors de la sauvegarde de la facture");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  // Supprimer une facture
  const handleDeleteInvoice = async (invoice) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la facture proforma ${invoice.invoiceNumber} ?`
      )
    ) {
      try {
        // Supprimer de NeDB
        await window.db.deleteProforma(invoice._id || invoice.id);

        // Mettre à jour l'état local
        setInvoices(
          invoices.filter(
            (inv) => (inv._id || inv.id) !== (invoice._id || invoice.id)
          )
        );

        setActionMessage(
          `Facture ${invoice.invoiceNumber} supprimée avec succès`
        );
        setTimeout(() => setActionMessage(""), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression de la facture:", error);
        setActionMessage("Erreur lors de la suppression de la facture");
        setTimeout(() => setActionMessage(""), 3000);
      }
    }
  };

  // Convertir un nombre en lettres (version simplifiée)
  const numberToWords = (num) => {
    const units = [
      "",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
    ];
    const teens = [
      "dix",
      "onze",
      "douze",
      "treize",
      "quatorze",
      "quinze",
      "seize",
      "dix-sept",
      "dix-huit",
      "dix-neuf",
    ];
    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante-dix",
      "quatre-vingt",
      "quatre-vingt-dix",
    ];

    if (num === 0) return "zéro";

    let words = "";
    let integerPart = Math.floor(num);
    let decimalPart = Math.round((num - integerPart) * 100);

    // Convertir la partie entière
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      words += numberToWords(thousands) + " mille ";
      integerPart %= 1000;
    }

    if (integerPart >= 100) {
      const hundreds = Math.floor(integerPart / 100);
      words += units[hundreds] + " cent ";
      integerPart %= 100;
      if (integerPart === 0) words += "s";
    }

    if (integerPart >= 20) {
      const ten = Math.floor(integerPart / 10);
      words += tens[ten] + " ";
      integerPart %= 10;

      if (integerPart > 0) {
        words += units[integerPart] + " ";
      }
    } else if (integerPart >= 10) {
      words += teens[integerPart - 10] + " ";
      integerPart = 0;
    } else if (integerPart > 0) {
      words += units[integerPart] + " ";
    }

    words += "dinars";

    // Ajouter la partie décimale
    if (decimalPart > 0) {
      words += " et " + numberToWords(decimalPart) + " centimes";
    }

    return words.trim();
  };

  // Nouvelle fonction pour l'impression directe
  const handleDirectPrint = (invoice) => {
    const invoiceData = {
      ...invoice,
      items:
        invoice.items?.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          priceType: item.priceType || "retail",
          tva: item.tva || 19,
          ht: item.ht,
          ttc: item.ttc,
        })) || [],
      dueDate: invoice.date || new Date().toISOString().split("T")[0],
      companyInfo: invoice.companyInfo || companyInfo, // Utiliser companyInfo chargé
    };

    setDirectPrintInvoice(invoiceData);
  };

  // Trier les factures
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtrer et trier les factures
  const filteredAndSortedInvoices = invoices
    .filter((invoice) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
        (invoice.client &&
          invoice.client.nom?.toLowerCase().includes(searchLower)) ||
        (invoice.client && invoice.client.telephone?.includes(searchTerm)) ||
        invoice.totalTTC?.toString().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "date" || sortField === "createdAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (
        sortField === "totalHT" ||
        sortField === "totalTVA" ||
        sortField === "totalTTC"
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

  // Pagination
  const indexOfLastInvoice = currentPage * itemsPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - itemsPerPage;
  const currentInvoices = filteredAndSortedInvoices.slice(
    indexOfFirstInvoice,
    indexOfLastInvoice
  );
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Composant de pagination
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
          <span className="font-semibold">{indexOfFirstInvoice + 1}</span> à{" "}
          <span className="font-semibold">
            {Math.min(indexOfLastInvoice, filteredAndSortedInvoices.length)}
          </span>{" "}
          sur{" "}
          <span className="font-semibold">
            {filteredAndSortedInvoices.length}
          </span>{" "}
          factures
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
                  ? "bg-purple-600 text-white"
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

  // Statistiques
  const stats = {
    total: invoices.length,
    totalTTC: invoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0),
    totalHT: invoices.reduce((sum, inv) => sum + (inv.totalHT || 0), 0),
    totalTVA: invoices.reduce((sum, inv) => sum + (inv.totalTVA || 0), 0),
    averageTTC:
      invoices.length > 0
        ? invoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0) /
          invoices.length
        : 0,
    thisMonth: invoices.filter(
      (inv) =>
        new Date(inv.date || inv.createdAt).getMonth() ===
          new Date().getMonth() &&
        new Date(inv.date || inv.createdAt).getFullYear() ===
          new Date().getFullYear()
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Factures Proforma
              </h1>
              <p className="text-sm text-gray-600">
                Créez et gérez vos factures proforma
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOpenNewInvoice}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:shadow flex items-center gap-2"
            >
              <Add className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle Facture</span>
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
            placeholder="Rechercher une facture par numéro, client ou montant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Factures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.thisMonth} ce mois-ci
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total TTC</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.totalTTC.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Moyenne: {stats.averageTTC.toFixed(2)} DA
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total HT</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalHT.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">Hors taxes</div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total TVA</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.totalTVA.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Business className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Taxe sur la valeur ajoutée
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Liste des Factures ({filteredAndSortedInvoices.length})
          </h2>
          <div className="text-sm text-gray-500 hidden lg:block">
            Cliquez sur les en-têtes pour trier
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Aucune facture proforma
            </h3>
            <p className="text-purple-700 mb-4">
              Créez votre première facture proforma !
            </p>
            <button
              onClick={handleOpenNewInvoice}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Add />
              Créer une facture
            </button>
          </div>
        ) : filteredAndSortedInvoices.length === 0 ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-amber-700">
              Aucune facture ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <>
            {/* Tableau des factures */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-700 to-indigo-800">
                    <tr>
                      <th
                        onClick={() => handleSort("invoiceNumber")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Numbers className="w-4 h-4" />
                          N° Facture
                          {sortField === "invoiceNumber" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("date")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
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
                        onClick={() => handleSort("totalHT")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Total HT
                          {sortField === "totalHT" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("totalTVA")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          TVA
                          {sortField === "totalTVA" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("totalTTC")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Total TTC
                          {sortField === "totalTTC" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Articles
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentInvoices.map((invoice) => (
                      <tr
                        key={invoice._id || invoice.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-gray-900">
                            {invoice.invoiceNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(
                              invoice.date || invoice.createdAt
                            ).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Person className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {invoice.client?.nom || "Client non spécifié"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {invoice.client?.telephone || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {invoice.totalHT?.toFixed(2) || "0.00"} DA
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-blue-600">
                            {invoice.totalTVA?.toFixed(2) || "0.00"} DA
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-purple-600">
                            {invoice.totalTTC?.toFixed(2) || "0.00"} DA
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700">
                            {invoice.items?.length || 0} article(s)
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditInvoice(invoice)}
                              className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDirectPrint(invoice)}
                              className="p-2 text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                              title="Imprimer"
                            >
                              <Print className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice)}
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
              {currentInvoices.map((invoice) => (
                <div
                  key={invoice._id || invoice.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {invoice.invoiceNumber}
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(
                            invoice.date || invoice.createdAt
                          ).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Person className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {invoice.client?.nom || "Client non spécifié"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditInvoice(invoice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDirectPrint(invoice)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Print className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-xs text-gray-600">HT</div>
                        <div className="font-medium text-gray-900">
                          {invoice.totalHT?.toFixed(2) || "0.00"} DA
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">TVA</div>
                        <div className="font-medium text-blue-600">
                          {invoice.totalTVA?.toFixed(2) || "0.00"} DA
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">TTC</div>
                        <div className="font-bold text-purple-600">
                          {invoice.totalTTC?.toFixed(2) || "0.00"} DA
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Articles: {invoice.items?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination />
          </>
        )}
      </div>

      {/* Dialog de création/édition de facture */}
      {openInvoiceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt />
                  {editingInvoice
                    ? "Modifier Facture"
                    : "Nouvelle Facture Proforma"}
                </h2>
                <button
                  onClick={handleCloseDialog}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Close />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Informations de l'entreprise */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Business />
                  Informations de l'entreprise
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'entreprise *
                    </label>
                    <input
                      type="text"
                      name="companyInfo.name"
                      value={form.companyInfo.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      name="companyInfo.address"
                      value={form.companyInfo.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="text"
                      name="companyInfo.phone"
                      value={form.companyInfo.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="companyInfo.email"
                      value={form.companyInfo.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° RC
                    </label>
                    <input
                      type="text"
                      name="companyInfo.rc"
                      value={form.companyInfo.rc}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° NIF
                    </label>
                    <input
                      type="text"
                      name="companyInfo.nif"
                      value={form.companyInfo.nif}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Informations de la facture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-2">
                      <Numbers />
                      N° Facture *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={form.invoiceNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    readOnly={!editingInvoice}
                    title={!editingInvoice ? "Généré automatiquement" : ""}
                  />
                  {!editingInvoice && (
                    <p className="text-xs text-gray-500 mt-1">
                      Généré automatiquement: {form.invoiceNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-2">
                      <CalendarToday />
                      Date *
                    </span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Sélection du client */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Person />
                  Client (Destinataire)
                </h3>

                {!selectedClient ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowClientSearch(true)}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Person className="w-5 h-5 text-gray-400" />
                      <span>Sélectionner un client</span>
                    </button>

                    <button
                      onClick={() => setShowClientDialog(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-purple-600"
                    >
                      <Add />
                      <span>Ajouter un nouveau client</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Person className="w-5 h-5 text-purple-600" />
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {selectedClient.nom}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {selectedClient.address}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{selectedClient.telephone}</span>
                          </div>
                          {selectedClient.n_rc && (
                            <div className="flex items-center gap-2">
                              <Business className="w-4 h-4 text-gray-400" />
                              <span>NRC: {selectedClient.n_rc}</span>
                            </div>
                          )}
                          {selectedClient.n_if && (
                            <div className="flex items-center gap-2">
                              <Business className="w-4 h-4 text-gray-400" />
                              <span>NIF: {selectedClient.n_if}</span>
                            </div>
                          )}
                          {selectedClient.n_is && (
                            <div className="flex items-center gap-2">
                              <Business className="w-4 h-4 text-gray-400" />
                              <span>NIS: {selectedClient.n_is}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveClient}
                        className="ml-2 text-rose-600 hover:text-rose-700"
                        title="Supprimer le client"
                      >
                        <Close className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Recherche de client */}
                {showClientSearch && (
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Rechercher un client..."
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun client trouvé
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <button
                            key={client._id || client.id}
                            onClick={() => handleSelectClient(client)}
                            className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {client.nom}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <div>Téléphone: {client.telephone}</div>
                                {client.address && (
                                  <div>Adresse: {client.address}</div>
                                )}
                                {(client.n_rc ||
                                  client.n_if ||
                                  client.n_is) && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {client.n_rc && `RC: ${client.n_rc}`}
                                    {client.n_if && `, NIF: ${client.n_if}`}
                                    {client.n_is && `, NIS: ${client.n_is}`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Person className="w-5 h-5 text-gray-400" />
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowClientSearch(false);
                        setShowClientDialog(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-purple-600"
                    >
                      <Add />
                      Ajouter un nouveau client
                    </button>
                  </div>
                )}
              </div>

              {/* Recherche et ajout de produits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart />
                    Produits ({form.items.length})
                  </h3>

                  <button
                    type="button"
                    onClick={() => setShowProductSearch(!showProductSearch)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:shadow flex items-center gap-2"
                  >
                    <AddCircle />
                    {showProductSearch
                      ? "Masquer recherche"
                      : "Ajouter un produit"}
                  </button>
                </div>

                {/* Recherche de produits */}
                {showProductSearch && (
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Rechercher un produit par nom, catégorie ou code-barres..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {productSearch && filteredProducts.length > 0 && (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                        {filteredProducts.map((product) => (
                          <div
                            key={product._id || product.id}
                            className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Storefront className="w-3 h-3" />
                                      <span className="font-medium">
                                        Détail:
                                      </span>{" "}
                                      {product.sellingPriceRetail?.toFixed(2) ||
                                        "0.00"}{" "}
                                      DA
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Store className="w-3 h-3" />
                                      <span className="font-medium">
                                        Gros:
                                      </span>{" "}
                                      {product.sellingPriceWholesale?.toFixed(
                                        2
                                      ) || "0.00"}{" "}
                                      DA
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span>
                                      <span className="font-medium">TVA:</span>{" "}
                                      {product.tva || 19}%
                                    </span>
                                    <span>
                                      <span className="font-medium">
                                        Stock:
                                      </span>{" "}
                                      {product.currentQuantity?.toFixed(2) ||
                                        "0.00"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {product.category && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                        {product.category}
                                      </span>
                                    )}
                                    {product.unit && (
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                                        {product.unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddProduct(product)}
                                className="ml-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                              >
                                <Add />
                                Ajouter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {productSearch && filteredProducts.length === 0 && (
                      <div className="text-center p-4 text-gray-500">
                        Aucun produit trouvé
                      </div>
                    )}
                  </div>
                )}

                {/* Table des produits */}
                {form.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Produit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type Prix
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Prix unitaire HT
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantité
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            TVA (%)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Montant HT
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Montant TTC
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {form.items.map((item, index) => {
                          const product = products.find(
                            (p) => p.id === item.productId
                          );
                          if (!product) return null;

                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {item.productName}
                                </div>
                                {product.category && (
                                  <div className="text-xs text-gray-500">
                                    {product.category}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={item.priceType}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "priceType",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                                >
                                  <option value="retail">Détail</option>
                                  <option value="wholesale">Gros</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {item.unitPrice?.toFixed(2) || "0.00"} DA
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  {item.priceType === "retail" ? (
                                    <>
                                      <Storefront className="w-3 h-3" />
                                      Détail
                                    </>
                                  ) : (
                                    <>
                                      <Store className="w-3 h-3" />
                                      Gros
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      handleItemChange(
                                        index,
                                        "quantity",
                                        Math.max(1, item.quantity - 1)
                                      )
                                    }
                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                  >
                                    <Remove className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    className="w-16 text-center px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                  />
                                  <button
                                    onClick={() =>
                                      handleItemChange(
                                        index,
                                        "quantity",
                                        item.quantity + 1
                                      )
                                    }
                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                  >
                                    <Add className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-900">
                                  {item.tva || 19}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  Fixe
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {item.ht?.toFixed(2) || "0.00"} DA
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-purple-600">
                                  {item.ttc?.toFixed(2) || "0.00"} DA
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-rose-600 hover:text-rose-700"
                                  title="Supprimer"
                                >
                                  <Delete className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Aucun produit ajouté</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Cliquez sur "Ajouter un produit" pour sélectionner des
                      produits
                    </p>
                  </div>
                )}
              </div>

              {/* Totaux */}
              {form.items.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total HT</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {totalHT.toFixed(2)} DA
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">TVA</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {totalTVA.toFixed(2)} DA
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total TTC</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {totalTTC.toFixed(2)} DA
                      </div>
                    </div>
                  </div>

                  {/* Montant en lettres */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">
                      Arrêtée la présente facture à la somme de :
                    </div>
                    <div className="font-medium text-gray-900">
                      {numberToWords(totalTTC).toUpperCase()}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center justify-center gap-2"
                >
                  <Close />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Save />
                  {editingInvoice ? "Mettre à jour" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Utilisation du ClientDialog réutilisable */}
      <ClientDialog
        open={showClientDialog}
        onClose={() => setShowClientDialog(false)}
        onClientSaved={async (clientData, action) => {
          if (action === "add") {
            try {
              const savedClient = await window.db.addClient(clientData);
              const updatedClients = [...clients, savedClient];
              setClients(updatedClients);

              // Sélectionner automatiquement le nouveau client
              handleSelectClient(savedClient);
            } catch (error) {
              console.error("Erreur lors de l'ajout du client:", error);
              setActionMessage("Erreur lors de l'ajout du client");
              setTimeout(() => setActionMessage(""), 3000);
            }
          }
          setShowClientDialog(false);
        }}
        editingClient={null}
      />

      {/* Impression directe */}
      {directPrintInvoice && (
        <DirectPrintInvoice
          invoiceData={directPrintInvoice}
          onClose={() => setDirectPrintInvoice(null)}
          invoiceType="PROFORMA"
        />
      )}
    </div>
  );
};;

export default ProformaInvoice;