import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Add,
  Remove,
  Delete,
  Save,
  ClearAll,
  Receipt,
  Close,
  CheckCircle,
  Inventory,
  Search,
  AddCircle,
  ArrowUpward,
  ArrowDownward,
  Warning,
  Person,
  AttachMoney,
  Check,
  Payment,
  TrendingUp,
} from "@mui/icons-material";
import ClientDialog from "../components/ClientDialog";

const SalePage = () => {
  const [addedToSale, setAddedToSale] = useState([]);
  const [saleForm, setSaleForm] = useState({
    client: null,
    status: "completementpayer",
    payedAmount: 0,
  });
  const [scanInput, setScanInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [errors, setErrors] = useState({});
  const [saleMessage, setSaleMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 4;

  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    const savedClients = localStorage.getItem("clients");

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }

    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F12") {
        e.preventDefault();
        handleOpenConfirmDialog();
      }

      if (
        e.key === "Enter" &&
        !e.target.matches("input, textarea, select") &&
        !showConfirmDialog
      ) {
        e.preventDefault();
        handleQuickSale();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addedToSale, showConfirmDialog]);

  useEffect(() => {
    const total = calculateTotal();

    if (saleForm.status === "completementpayer") {
      setSaleForm((prev) => ({
        ...prev,
        payedAmount: total,
      }));
    } else if (saleForm.status === "nonpayer") {
      setSaleForm((prev) => ({
        ...prev,
        payedAmount: 0,
      }));
    } else if (saleForm.payedAmount > total) {
      setSaleForm((prev) => ({
        ...prev,
        payedAmount: total,
      }));
    }
  }, [saleForm.status, addedToSale]);

  const handleAutoScan = (value) => {
    if (!value) return;

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      const matches = products.filter((product) =>
        product.barcodes?.some((barcode) => barcode.toString() === value)
      );

      if (matches.length === 1) {
        addProductFromList(matches[0]);
        setScanInput("");
        setSearchResults([]);
        setSelectedResultIndex(-1);
      }
    }, 80); // délai scan
  };

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

  const addProductFromList = (productToAdd, quantity = 1) => {
    if (productToAdd.currentQuantity <= 0) {
      setSaleMessage("Produit en rupture de stock");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    const existingProductIndex = addedToSale.findIndex(
      (item) => item.id === productToAdd.id
    );

    if (existingProductIndex >= 0) {
      const updatedSale = [...addedToSale];
      const currentQuantity =
        parseFloat(updatedSale[existingProductIndex].quantity) || 1;
      const qtyToAdd = parseFloat(quantity) || 1;
      const newQuantity = currentQuantity + qtyToAdd;
      const roundedNewQuantity = Math.round(newQuantity * 100) / 100;

      if (roundedNewQuantity <= productToAdd.currentQuantity) {
        const profitPerUnit =
          productToAdd.sellingPriceRetail - productToAdd.purchasePrice;

        updatedSale[existingProductIndex] = {
          ...updatedSale[existingProductIndex],
          quantity: roundedNewQuantity,
          subtotal:
            Math.round(
              roundedNewQuantity * productToAdd.sellingPriceRetail * 100
            ) / 100,
          profitPerUnit: profitPerUnit,
          totalProfit:
            Math.round(roundedNewQuantity * profitPerUnit * 100) / 100,
        };
        setAddedToSale(updatedSale);
        setSaleMessage(`${productToAdd.name} quantité augmentée`);
      } else {
        setSaleMessage("Stock insuffisant pour ce produit");
      }
    } else {
      const qtyToAdd = parseFloat(quantity) || 1;
      const roundedQtyToAdd = Math.round(qtyToAdd * 100) / 100;

      if (roundedQtyToAdd > productToAdd.currentQuantity) {
        setSaleMessage("Stock insuffisant");
        setTimeout(() => setSaleMessage(""), 3000);
        return;
      }

      const profitPerUnit =
        productToAdd.sellingPriceRetail - productToAdd.purchasePrice;

      const productWithDetails = {
        ...productToAdd,
        quantity: roundedQtyToAdd,
        subtotal:
          Math.round(roundedQtyToAdd * productToAdd.sellingPriceRetail * 100) /
          100,
        purchasePrice: productToAdd.purchasePrice,
        profitPerUnit: profitPerUnit,
        totalProfit: Math.round(roundedQtyToAdd * profitPerUnit * 100) / 100,
      };
      setAddedToSale([...addedToSale, productWithDetails]);
      setSaleMessage(`${productToAdd.name} ajouté à la vente`);
    }

    setTimeout(() => setSaleMessage(""), 3000);
  };

  const handlefindeProduct = () => {
    if (!scanInput.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(scanInput.toLowerCase()) ||
        (product.barcodes &&
          product.barcodes.some((barcode) =>
            barcode.toString().includes(scanInput)
          ))
    );

    const limitedResults = filteredProducts.slice(0, 5);
    setSearchResults(limitedResults);

    if (
      limitedResults.length === 1 &&
      limitedResults[0].name.toLowerCase() === scanInput.toLowerCase()
    ) {
      addProductFromList(limitedResults[0]);
    }
  };

  const handleKeyDown = (e) => {
    if (searchResults.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedResultIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedResultIndex((prev) =>
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (
            selectedResultIndex >= 0 &&
            selectedResultIndex < searchResults.length
          ) {
            addProductFromList(searchResults[selectedResultIndex]);
          } else if (searchResults.length > 0) {
            addProductFromList(searchResults[0]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSearchResults([]);
          setSelectedResultIndex(-1);
          break;
        default:
          break;
      }
    } else if (e.key === "Enter" && !scanInput) {
      e.preventDefault();
      handlefindeProduct();
    }
  };

  const handleQuantityStepChange = (id, step) => {
    setAddedToSale((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const currentQty = parseFloat(item.quantity) || 1;
          const stepValue = parseFloat(step) || 1;
          let newQuantity = Math.max(0.01, currentQty + stepValue);
          newQuantity = Math.round(newQuantity * 100) / 100;

          const product = products.find((p) => p.id === id);

          if (product && newQuantity > product.currentQuantity) {
            setSaleMessage("Stock insuffisant");
            setTimeout(() => setSaleMessage(""), 3000);
            return item;
          }

          const profitPerUnit = item.sellingPriceRetail - item.purchasePrice;

          return {
            ...item,
            quantity: newQuantity,
            subtotal:
              Math.round(newQuantity * item.sellingPriceRetail * 100) / 100,
            totalProfit: Math.round(newQuantity * profitPerUnit * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  const handleQuantityDirectChange = (id, value) => {
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue <= 0) {
      setAddedToSale((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const profitPerUnit = item.sellingPriceRetail - item.purchasePrice;
            return {
              ...item,
              quantity: 1,
              subtotal: item.sellingPriceRetail,
              totalProfit: profitPerUnit,
            };
          }
          return item;
        })
      );
      return;
    }

    setAddedToSale((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const roundedValue = Math.round(numericValue * 100) / 100;
          const product = products.find((p) => p.id === id);

          if (product && roundedValue > product.currentQuantity) {
            setSaleMessage("Stock insuffisant");
            setTimeout(() => setSaleMessage(""), 3000);
            return {
              ...item,
              quantity: Math.min(item.quantity, product.currentQuantity),
            };
          }

          const profitPerUnit = item.sellingPriceRetail - item.purchasePrice;

          return {
            ...item,
            quantity: roundedValue,
            subtotal:
              Math.round(roundedValue * item.sellingPriceRetail * 100) / 100,
            totalProfit: Math.round(roundedValue * profitPerUnit * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveProduct = (id) => {
    setAddedToSale((prev) => prev.filter((item) => item.id !== id));
    setSaleMessage("Produit retiré");
    setTimeout(() => setSaleMessage(""), 3000);
  };

  const handleClearSale = () => {
    setAddedToSale([]);
    setSaleForm({
      client: null,
      status: "completementpayer",
      payedAmount: 0,
    });
    setSaleMessage("Vente annulée");
    setTimeout(() => setSaleMessage(""), 3000);
  };

  const calculateTotal = () => {
    return addedToSale.reduce((total, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      return Math.round((total + subtotal) * 100) / 100;
    }, 0);
  };

  const calculateTotalProfit = () => {
    return addedToSale.reduce((profit, item) => {
      const itemProfit = parseFloat(item.totalProfit) || 0;
      return Math.round((profit + itemProfit) * 100) / 100;
    }, 0);
  };

  const calculateTotalItems = () => {
    return addedToSale.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      return Math.round((sum + qty) * 100) / 100;
    }, 0);
  };

  const calculateRemaining = () => {
    const total = calculateTotal();
    const remaining = total - saleForm.payedAmount;
    return Math.max(0, Math.round(remaining * 100) / 100);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedProducts = products
    .filter(
      (product) =>
        !scanInput.trim() ||
        product.name.toLowerCase().includes(scanInput.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(scanInput.toLowerCase())) ||
        (product.barcodes &&
          product.barcodes.some((barcode) =>
            barcode.toString().includes(scanInput)
          ))
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (
        sortField === "purchasePrice" ||
        sortField === "sellingPriceRetail" ||
        sortField === "currentQuantity"
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

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / productsPerPage
  );

  const handleOpenConfirmDialog = () => {
    if (addedToSale.length === 0) {
      setSaleMessage("Ajoutez au moins un produit");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleCloseDialog = () => {
    setShowConfirmDialog(false);
    setErrors({});
    setShowClientSearch(false);
  };

  const handleCloseClientDialog = () => {
    setShowClientDialog(false);
  };

  const handleSelectClient = (client) => {
    setSaleForm({
      ...saleForm,
      client: client,
    });
    setShowClientSearch(false);
    setClientSearch("");
  };

  const handleClientSaved = (clientData, action) => {
    if (action === "add") {
      const updatedClients = [...clients, clientData];
      setClients(updatedClients);
      localStorage.setItem("clients", JSON.stringify(updatedClients));

      setSaleForm({
        ...saleForm,
        client: clientData,
      });

      setSaleMessage("Client ajouté et sélectionné");
      setTimeout(() => setSaleMessage(""), 3000);
    }

    setShowClientDialog(false);
  };

  const handleRemoveClient = () => {
    setSaleForm({
      ...saleForm,
      client: null,
    });
  };

  const handlePayedAmountChange = (value) => {
    const total = calculateTotal();
    let payedAmount = parseFloat(value) || 0;

    if (payedAmount > total) {
      payedAmount = total;
    }

    if (payedAmount < 0) {
      payedAmount = 0;
    }

    payedAmount = Math.round(payedAmount * 100) / 100;

    let newStatus = saleForm.status;
    if (payedAmount === total) {
      newStatus = "completementpayer";
    } else if (payedAmount === 0) {
      newStatus = "nonpayer";
    } else {
      newStatus = "partielementpayer";
    }

    setSaleForm({
      ...saleForm,
      payedAmount: payedAmount,
      status: newStatus,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSale = () => {
    if (!validateForm()) return;

    const total = calculateTotal();
    const totalProfit = calculateTotalProfit();
    const remaining = calculateRemaining();

    const sale = {
      id: Date.now(),
      date: new Date().toISOString(),
      total: total,
      payedAmount: saleForm.payedAmount,
      remainingAmount: remaining,
      totalProfit: totalProfit,
      products: addedToSale.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.sellingPriceRetail,
        subtotal: item.subtotal,
        purchasePrice: item.purchasePrice,
        profitPerUnit: item.profitPerUnit,
        totalProfit: item.totalProfit,
      })),
      client: saleForm.client,
      status: saleForm.status,
    };

    const existingSales = JSON.parse(localStorage.getItem("sales") || "[]");
    const updatedSales = [...existingSales, sale];
    localStorage.setItem("sales", JSON.stringify(updatedSales));

    const updatedProducts = products.map((product) => {
      const soldProduct = addedToSale.find((item) => item.id === product.id);
      if (soldProduct) {
        const newQuantity =
          Math.round((product.currentQuantity - soldProduct.quantity) * 100) /
          100;
        return {
          ...product,
          currentQuantity: Math.max(0, newQuantity),
        };
      }
      return product;
    });

    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setProducts(updatedProducts);

    setSaleMessage(
      `Vente enregistrée avec succès ! Total: ${total.toFixed(2)} DA`
    );

    setAddedToSale([]);
    setSaleForm({
      client: null,
      status: "completementpayer",
      payedAmount: 0,
    });

    handleCloseDialog();

    setTimeout(() => setSaleMessage(""), 3000);
  };

  const handleQuickSale = () => {
    if (addedToSale.length === 0) {
      setSaleMessage("Ajoutez au moins un produit");
      setTimeout(() => setSaleMessage(""), 3000);
      return;
    }

    const total = calculateTotal();
    const totalProfit = calculateTotalProfit();

    const sale = {
      id: Date.now(),
      date: new Date().toISOString(),
      total: total,
      payedAmount: total,
      remainingAmount: 0,
      totalProfit: totalProfit,
      products: addedToSale.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.sellingPriceRetail,
        subtotal: item.subtotal,
        purchasePrice: item.purchasePrice,
        profitPerUnit: item.profitPerUnit,
        totalProfit: item.totalProfit,
      })),
      client: saleForm.client,
      status: "completementpayer",
    };

    const existingSales = JSON.parse(localStorage.getItem("sales") || "[]");
    const updatedSales = [...existingSales, sale];
    localStorage.setItem("sales", JSON.stringify(updatedSales));

    const updatedProducts = products.map((product) => {
      const soldProduct = addedToSale.find((item) => item.id === product.id);
      if (soldProduct) {
        const newQuantity =
          Math.round((product.currentQuantity - soldProduct.quantity) * 100) /
          100;
        return {
          ...product,
          currentQuantity: Math.max(0, newQuantity),
        };
      }
      return product;
    });

    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setProducts(updatedProducts);

    setSaleMessage(`Vente rapide enregistrée ! Total: ${total.toFixed(2)} DA`);

    setAddedToSale([]);
    setSaleForm({
      client: null,
      status: "completementpayer",
      payedAmount: 0,
    });

    setTimeout(() => setSaleMessage(""), 3000);
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

  const handlePayFullAmount = () => {
    const total = calculateTotal();
    setSaleForm({
      ...saleForm,
      payedAmount: total,
      status: "completementpayer",
    });
  };

  const handlePayRemaining = () => {
    const total = calculateTotal();
    setSaleForm({
      ...saleForm,
      payedAmount: total,
      status: "completementpayer",
    });
  };

  const handlePayNothing = () => {
    setSaleForm({
      ...saleForm,
      payedAmount: 0,
      status: "nonpayer",
    });
  };

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Caisse</h1>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-emerald-600">
              {calculateTotal().toFixed(2)} DA
            </div>
            <div className="text-xs text-gray-600">Total vente</div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Gestion des ventes rapides</p>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={scanInput}
            onChange={(e) => {
              const value = e.target.value;
              setScanInput(value);
              setSelectedResultIndex(-1);

              // 🔥 SCAN AUTOMATIQUE (sans Enter)
              handleAutoScan(value);

              if (value.trim()) {
                const filtered = products
                  .filter(
                    (product) =>
                      product.name
                        .toLowerCase()
                        .includes(value.toLowerCase()) ||
                      (product.category &&
                        product.category
                          .toLowerCase()
                          .includes(value.toLowerCase())) ||
                      (product.barcodes &&
                        product.barcodes.some((barcode) =>
                          barcode.toString().includes(value)
                        ))
                  )
                  .slice(0, 5);
                setSearchResults(filtered);
              } else {
                setSearchResults([]);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher produit..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            autoFocus
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section gauche - Liste des produits */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Inventory className="w-5 h-5" />
              Produits ({filteredAndSortedProducts.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleSort("name")}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
              >
                Nom{" "}
                {sortField === "name" &&
                  (sortDirection === "asc" ? (
                    <ArrowUpward className="w-3 h-3" />
                  ) : (
                    <ArrowDownward className="w-3 h-3" />
                  ))}
              </button>
              <button
                onClick={() => handleSort("sellingPriceRetail")}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
              >
                Prix{" "}
                {sortField === "sellingPriceRetail" &&
                  (sortDirection === "asc" ? (
                    <ArrowUpward className="w-3 h-3" />
                  ) : (
                    <ArrowDownward className="w-3 h-3" />
                  ))}
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-8 text-sm">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-gray-600">Aucun produit en stock</p>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-8 text-sm">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-600">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-3 hover:bg-gray-50 transition-all ${
                    product.currentQuantity === 0
                      ? "border-rose-200 bg-rose-50 opacity-60"
                      : product.currentQuantity <= product.alertQuantity
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {product.name}
                        </h3>
                        {product.currentQuantity === 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-rose-100 text-rose-800 rounded-full">
                            Rupture
                          </span>
                        )}
                        {product.currentQuantity > 0 &&
                          product.currentQuantity <= product.alertQuantity && (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                              Faible
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                        {product.category && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                            {product.category}
                          </span>
                        )}
                        <span>Stock: {product.currentQuantity.toFixed(2)}</span>
                        <span className="font-medium text-emerald-600">
                          {product.sellingPriceRetail.toFixed(2)} DA
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addProductFromList(product)}
                      disabled={product.currentQuantity === 0}
                      className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${
                        product.currentQuantity === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow"
                      }`}
                    >
                      <AddCircle className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {/* Section droite - Panier */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-4 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Panier ({addedToSale.length})
            </h2>
          </div>

          <div className="p-4 max-h-[400px] overflow-y-auto">
            {addedToSale.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-sm text-gray-600">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addedToSale.map((item) => {
                  const product = products.find((p) => p.id === item.id);
                  const stock = product ? product.currentQuantity : 0;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            <span>
                              {item.quantity.toFixed(2)} ×{" "}
                              {item.sellingPriceRetail.toFixed(2)} DA
                            </span>
                            {stock > 0 && item.quantity > stock && (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-full flex items-center gap-1">
                                <Warning className="w-3 h-3" />
                                Stock: {stock.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveProduct(item.id)}
                          className="text-rose-600 hover:text-rose-700 ml-2"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() =>
                                handleQuantityStepChange(item.id, 1)
                              }
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Diminuer de 0.25"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={stock}
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityDirectChange(
                                  item.id,
                                  e.target.value
                                )
                              }
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (isNaN(value) || value < 0.01) {
                                  handleQuantityDirectChange(item.id, "1");
                                }
                              }}
                              className="w-20 px-2 py-1 text-sm border-x border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                              placeholder="0.00"
                            />

                            <button
                              onClick={() =>
                                handleQuantityStepChange(item.id, 1)
                              }
                              disabled={item.quantity >= stock - 1}
                              className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Augmenter de 0.5"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            Max: {stock.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-emerald-600">
                            {item.subtotal.toFixed(2)} DA
                          </div>
                          <div className="text-xs text-green-600 text-right">
                            +{item.totalProfit.toFixed(2)} DA
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total vente:</span>
                <span className="font-bold text-gray-900">
                  {calculateTotal().toFixed(2)} DA
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Articles:</span>
                <span className="text-sm text-gray-600">
                  {calculateTotalItems().toFixed(2)} unités
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClearSale}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <ClearAll className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={handleQuickSale}
                disabled={addedToSale.length === 0}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg text-sm font-medium hover:shadow disabled:opacity-50 flex items-center gap-1"
                title="Vente rapide (Enter)"
              >
                <Check className="w-4 h-4" />
                Vente rapide
              </button>
              <button
                onClick={handleOpenConfirmDialog}
                disabled={addedToSale.length === 0}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg text-sm font-medium hover:shadow disabled:opacity-50 flex items-center gap-1"
                title="Ouvrir dialogue de validation (F12)"
              >
                <Payment className="w-4 h-4" />
                Valider
              </button>
            </div>

            {/* Indications des raccourcis clavier */}
            <div className="text-xs text-gray-500 mt-2 flex justify-end gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                  Enter
                </kbd>
                <span>Vente rapide</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                  F12
                </kbd>
                <span>Dialogue de validation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmation */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="text-emerald-600 w-5 h-5" />
                  Finaliser vente
                </h2>
                <button
                  onClick={handleCloseDialog}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Close className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Récapitulatif
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Articles:</span>
                    <span>{calculateTotalItems().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-emerald-600">
                      {calculateTotal().toFixed(2)} DA
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Payé:</span>
                    <span className="font-bold text-emerald-600">
                      {saleForm.payedAmount.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reste:</span>
                    <span className="font-bold text-amber-600">
                      {calculateRemaining().toFixed(2)} DA
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Montant payé */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
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
                      max={calculateTotal()}
                      value={saleForm.payedAmount}
                      onChange={(e) => handlePayedAmountChange(e.target.value)}
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

                {/* Sélection de client */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Client (optionnel)
                  </label>

                  {!saleForm.client ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowClientSearch(true)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <Person className="w-4 h-4 text-gray-400" />
                        <span>Sélectionner un client</span>
                      </button>

                      <button
                        onClick={() => setShowClientDialog(true)}
                        className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <span className="text-blue-600">
                          Ajouter un nouveau client
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Person className="w-4 h-4 text-gray-600" />
                          <div className="font-medium text-gray-900">
                            {saleForm.client.nom}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {saleForm.client.telephone && (
                            <div>Téléphone: {saleForm.client.telephone}</div>
                          )}
                          {saleForm.client.address && (
                            <div>Adresse: {saleForm.client.address}</div>
                          )}
                          {saleForm.client.n_rc && (
                            <div>RC: {saleForm.client.n_rc}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveClient}
                        className="ml-2 text-rose-600 hover:text-rose-700"
                        title="Supprimer le client"
                      >
                        <Close className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Recherche de client */}
                  {showClientSearch && (
                    <div className="mt-2 space-y-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Rechercher un client..."
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredClients.length === 0 ? (
                          <div className="p-2 text-center text-sm text-gray-500">
                            Aucun client trouvé
                          </div>
                        ) : (
                          filteredClients.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => handleSelectClient(client)}
                              className="w-full text-left p-2 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {client.nom}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {client.telephone}{" "}
                                  {client.address && `• ${client.address}`}
                                </div>
                              </div>
                              <Person className="w-4 h-4 text-gray-400" />
                            </button>
                          ))
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setShowClientSearch(false);
                          setShowClientDialog(true);
                        }}
                        className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <span className="text-blue-600">
                          Ajouter un nouveau client
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <div className="relative">
                    <select
                      value={saleForm.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const total = calculateTotal();

                        let newPayedAmount = saleForm.payedAmount;
                        if (newStatus === "completementpayer") {
                          newPayedAmount = total;
                        } else if (newStatus === "nonpayer") {
                          newPayedAmount = 0;
                        }

                        setSaleForm({
                          ...saleForm,
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
                          saleForm.status === "completementpayer"
                            ? "bg-emerald-100 text-emerald-800"
                            : saleForm.status === "partielementpayer"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {formatStatus(saleForm.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseDialog}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSale}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-sm font-medium rounded-lg hover:shadow flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Utilisation du ClientDialog réutilisable */}
      <ClientDialog
        open={showClientDialog}
        onClose={handleCloseClientDialog}
        onClientSaved={handleClientSaved}
        editingClient={null}
      />
    </div>
  );
};

export default SalePage;
