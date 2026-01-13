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
  Inventory,
  Warning,
  AttachMoney,
  CheckCircle,
  Payment,
  Check,
  TrendingUp,
} from "@mui/icons-material";
import ClientDialog from "../components/ClientDialog";
import DirectPrintInvoice from "../components/DirectPrintInvoice";

const SaleInvoicePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

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
    status: "completementpayer",
    payedAmount: 0,
    paymentMethod: "cash",
  });

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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("invoiceNumber");
  const [sortDirection, setSortDirection] = useState("desc");

  const [showClientDialog, setShowClientDialog] = useState(false);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] =
    useState(null);
  const [saleMessage, setSaleMessage] = useState("");

  // Nouvel état pour l'impression directe
  const [directPrintInvoice, setDirectPrintInvoice] = useState(null);

  const totalHT = form.items.reduce((sum, item) => sum + item.ht, 0);
  const totalTVA = form.items.reduce(
    (sum, item) => sum + (item.ttc - item.ht),
    0
  );
  const totalTTC = form.items.reduce((sum, item) => sum + item.ttc, 0);

  // Calculer le bénéfice total
  const totalProfit = form.items.reduce((profit, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const purchasePrice = product.purchasePrice || 0;
      return profit + (item.unitPrice - purchasePrice) * item.quantity;
    }
    return profit;
  }, 0);

  const calculateRemaining = () => {
    return Math.max(0, totalTTC - form.payedAmount);
  };

  useEffect(() => {
    loadInvoices();
    loadClients();
    loadProducts();
  }, []);

  const loadInvoices = async () => {
    try {
      const invoicesData = await window.db.getInvoices();
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error);
      setInvoices([]);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await window.db.getClients();
      setClients(clientsData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      setClients([]);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await window.db.getProducts();
      setProducts(productsData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    if (form.status === "completementpayer") {
      setForm((prev) => ({
        ...prev,
        payedAmount: totalTTC,
      }));
    } else if (form.status === "nonpayer") {
      setForm((prev) => ({
        ...prev,
        payedAmount: 0,
      }));
    } else if (form.payedAmount > totalTTC) {
      setForm((prev) => ({
        ...prev,
        payedAmount: totalTTC,
      }));
    }
  }, [form.status, totalTTC]);

  useEffect(() => {
    if (clientSearch.trim() === "") {
      setFilteredClients(clients.slice(0, 5));
    } else {
      const filtered = clients.filter(
        (client) =>
          client.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
          client.telephone.includes(clientSearch) ||
          (client.address &&
            client.address.toLowerCase().includes(clientSearch.toLowerCase()))
      );
      setFilteredClients(filtered.slice(0, 5));
    }
  }, [clientSearch, clients]);

  useEffect(() => {
    if (productSearch.trim() === "") {
      setFilteredProducts(products.slice(0, 5));
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
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

  const extractYearFromInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber) return null;
    const match = invoiceNumber.match(/-(\d{4})$/);
    return match ? parseInt(match[1]) : null;
  };

  const extractSequenceFromInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber) return 0;
    const match = invoiceNumber.match(/^(\d{3})-/);
    return match ? parseInt(match[1]) : 0;
  };

  const getNextInvoiceNumber = () => {
    const year = new Date().getFullYear();

    const currentYearInvoices = invoices.filter((invoice) => {
      if (!invoice.invoiceNumber) return false;
      const invoiceYear = extractYearFromInvoiceNumber(invoice.invoiceNumber);
      return invoiceYear === year;
    });

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

    const newSequence = maxSequence + 1;

    return `${newSequence.toString().padStart(3, "0")}-${year}`;
  };

  const handleOpenNewInvoice = () => {
    setEditingInvoice(null);

    const newInvoiceNumber = getNextInvoiceNumber();

    setForm({
      invoiceNumber: newInvoiceNumber,
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
      status: "completementpayer",
      payedAmount: 0,
      paymentMethod: "cash",
    });
    setSelectedClient(null);
    setOpenInvoiceDialog(true);
  };

  const handleOpenEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setForm(invoice);
    setSelectedClient(invoice.client);
    setOpenInvoiceDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenInvoiceDialog(false);
    setEditingInvoice(null);
  };

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

  const handleAddProduct = (product) => {
    if (product.currentQuantity <= 0) {
      setSaleMessage("Produit en rupture de stock");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    const existingIndex = form.items.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      const updatedItems = [...form.items];
      const currentItem = updatedItems[existingIndex];
      const currentQuantity = currentItem.quantity;
      const productStock = product.currentQuantity;

      if (currentQuantity < productStock) {
        const unitPrice =
          currentItem.priceType === "retail"
            ? product.sellingPriceRetail
            : product.sellingPriceWholesale;

        const profitPerUnit = unitPrice - product.purchasePrice;

        updatedItems[existingIndex] = {
          ...currentItem,
          quantity: currentQuantity + 1,
          unitPrice: unitPrice,
          ht: (currentQuantity + 1) * unitPrice,
          ttc: (currentQuantity + 1) * unitPrice * (1 + product.tva / 100),
          profitPerUnit: profitPerUnit,
          totalProfit: (currentQuantity + 1) * profitPerUnit,
        };
        setForm((prev) => ({
          ...prev,
          items: updatedItems,
        }));
        setSaleMessage(`${product.name} quantité augmentée`);
      } else {
        setSaleMessage("Stock insuffisant pour ce produit");
      }
    } else {
      const unitPrice = product.sellingPriceRetail;
      const profitPerUnit = unitPrice - product.purchasePrice;

      const newItem = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        unitPrice: unitPrice,
        retailPrice: product.sellingPriceRetail,
        wholesalePrice: product.sellingPriceWholesale,
        quantity: 1,
        priceType: "retail",
        tva: product.tva || 19,
        ht: unitPrice,
        ttc: unitPrice * (1 + (product.tva || 19) / 100),
        purchasePrice: product.purchasePrice,
        profitPerUnit: profitPerUnit,
        totalProfit: profitPerUnit,
      };

      setForm((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setSaleMessage(`${product.name} ajouté à la facture`);
    }

    setProductSearch("");
    setShowProductSearch(false);
    setTimeout(() => setSaleMessage(""), 3000);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    const currentItem = updatedItems[index];
    const product = products.find((p) => p.id === currentItem.productId);

    if (!product) return;

    if (field === "quantity") {
      const quantity = Math.max(1, parseFloat(value) || 1);
      if (quantity > product.currentQuantity) {
        setSaleMessage(`Stock insuffisant pour ${product.name}`);
        setTimeout(() => setSaleMessage(""), 3000);
        return;
      }

      const unitPrice =
        currentItem.priceType === "retail"
          ? product.sellingPriceRetail
          : product.sellingPriceWholesale;

      const profitPerUnit = unitPrice - product.purchasePrice;

      updatedItems[index] = {
        ...currentItem,
        quantity: quantity,
        unitPrice: unitPrice,
        ht: quantity * unitPrice,
        ttc: quantity * unitPrice * (1 + currentItem.tva / 100),
        totalProfit: quantity * profitPerUnit,
      };
    } else if (field === "priceType") {
      const priceType = value;
      const unitPrice =
        priceType === "retail"
          ? product.sellingPriceRetail
          : product.sellingPriceWholesale;

      const profitPerUnit = unitPrice - product.purchasePrice;

      updatedItems[index] = {
        ...currentItem,
        priceType: priceType,
        unitPrice: unitPrice,
        ht: currentItem.quantity * unitPrice,
        ttc: currentItem.quantity * unitPrice * (1 + currentItem.tva / 100),
        profitPerUnit: profitPerUnit,
        totalProfit: currentItem.quantity * profitPerUnit,
      };
    }

    setForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleQuantityAdjust = (index, delta) => {
    const currentItem = form.items[index];
    const product = products.find((p) => p.id === currentItem.productId);

    if (!product) return;

    const newQuantity = Math.max(1, currentItem.quantity + delta);

    if (newQuantity > product.currentQuantity) {
      setSaleMessage(`Stock insuffisant pour ${product.name}`);
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    handleItemChange(index, "quantity", newQuantity);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = form.items.filter((_, i) => i !== index);
    setForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setSaleMessage("Produit retiré");
    setTimeout(() => setSaleMessage(""), 3000);
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setForm((prev) => ({
      ...prev,
      client,
    }));
    setShowClientSearch(false);
    setClientSearch("");
  };

  const handleRemoveClient = () => {
    setSelectedClient(null);
    setForm((prev) => ({
      ...prev,
      client: null,
    }));
  };

  const handlePayedAmountChange = (value) => {
    let payedAmount = parseFloat(value) || 0;

    if (payedAmount > totalTTC) {
      payedAmount = totalTTC;
    }

    if (payedAmount < 0) {
      payedAmount = 0;
    }

    let newStatus = form.status;
    if (payedAmount === totalTTC) {
      newStatus = "completementpayer";
    } else if (payedAmount === 0) {
      newStatus = "nonpayer";
    } else {
      newStatus = "partielementpayer";
    }

    setForm({
      ...form,
      payedAmount: payedAmount,
      status: newStatus,
    });
  };

  const handlePaymentMethodChange = (method) => {
    setForm({
      ...form,
      paymentMethod: method,
    });
  };

  const handlePayFullAmount = () => {
    setForm({
      ...form,
      payedAmount: totalTTC,
      status: "completementpayer",
    });
  };

  const handlePayRemaining = () => {
    setForm({
      ...form,
      payedAmount: totalTTC,
      status: "completementpayer",
    });
  };

  const handlePayNothing = () => {
    setForm({
      ...form,
      payedAmount: 0,
      status: "nonpayer",
    });
  };

  const formatStatus = (status) => {
    switch (status) {
      case "completementpayer":
        return "Complètement payé";
      case "partielementpayer":
        return "Partiellement payé";
      case "nonpayer":
        return "Non payé";
      default:
        return status;
    }
  };

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

    if (decimalPart > 0) {
      words += " et " + numberToWords(decimalPart) + " centimes";
    }

    return words.trim();
  };

  const handleSaveInvoice = async () => {
    if (!selectedClient) {
      setSaleMessage("Veuillez sélectionner un client");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    if (form.items.length === 0) {
      setSaleMessage("Veuillez ajouter au moins un produit");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    for (const item of form.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && item.quantity > product.currentQuantity) {
        setSaleMessage(`Stock insuffisant pour ${item.productName}`);
        setTimeout(() => setSaleMessage(""), 3000);
        return;
      }
    }

    const remaining = calculateRemaining();

    const invoiceData = {
      ...form,
      id: editingInvoice ? editingInvoice.id : Date.now(),
      client: selectedClient,
      totalHT,
      totalTVA,
      totalTTC,
      totalProfit,
      remainingAmount: remaining,
      createdAt: editingInvoice
        ? editingInvoice.createdAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Mettre à jour les quantités des produits
      // Pour l'édition, nous devons d'abrestaurer l'ancien stock puis appliquer le nouveau
      if (editingInvoice) {
        // Restaurer les quantités des produits de l'ancienne facture
        for (const oldItem of editingInvoice.items) {
          const product = products.find((p) => p.id === oldItem.productId);
          if (product) {
            const restoredQuantity = product.currentQuantity + oldItem.quantity;
            const updatedProduct = {
              ...product,
              currentQuantity: restoredQuantity,
            };
            await window.db.updateProduct(
              product._id || product.id,
              updatedProduct
            );
          }
        }
        // Recharger les produits après restauration
        await loadProducts();
      }

      // Appliquer les nouvelles quantités
      for (const item of form.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const newQuantity = product.currentQuantity - item.quantity;
          const updatedProduct = {
            ...product,
            currentQuantity: Math.max(0, newQuantity),
          };

          await window.db.updateProduct(
            product._id || product.id,
            updatedProduct
          );
        }
      }

      // Recharger les produits
      await loadProducts();

      // Préparer les données de vente
      const saleData = {
        id: editingInvoice ? editingInvoice.id : Date.now(),
        date: form.date,
        total: totalTTC,
        payedAmount: form.payedAmount,
        remainingAmount: remaining,
        totalProfit: totalProfit,
        products: form.items.map((item) => ({
          id: item.productId,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.ttc,
          purchasePrice:
            products.find((p) => p.id === item.productId)?.purchasePrice || 0,
          profitPerUnit:
            item.profitPerUnit ||
            item.unitPrice -
              (products.find((p) => p.id === item.productId)?.purchasePrice ||
                0),
          totalProfit:
            item.totalProfit ||
            (item.unitPrice -
              (products.find((p) => p.id === item.productId)?.purchasePrice ||
                0)) *
              item.quantity,
        })),
        client: selectedClient,
        status: form.status,
        invoiceNumber: form.invoiceNumber,
        updatedAt: new Date().toISOString(),
      };

      // Gérer la vente (mettre à jour si édition, créer si nouvelle)
      if (editingInvoice) {
        // Chercher la vente existante par numéro de facture
        const allSales = await window.db.getSales();
        const existingSale = allSales.find(
          (sale) => sale.invoiceNumber === editingInvoice.invoiceNumber
        );

        if (existingSale) {
          // Mettre à jour la vente existante
          await window.db.updateSale(existingSale._id, saleData);
        } else {
          // Si pas trouvée, créer une nouvelle vente (pour compatibilité)
          await window.db.addSale(saleData);
        }
      } else {
        // Créer une nouvelle vente
        await window.db.addSale(saleData);
      }

      // Enregistrer ou mettre à jour la facture
      if (editingInvoice) {
        await window.db.updateInvoice(
          editingInvoice._id || editingInvoice.id,
          invoiceData
        );
        setInvoices(
          invoices.map((inv) =>
            (inv._id || inv.id) === (editingInvoice._id || editingInvoice.id)
              ? invoiceData
              : inv
          )
        );
      } else {
        const savedInvoice = await window.db.addInvoice(invoiceData);
        setInvoices([...invoices, savedInvoice]);
      }

      setSaleMessage(
        `Vente ${editingInvoice ? "mise à jour" : "enregistrée"} ! Stock mis à jour. Total: ${totalTTC.toFixed(2)} DA`
      );

      const invoicePreviewData = {
        ...invoiceData,
        items: form.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          priceType: item.priceType,
          tva: item.tva || 19,
          ht: item.ht,
          ttc: item.ttc,
          profitPerUnit: item.profitPerUnit || 0,
          totalProfit: item.totalProfit || 0,
        })),
        totalHT,
        totalTVA,
        totalTTC,
        totalProfit,
      };

      setSelectedInvoiceForPreview(invoicePreviewData);

      handleCloseDialog();

      setTimeout(() => setSaleMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la facture:", error);
      setSaleMessage(
        `Erreur lors de ${editingInvoice ? "la mise à jour" : "l'enregistrement"} de la facture`
      );
      setTimeout(() => setSaleMessage(""), 3000);
    }
  };

  const handleQuickSale = async () => {
    if (!selectedClient) {
      setSaleMessage("Veuillez sélectionner un client");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    if (form.items.length === 0) {
      setSaleMessage("Veuillez ajouter au moins un produit");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    for (const item of form.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && item.quantity > product.currentQuantity) {
        setSaleMessage(`Stock insuffisant pour ${item.productName}`);
        setTimeout(() => setSaleMessage(""), 3000);
        return;
      }
    }

    const newInvoiceNumber = getNextInvoiceNumber();

    try {
      // Mettre à jour les quantités des produits
      for (const item of form.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const newQuantity = product.currentQuantity - item.quantity;
          const updatedProduct = {
            ...product,
            currentQuantity: Math.max(0, newQuantity),
          };

          await window.db.updateProduct(
            product._id || product.id,
            updatedProduct
          );
        }
      }

      // Recharger les produits
      await loadProducts();

      const invoiceData = {
        ...form,
        invoiceNumber: newInvoiceNumber,
        id: Date.now(),
        client: selectedClient,
        totalHT,
        totalTVA,
        totalTTC,
        totalProfit,
        payedAmount: totalTTC,
        remainingAmount: 0,
        status: "completementpayer",
        paymentMethod: "cash",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saleData = {
        id: Date.now(),
        date: new Date().toISOString(),
        total: totalTTC,
        payedAmount: totalTTC,
        remainingAmount: 0,
        totalProfit: totalProfit,
        products: form.items.map((item) => ({
          id: item.productId,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.ttc,
          purchasePrice:
            products.find((p) => p.id === item.productId)?.purchasePrice || 0,
          profitPerUnit:
            item.profitPerUnit ||
            item.unitPrice -
              (products.find((p) => p.id === item.productId)?.purchasePrice ||
                0),
          totalProfit:
            item.totalProfit ||
            (item.unitPrice -
              (products.find((p) => p.id === item.productId)?.purchasePrice ||
                0)) *
              item.quantity,
        })),
        client: selectedClient,
        status: "completementpayer",
        invoiceNumber: newInvoiceNumber,
      };

      // Enregistrer la vente
      await window.db.addSale(saleData);

      // Enregistrer la facture
      const savedInvoice = await window.db.addInvoice(invoiceData);
      setInvoices([...invoices, savedInvoice]);

      setSaleMessage(
        `Vente rapide enregistrée ! Total: ${totalTTC.toFixed(2)} DA`
      );

      const invoicePreviewData = {
        ...invoiceData,
        items: form.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          priceType: item.priceType,
          tva: item.tva || 19,
          ht: item.ht,
          ttc: item.ttc,
          profitPerUnit: item.profitPerUnit || 0,
          totalProfit: item.totalProfit || 0,
        })),
        totalHT,
        totalTVA,
        totalTTC,
        totalProfit,
      };

      setSelectedInvoiceForPreview(invoicePreviewData);

      const nextInvoiceNumber = getNextInvoiceNumber();
      setForm({
        invoiceNumber: nextInvoiceNumber,
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
        status: "completementpayer",
        payedAmount: 0,
        paymentMethod: "cash",
      });
      setSelectedClient(null);

      setTimeout(() => setSaleMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de la vente rapide:", error);
      setSaleMessage("Erreur lors de la vente rapide");
      setTimeout(() => setSaleMessage(""), 3000);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible. Note: La vente associée restera dans l'historique des ventes."
      )
    ) {
      try {
        await window.db.deleteInvoice(id);
        setInvoices(invoices.filter((inv) => (inv._id || inv.id) !== id));
        setSaleMessage("Facture supprimée (la vente reste dans l'historique)");
        setTimeout(() => setSaleMessage(""), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression de la facture:", error);
        setSaleMessage("Erreur lors de la suppression de la facture");
        setTimeout(() => setSaleMessage(""), 3000);
      }
    }
  };

  // Nouvelle fonction pour l'impression directe
  const handleDirectPrint = (invoice) => {
    // Préparer les données pour l'impression directe
    const invoiceData = {
      ...invoice,
      items: invoice.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        priceType: item.priceType || "retail",
        tva: item.tva || 19,
        ht: item.ht,
        ttc: item.ttc,
      })),
      dueDate: invoice.date || new Date().toISOString().split("T")[0],
      companyInfo: invoice.companyInfo || {
        name: "Votre Entreprise SARL",
        address: "123 Rue Principale, Ville, Pays",
        city: "Ville",
        phone: "+213 XX XX XX XX",
        email: "contact@entreprise.dz",
        rc: "RC 123456789",
        nif: "NIF 987654321",
        nis: "NIS 456789123",
      },
    };

    // Lancer l'impression directe
    setDirectPrintInvoice(invoiceData);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedInvoices = invoices
    .filter(
      (invoice) =>
        invoice?.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.client &&
          invoice.client.nom
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        invoice.totalTTC.toString().includes(searchTerm)
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "date" || sortField === "createdAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (
        sortField === "totalHT" ||
        sortField === "totalTVA" ||
        sortField === "totalTTC" ||
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
                  ? "bg-purple-600 text-white"
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
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Factures de Vente
                  </h1>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    Créez des factures qui mettent à jour le stock
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenNewInvoice}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <Add />
                <span className="hidden sm:inline">Nouvelle Facture</span>
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
              placeholder="Rechercher une facture par numéro, client ou montant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Message de confirmation */}
        {saleMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-emerald-800">
              <Receipt className="w-4 h-4" />
              {saleMessage}
            </div>
          </div>
        )}

        {/* Liste des factures en tableau */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Factures de vente ({filteredAndSortedInvoices.length})
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Page {currentPage} sur {totalPages})
              </span>
            </h2>
          </div>

          {invoices.length === 0 ? (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Aucune facture de vente
              </h3>
              <p className="text-purple-700 mb-4">
                Créez votre première facture de vente !
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
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("date")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CalendarToday className="w-4 h-4" />
                            Date
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
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("totalTVA")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">TVA</div>
                        </th>
                        <th
                          onClick={() => handleSort("totalTTC")}
                          className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-purple-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            Total TTC
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
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentInvoices.map((invoice) => (
                        <tr
                          key={invoice._id || invoice.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-700">
                              {new Date(invoice.date).toLocaleDateString(
                                "fr-FR"
                              )}
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
                              {invoice.totalHT.toFixed(2)} DA
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-blue-600">
                              {invoice.totalTVA.toFixed(2)} DA
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-purple-600">
                              {invoice.totalTTC.toFixed(2)} DA
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  invoice.status === "completementpayer"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : invoice.status === "partielementpayer"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {formatStatus(invoice.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditInvoice(invoice)}
                                className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteInvoice(invoice._id || invoice.id)
                                }
                                className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Delete className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDirectPrint(invoice)}
                                className="p-2 text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                                title="Imprimer directement"
                              >
                                <Print className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <Pagination />
            </>
          )}
        </div>
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
                    ? "Modifier Facture de Vente"
                    : "Nouvelle Facture de Vente"}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                          {selectedClient.n_is && ( // Changé de n_ic à n_is
                            <div className="flex items-center gap-2">
                              <Business className="w-4 h-4 text-gray-400" />
                              <span>NIS: {selectedClient.n_is}</span>{" "}
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
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                                  client.n_is) && ( // Changé de n_ic à n_is
                                  <div className="text-xs text-gray-500 mt-1">
                                    {client.n_rc && `RC: ${client.n_rc}`}
                                    {client.n_if && `, NIF: ${client.n_if}`}
                                    {client.n_is &&
                                      `, NIS: ${client.n_is}`}{" "}
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
                            className={`p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              product.currentQuantity === 0
                                ? "bg-rose-50 opacity-60"
                                : product.currentQuantity <=
                                    product.alertQuantity
                                  ? "bg-amber-50"
                                  : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  {product.currentQuantity === 0 && (
                                    <span className="px-1.5 py-0.5 text-xs bg-rose-100 text-rose-800 rounded-full">
                                      Rupture
                                    </span>
                                  )}
                                  {product.currentQuantity > 0 &&
                                    product.currentQuantity <=
                                      product.alertQuantity && (
                                      <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                                        Faible
                                      </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Storefront className="w-3 h-3" />
                                      <span className="font-medium">
                                        Détail:
                                      </span>{" "}
                                      {product.sellingPriceRetail.toFixed(2)} DA
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Store className="w-3 h-3" />
                                      <span className="font-medium">
                                        Gros:
                                      </span>{" "}
                                      {product.sellingPriceWholesale.toFixed(2)}{" "}
                                      DA
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span>
                                      <span className="font-medium">
                                        Achat:
                                      </span>{" "}
                                      {product.purchasePrice.toFixed(2)} DA
                                    </span>
                                    <span>
                                      <span className="font-medium">
                                        Marge:
                                      </span>{" "}
                                      <span className="text-green-600">
                                        {(
                                          product.sellingPriceRetail -
                                          product.purchasePrice
                                        ).toFixed(2)}{" "}
                                        DA
                                      </span>
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
                                      {product.currentQuantity}
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
                                disabled={product.currentQuantity === 0}
                                className={`ml-2 px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                                  product.currentQuantity === 0
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                                }`}
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
                                <div className="text-xs text-amber-600 mt-1">
                                  Stock: {product.currentQuantity}
                                </div>
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
                                  {item.unitPrice.toFixed(2)} DA
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
                                <div className="text-xs text-gray-500">
                                  Achat: {product.purchasePrice.toFixed(2)} DA
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      handleQuantityAdjust(index, -1)
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
                                      handleQuantityAdjust(index, 1)
                                    }
                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                  >
                                    <Add className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-900">{item.tva}%</div>
                                <div className="text-xs text-gray-500">
                                  Fixe
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {item.ht.toFixed(2)} DA
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-purple-600">
                                  {item.ttc.toFixed(2)} DA
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

              {/* Section Paiement */}
              {form.items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Payment />
                    Paiement
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mode de paiement */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mode de paiement
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "cash", label: "Espèces" },
                          { value: "check", label: "Chèque" },
                          { value: "card", label: "Carte" },
                          { value: "transfer", label: "Virement" },
                        ].map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() =>
                              handlePaymentMethodChange(method.value)
                            }
                            className={`px-3 py-2 text-sm rounded-lg border ${
                              form.paymentMethod === method.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Montant payé */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant payé (DA)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AttachMoney className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalTTC}
                          value={form.payedAmount}
                          onChange={(e) =>
                            handlePayedAmountChange(e.target.value)
                          }
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="text-xs text-gray-500">DA</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <button
                          onClick={handlePayFullAmount}
                          className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200"
                        >
                          Tout payer
                        </button>
                        {calculateRemaining() > 0 && (
                          <button
                            onClick={handlePayRemaining}
                            className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
                          >
                            Payer reste ({calculateRemaining().toFixed(2)} DA)
                          </button>
                        )}
                        <button
                          onClick={handlePayNothing}
                          className="px-2 py-1 text-xs bg-rose-100 text-rose-800 rounded hover:bg-rose-200"
                        >
                          Rien payer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Statut */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <div className="relative">
                      <select
                        value={form.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          let newPayedAmount = form.payedAmount;
                          if (newStatus === "completementpayer") {
                            newPayedAmount = totalTTC;
                          } else if (newStatus === "nonpayer") {
                            newPayedAmount = 0;
                          }

                          setForm({
                            ...form,
                            status: newStatus,
                            payedAmount: newPayedAmount,
                          });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                      >
                        <option value="completementpayer">
                          Complètement payé
                        </option>
                        <option value="partielementpayer">
                          Partiellement payé
                        </option>
                        <option value="nonpayer">Non payé</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            form.status === "completementpayer"
                              ? "bg-emerald-100 text-emerald-800"
                              : form.status === "partielementpayer"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {formatStatus(form.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Totaux */}
              {form.items.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total HT</div>
                      <div className="text-xl font-bold text-gray-900">
                        {totalHT.toFixed(2)} DA
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">TVA</div>
                      <div className="text-xl font-bold text-blue-600">
                        {totalTVA.toFixed(2)} DA
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total TTC</div>
                      <div className="text-xl font-bold text-purple-600">
                        {totalTTC.toFixed(2)} DA
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-600">Reste à payer</div>
                      <div className="text-xl font-bold text-amber-600">
                        {calculateRemaining().toFixed(2)} DA
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
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-gray-200">
                <div>
                  <button
                    type="button"
                    onClick={handleQuickSale}
                    disabled={form.items.length === 0 || !selectedClient}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check />
                    Vente rapide
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    Tout payer en espèces
                  </div>
                </div>

                <div className="flex gap-3">
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
                    disabled={form.items.length === 0 || !selectedClient}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save />
                    {editingInvoice ? "Mettre à jour" : "Enregistrer la vente"}
                  </button>
                </div>
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
              handleSelectClient(savedClient);
            } catch (error) {
              console.error("Erreur lors de l'ajout du client:", error);
              setSaleMessage("Erreur lors de l'ajout du client");
              setTimeout(() => setSaleMessage(""), 3000);
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
          invoiceType="FACTURE"
        />
      )}
    </div>
  );
};

export default SaleInvoicePage;
