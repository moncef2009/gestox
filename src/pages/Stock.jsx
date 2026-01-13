import { useState, useEffect } from "react";
import {
  Add,
  Delete,
  Inventory,
  Search,
  Category as CategoryIcon,
  ShoppingCart,
  ArrowUpward,
  ArrowDownward,
  FilterAlt,
  ClearAll,
  CalendarToday,
  Store,
  Edit,
  Warning,
  FirstPage,
  LastPage,
  ChevronLeft as NavigateBefore,
  ChevronRight as NavigateNext,
  CloudUpload,
  CheckCircle,
  Error,
  Description,
  Download,
  Close,
  Info,
} from "@mui/icons-material";
import ProductDialog from "../components/ProductDialog";
import * as XLSX from "xlsx";

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [customUnits, setCustomUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [actionMessage, setActionMessage] = useState("");

  // États pour les filtres
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // États pour l'import Excel
  const [importStatus, setImportStatus] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [importMode, setImportMode] = useState("merge"); // 'merge' ou 'replace'

  // Charger les données depuis NeDB
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, unitsData, categoriesData] = await Promise.all([
        window.db.getProducts(),
        window.db.getUnits(),
        window.db.getCategories(),
      ]);

      setProducts(productsData);
      setCustomUnits(unitsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setActionMessage("Erreur lors du chargement des données");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedCategory,
    stockStatus,
    expiryFilter,
    sortField,
    sortDirection,
  ]);

  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    setOpenProductDialog(true);
  };

  const handleOpenEditDialog = (product) => {
    setEditingProduct(product);
    setOpenProductDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenProductDialog(false);
    setEditingProduct(null);
  };

  const handleProductSaved = async (productData, action) => {
    try {
      if (action === "edit") {
        // Mise à jour dans NeDB
        await window.db.updateProduct(
          editingProduct._id || editingProduct.id,
          productData
        );

        // Mettre à jour l'état local
        setProducts(
          products.map((p) =>
            p._id === editingProduct._id || p.id === editingProduct.id
              ? { ...productData, _id: editingProduct._id || editingProduct.id }
              : p
          )
        );

        setActionMessage("Produit modifié avec succès");
      } else {
        // Ajout dans NeDB
        const savedProduct = await window.db.addProduct(productData);

        // Mettre à jour l'état local avec l'ID retourné par NeDB
        setProducts([...products, savedProduct]);
        setActionMessage("Produit ajouté avec succès");
      }

      setTimeout(() => setActionMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du produit:", error);
      setActionMessage("Erreur lors de la sauvegarde du produit");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const handleAddUnit = async (unitData) => {
    try {
      const savedUnit = await window.db.addUnit(unitData);
      setCustomUnits([...customUnits, savedUnit]);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'unité:", error);
      setActionMessage("Erreur lors de l'ajout de l'unité");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const handleAddCategory = async (categoryData) => {
    try {
      const savedCategory = await window.db.addCategory(categoryData);
      setCategories([...categories, savedCategory]);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la catégorie:", error);
      setActionMessage("Erreur lors de l'ajout de la catégorie");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  // Dans Stock.js, remplacez les fonctions handleDeleteUnit et handleDeleteCategory par :

  const handleDeleteUnit = async (unitId, unitName) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'unité "${unitName}" ?\n\nAttention : Cette action supprimera également cette unité de tous les produits qui l'utilisent.`
      )
    ) {
      try {
        // 1. Supprimer l'unité
        await window.db.deleteUnit(unitId);

        // 2. Mettre à jour l'état local
        setCustomUnits(customUnits.filter((unit) => unit._id !== unitId));

        // 3. Mettre à jour les produits qui utilisent cette unité
        const productsToUpdate = products.filter(
          (product) => product.unit === unitName
        );

        if (productsToUpdate.length > 0) {
          // Mettre à jour chaque produit dans la base de données
          const updatePromises = productsToUpdate.map((product) =>
            window.db.updateProduct(product._id || product.id, {
              ...product,
              unit: "", // Vide l'unité du produit
            })
          );

          await Promise.all(updatePromises);

          // Mettre à jour l'état local des produits
          const updatedProducts = products.map((product) => {
            if (product.unit === unitName) {
              return { ...product, unit: "" };
            }
            return product;
          });

          setProducts(updatedProducts);
        }

        setActionMessage(`Unité "${unitName}" supprimée avec succès`);
        setTimeout(() => setActionMessage(""), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression de l'unité:", error);
        setActionMessage("Erreur lors de la suppression de l'unité");
        setTimeout(() => setActionMessage(""), 3000);
      }
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?\n\nAttention : Cette action supprimera également cette catégorie de tous les produits qui l'utilisent.`
      )
    ) {
      try {
        // 1. Supprimer la catégorie
        await window.db.deleteCategory(categoryId);

        // 2. Mettre à jour l'état local
        setCategories(
          categories.filter((category) => category._id !== categoryId)
        );

        // 3. Mettre à jour les produits qui utilisent cette catégorie
        const productsToUpdate = products.filter(
          (product) => product.category === categoryName
        );

        if (productsToUpdate.length > 0) {
          // Mettre à jour chaque produit dans la base de données
          const updatePromises = productsToUpdate.map((product) =>
            window.db.updateProduct(product._id || product.id, {
              ...product,
              category: "", // Vide la catégorie du produit
            })
          );

          await Promise.all(updatePromises);

          // Mettre à jour l'état local des produits
          const updatedProducts = products.map((product) => {
            if (product.category === categoryName) {
              return { ...product, category: "" };
            }
            return product;
          });

          setProducts(updatedProducts);
        }

        setActionMessage(`Catégorie "${categoryName}" supprimée avec succès`);
        setTimeout(() => setActionMessage(""), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression de la catégorie:", error);
        setActionMessage("Erreur lors de la suppression de la catégorie");
        setTimeout(() => setActionMessage(""), 3000);
      }
    }
  };

  const handleDelete = async (product) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`
      )
    ) {
      try {
        // Supprimer de NeDB
        await window.db.deleteProduct(product._id || product.id);

        // Mettre à jour l'état local
        setProducts(
          products.filter(
            (p) => (p._id || p.id) !== (product._id || product.id)
          )
        );

        setActionMessage(`Produit "${product.name}" supprimé avec succès`);
        setTimeout(() => setActionMessage(""), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression du produit:", error);
        setActionMessage("Erreur lors de la suppression du produit");
        setTimeout(() => setActionMessage(""), 3000);
      }
    }
  };

  const handleManualQuantityUpdate = async (id, value) => {
    const quantity = parseFloat(value);
    if (!isNaN(quantity) && quantity >= 0) {
      const product = products.find((p) => p._id === id || p.id === id);
      if (!product) return;

      const updatedProduct = {
        ...product,
        currentQuantity: quantity,
        totalValue: quantity * product.purchasePrice,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        // Mettre à jour dans NeDB
        await window.db.updateProduct(
          product._id || product.id,
          updatedProduct
        );

        // Mettre à jour l'état local
        setProducts(
          products.map((p) =>
            p._id === id || p.id === id ? updatedProduct : p
          )
        );
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la quantité:", error);
        setActionMessage("Erreur lors de la mise à jour de la quantité");
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

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setStockStatus("all");
    setExpiryFilter("all");
    setSearchTerm("");
  };

  const isProductExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const isProductExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Extraire les catégories uniques des produits
  const productCategories = [
    "all",
    ...new Set(products.map((p) => p.category || "").filter((c) => c)),
    "",
  ];

  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.barcodes &&
          product.barcodes.some((barcode) => barcode.includes(searchTerm)));

      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "" && !product.category) ||
        product.category === selectedCategory;

      let matchesStock = true;
      if (stockStatus === "in_stock") {
        matchesStock = product.currentQuantity > product.alertQuantity;
      } else if (stockStatus === "low_stock") {
        matchesStock =
          product.currentQuantity > 0 &&
          product.currentQuantity <= product.alertQuantity;
      } else if (stockStatus === "out_of_stock") {
        matchesStock = product.currentQuantity === 0;
      }

      let matchesExpiry = true;
      if (expiryFilter === "expiring_soon") {
        matchesExpiry = isProductExpiringSoon(product.expiry);
      } else if (expiryFilter === "expired") {
        matchesExpiry = isProductExpired(product.expiry);
      } else if (expiryFilter === "has_expiry") {
        matchesExpiry = !!product.expiry;
      } else if (expiryFilter === "no_expiry") {
        matchesExpiry = !product.expiry;
      }

      return matchesSearch && matchesCategory && matchesStock && matchesExpiry;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (
        sortField === "purchasePrice" ||
        sortField === "sellingPriceRetail" ||
        sortField === "sellingPriceWholesale" ||
        sortField === "currentQuantity" ||
        sortField === "alertQuantity" ||
        sortField === "tva"
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

  // Calcul de la pagination
  const totalProducts = filteredAndSortedProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // Calcul des produits à afficher sur la page actuelle
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Gestionnaires de pagination
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const stats = {
    totalProducts: products.length,
    lowStock: products.filter(
      (p) => p.currentQuantity > 0 && p.currentQuantity <= p.alertQuantity
    ).length,
    totalValue: products.reduce(
      (sum, p) => sum + (p.currentQuantity || 0) * (p.purchasePrice || 0),
      0
    ),
    outOfStock: products.filter((p) => p.currentQuantity === 0).length,
    categories: [
      ...new Set(products.map((p) => p.category || "").filter((c) => c)),
    ].length,
  };

  // ================= EXPORT EXCEL =================
  const handleExportProductsExcel = () => {
    const data = products.map((p) => ({
      ID: p._id || p.id,
      Nom: p.name || "",
      Catégorie: p.category || "",
      Unité: p.unit || "",
      "Prix Achat (DA)": (p.purchasePrice || 0).toFixed(2),
      "Prix Détail (DA)": (p.sellingPriceRetail || 0).toFixed(2),
      "Prix Gros (DA)": (p.sellingPriceWholesale || 0).toFixed(2),
      Quantité: p.currentQuantity || 0,
      "Qtt Alerte": p.alertQuantity || 0,
      "Date Péremption": p.expiry
        ? new Date(p.expiry).toLocaleDateString("fr-FR")
        : "",
      TVA: p.tva || 0,
      Barcodes: p.barcodes?.join(", ") || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produits");
    XLSX.writeFile(
      workbook,
      `produits_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    setActionMessage("Export Excel terminé !");
    setTimeout(() => setActionMessage(""), 3000);
  };

  // ================= TÉLÉCHARGER LE MODÈLE EXCEL =================
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        ID: "Laissez vide pour création automatique",
        Nom: "Nom du produit (obligatoire)",
        Catégorie: "Catégorie (facultatif)",
        Unité: "Unité (facultatif)",
        "Prix Achat (DA)": "1000.00",
        "Prix Détail (DA)": "1200.00",
        "Prix Gros (DA)": "1100.00",
        Quantité: "50",
        "Qtt Alerte": "10",
        "Date Péremption": "31/12/2024",
        TVA: "19",
        Barcodes: "123456789, 987654321",
      },
      {
        ID: "",
        Nom: "Exemple: Lait 1L",
        Catégorie: "Laitier",
        Unité: "Litre",
        "Prix Achat (DA)": "800.00",
        "Prix Détail (DA)": "1000.00",
        "Prix Gros (DA)": "900.00",
        Quantité: "100",
        "Qtt Alerte": "20",
        "Date Péremption": "15/06/2024",
        TVA: "7",
        Barcodes: "111222333",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modèle");
    XLSX.writeFile(workbook, "modele_import_produits.xlsx");
  };

  // ================= IMPORT EXCEL AMÉLIORÉ =================
  const validateImportedRow = (row, index) => {
    const errors = [];

    // Validation du nom
    if (!row.Nom || row.Nom.trim() === "") {
      errors.push(`Ligne ${index + 1}: Le nom du produit est requis`);
    }

    // Validation des prix
    if (
      row["Prix Achat (DA)"] &&
      (isNaN(row["Prix Achat (DA)"]) || row["Prix Achat (DA)"] < 0)
    ) {
      errors.push(`Ligne ${index + 1}: Prix d'achat invalide`);
    }

    if (
      row["Prix Détail (DA)"] &&
      (isNaN(row["Prix Détail (DA)"]) || row["Prix Détail (DA)"] < 0)
    ) {
      errors.push(`Ligne ${index + 1}: Prix détail invalide`);
    }

    if (
      row["Prix Gros (DA)"] &&
      (isNaN(row["Prix Gros (DA)"]) || row["Prix Gros (DA)"] < 0)
    ) {
      errors.push(`Ligne ${index + 1}: Prix gros invalide`);
    }

    // Validation des quantités
    if (row.Quantité && (isNaN(row.Quantité) || row.Quantité < 0)) {
      errors.push(`Ligne ${index + 1}: Quantité invalide`);
    }

    if (
      row["Qtt Alerte"] &&
      (isNaN(row["Qtt Alerte"]) || row["Qtt Alerte"] < 0)
    ) {
      errors.push(`Ligne ${index + 1}: Quantité d'alerte invalide`);
    }

    // Validation de la TVA
    if (row.TVA && (isNaN(row.TVA) || row.TVA < 0 || row.TVA > 100)) {
      errors.push(
        `Ligne ${index + 1}: TVA invalide (doit être entre 0 et 100)`
      );
    }

    return errors;
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;

    let parsedDate = null;

    // Vérifier si c'est un numéro de série Excel
    if (typeof dateString === "number") {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const days = dateString;
      parsedDate = new Date(excelEpoch.getTime() + days * 86400000);
    } else {
      // Essayer de parser la date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        parsedDate = date;
      }
    }

    return parsedDate ? parsedDate.toISOString() : null;
  };

  const handleImportProductsExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportStatus("processing");
    setImportResult(null);
    setImportPreview([]);
    setShowImportPreview(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: "",
          dateNF: "dd/mm/yyyy",
        });

        if (importedData.length === 0) {
          setImportStatus("error");
          setImportResult({
            success: false,
            message: "Le fichier Excel est vide",
            errors: ["Aucune donnée trouvée dans le fichier"],
          });
          return;
        }

        // Valider les données
        let allErrors = [];
        const validatedProducts = importedData.map((row, index) => {
          const errors = validateImportedRow(row, index);
          allErrors = [...allErrors, ...errors];

          return {
            row,
            errors,
            product: {
              id: row.ID || `import-${Date.now()}-${index}`,
              name: row.Nom || "",
              category: row.Catégorie || "",
              unit: row.Unité || "",
              purchasePrice: parseFloat(row["Prix Achat (DA)"]) || 0,
              sellingPriceRetail: parseFloat(row["Prix Détail (DA)"]) || 0,
              sellingPriceWholesale: parseFloat(row["Prix Gros (DA)"]) || 0,
              currentQuantity: parseFloat(row.Quantité) || 0,
              alertQuantity: parseFloat(row["Qtt Alerte"]) || 0,
              expiry: parseDate(row["Date Péremption"]),
              tva: parseFloat(row.TVA) || 0,
              barcodes: row.Barcodes
                ? row.Barcodes.split(",")
                    .map((b) => b.trim())
                    .filter((b) => b)
                : [],
              image: "",
              totalValue:
                parseFloat(row.Quantité || 0) *
                parseFloat(row["Prix Achat (DA)"] || 0),
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        });

        // Préparer l'aperçu
        setImportPreview(validatedProducts);

        if (allErrors.length > 0) {
          setImportStatus("validation_errors");
          setImportResult({
            success: false,
            message: `${allErrors.length} erreur(s) de validation trouvée(s)`,
            errors: allErrors,
            totalProducts: validatedProducts.length,
          });
          setShowImportPreview(true);
        } else {
          setImportStatus("success_preview");
          setImportResult({
            success: true,
            message: `${validatedProducts.length} produit(s) prêt(s) à être importé(s)`,
            totalProducts: validatedProducts.length,
          });
          setShowImportPreview(true);
        }
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        setImportStatus("error");
        setImportResult({
          success: false,
          message: "Erreur lors de la lecture du fichier Excel",
          errors: [error.message],
        });
      }
    };

    reader.onerror = () => {
      setImportStatus("error");
      setImportResult({
        success: false,
        message: "Erreur lors de la lecture du fichier",
        errors: ["Impossible de lire le fichier"],
      });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;

    const validProducts = importPreview
      .filter((item) => item.errors.length === 0)
      .map((item) => item.product);

    let updatedProducts;

    if (importMode === "replace") {
      // Remplacer tous les produits existants
      updatedProducts = validProducts.map((p) => ({
        ...p,
        id: p.id.startsWith("import-") ? Date.now() + Math.random() : p.id,
      }));

      // Supprimer tous les produits existants et ajouter les nouveaux
      try {
        // Supprimer tous les produits existants
        const deletePromises = products.map((product) =>
          window.db.deleteProduct(product._id || product.id)
        );
        await Promise.all(deletePromises);

        // Ajouter les nouveaux produits
        const addPromises = updatedProducts.map((product) =>
          window.db.addProduct(product)
        );
        const savedProducts = await Promise.all(addPromises);

        setProducts(savedProducts);
      } catch (error) {
        console.error("Erreur lors du remplacement des produits:", error);
        setActionMessage("Erreur lors du remplacement des produits");
        setTimeout(() => setActionMessage(""), 3000);
        return;
      }
    } else {
      // Mode merge: ajouter les nouveaux et mettre à jour les existants
      const existingIds = products.map((p) => p._id || p.id);
      const existingNames = products.map((p) => p.name.toLowerCase());

      updatedProducts = [...products];

      try {
        for (const newProduct of validProducts) {
          // Vérifier si le produit existe déjà par ID ou nom
          const existingIndex = updatedProducts.findIndex(
            (p) =>
              (p._id || p.id) === newProduct.id ||
              p.name.toLowerCase() === newProduct.name.toLowerCase()
          );

          if (existingIndex >= 0) {
            // Mettre à jour le produit existant
            const existingProduct = updatedProducts[existingIndex];
            const updatedProduct = {
              ...existingProduct,
              ...newProduct,
            };

            await window.db.updateProduct(
              existingProduct._id || existingProduct.id,
              updatedProduct
            );
            updatedProducts[existingIndex] = updatedProduct;
          } else {
            // Ajouter un nouveau produit
            const savedProduct = await window.db.addProduct(newProduct);
            updatedProducts.push(savedProduct);
          }
        }

        setProducts(updatedProducts);
      } catch (error) {
        console.error("Erreur lors de la fusion des produits:", error);
        setActionMessage("Erreur lors de la fusion des produits");
        setTimeout(() => setActionMessage(""), 3000);
        return;
      }
    }

    setImportStatus("imported");
    setImportResult({
      success: true,
      message: `${validProducts.length} produit(s) importé(s) avec succès`,
      totalImported: validProducts.length,
      mode: importMode,
    });

    setActionMessage(
      `${validProducts.length} produit(s) importé(s) avec succès`
    );
    setTimeout(() => setActionMessage(""), 3000);

    setShowImportPreview(false);

    // Réinitialiser le champ de fichier
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleCancelImport = () => {
    setImportStatus(null);
    setImportResult(null);
    setImportPreview([]);
    setShowImportPreview(false);

    // Réinitialiser le champ de fichier
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Dialog pour afficher le guide d'import
  const ImportGuideDialog = () => {
    if (!showImportGuide) return null;

    const columns = [
      {
        header: "ID",
        description:
          "Identifiant unique (laisser vide pour création automatique)",
        required: false,
        example: "",
      },
      {
        header: "Nom",
        description: "Nom du produit",
        required: true,
        example: "Lait 1L",
      },
      {
        header: "Catégorie",
        description: "Catégorie du produit",
        required: false,
        example: "Laitier",
      },
      {
        header: "Unité",
        description: "Unité de mesure",
        required: false,
        example: "Litre",
      },
      {
        header: "Prix Achat (DA)",
        description: "Prix d'achat en Dinars Algériens",
        required: true,
        example: "800.00",
      },
      {
        header: "Prix Détail (DA)",
        description: "Prix de vente au détail",
        required: false,
        example: "1000.00",
      },
      {
        header: "Prix Gros (DA)",
        description: "Prix de vente en gros",
        required: false,
        example: "900.00",
      },
      {
        header: "Quantité",
        description: "Quantité en stock",
        required: true,
        example: "100",
      },
      {
        header: "Qtt Alerte",
        description: "Seuil d'alerte de stock",
        required: true,
        example: "20",
      },
      {
        header: "Date Péremption",
        description: "Date de péremption (format: JJ/MM/AAAA)",
        required: false,
        example: "15/06/2024",
      },
      {
        header: "TVA",
        description: "Taux de TVA en % (0-100)",
        required: false,
        example: "7",
      },
      {
        header: "Barcodes",
        description: "Codes-barres séparés par des virgules",
        required: false,
        example: "123456789,987654321",
      },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Description className="w-8 h-8 text-blue-600" />
                Guide d'importation Excel
              </h3>
              <p className="text-gray-600 mt-2">
                Structure du fichier Excel pour l'importation des produits
              </p>
            </div>
            <button
              onClick={() => setShowImportGuide(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Close className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">
                    Instructions importantes
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>
                      • Les colonnes marquées comme "obligatoire" doivent être
                      remplies
                    </li>
                    <li>
                      • Conservez les en-têtes de colonnes exactement comme
                      indiqué
                    </li>
                    <li>• Pour les dates, utilisez le format JJ/MM/AAAA</li>
                    <li>
                      • Téléchargez le modèle ci-dessous pour avoir la structure
                      exacte
                    </li>
                    <li>• Les champs facultatifs peuvent être laissés vides</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Structure des colonnes
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        En-tête Excel
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Obligatoire
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exemple
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {columns.map((col, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {col.header}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {col.description}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              col.required
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {col.required ? "Oui" : "Non"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {col.example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Exemple de fichier Excel
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 border">ID</th>
                        <th className="px-4 py-2 border">Nom</th>
                        <th className="px-4 py-2 border">Catégorie</th>
                        <th className="px-4 py-2 border">Unité</th>
                        <th className="px-4 py-2 border">Prix Achat</th>
                        <th className="px-4 py-2 border">Quantité</th>
                        <th className="px-4 py-2 border">Qtt Alerte</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border text-gray-500"></td>
                        <td className="px-4 py-2 border">Lait 1L</td>
                        <td className="px-4 py-2 border">Laitier</td>
                        <td className="px-4 py-2 border">Litre</td>
                        <td className="px-4 py-2 border">800.00</td>
                        <td className="px-4 py-2 border">100</td>
                        <td className="px-4 py-2 border">20</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border text-gray-500"></td>
                        <td className="px-4 py-2 border">Pain</td>
                        <td className="px-4 py-2 border">Boulangerie</td>
                        <td className="px-4 py-2 border">Pièce</td>
                        <td className="px-4 py-2 border">20.00</td>
                        <td className="px-4 py-2 border">500</td>
                        <td className="px-4 py-2 border">100</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>Format supporté: Excel (.xlsx, .xls) et CSV (.csv)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Télécharger le modèle
              </button>
              <button
                onClick={() => {
                  setShowImportGuide(false);
                  document.getElementById("import-file").click();
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2"
              >
                <CloudUpload className="w-5 h-5" />
                Importer un fichier
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Composant pour l'aperçu d'import
  const ImportPreview = () => {
    if (!showImportPreview || importPreview.length === 0) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Aperçu de l'importation
              </h3>
              <button
                onClick={handleCancelImport}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              {importResult?.message ||
                "Vérifiez les données avant l'importation"}
            </p>

            {importResult?.errors && importResult.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <Error className="w-5 h-5" />
                  Erreurs de validation
                </h4>
                <ul className="mt-2 text-sm text-red-700 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="py-1">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="merge"
                  name="importMode"
                  checked={importMode === "merge"}
                  onChange={() => setImportMode("merge")}
                  className="text-emerald-600"
                />
                <label htmlFor="merge" className="text-gray-700">
                  Fusionner avec les produits existants
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="replace"
                  name="importMode"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  className="text-emerald-600"
                />
                <label htmlFor="replace" className="text-gray-700">
                  Remplacer tous les produits
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[50vh]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix Achat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importPreview.map((item, index) => (
                  <tr
                    key={index}
                    className={
                      item.errors.length > 0 ? "bg-red-50" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </div>
                      {item.errors.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {item.errors[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.product.category || "Non classé"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.product.purchasePrice?.toFixed(2)} DA
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.product.currentQuantity}
                    </td>
                    <td className="px-6 py-4">
                      {item.errors.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Error className="w-3 h-3 mr-1" />
                          Erreur
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valide
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {importPreview.filter((p) => p.errors.length === 0).length} sur{" "}
              {importPreview.length} produit(s) valide(s)
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={
                  importPreview.filter((p) => p.errors.length === 0).length ===
                  0
                }
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer l'importation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vue mobile pour les produits
  const ProductCard = ({ product }) => {
    const today = new Date();
    const expiryDate = product.expiry ? new Date(product.expiry) : null;
    let expiryStatus = null;

    if (expiryDate) {
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        expiryStatus = "expired";
      } else if (diffDays <= 7) {
        expiryStatus = "expiring_soon";
      } else if (diffDays <= 30) {
        expiryStatus = "expiring_month";
      }
    }

    return (
      <div
        className={`p-4 rounded-xl border ${
          product.currentQuantity === 0
            ? "bg-red-50 border-red-200"
            : product.currentQuantity <= product.alertQuantity
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-gray-200"
        } shadow-sm`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200">
                  <ShoppingCart className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {product.name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {product.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <CategoryIcon className="w-3 h-3" />
                      {product.category}
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {product.unit || "Sans unité"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">Quantité</p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    value={product.currentQuantity}
                    onChange={(e) =>
                      handleManualQuantityUpdate(
                        product._id || product.id,
                        e.target.value
                      )
                    }
                    className="w-20 text-center border border-gray-300 rounded-lg py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                    min="0"
                  />
                  {product.currentQuantity <= product.alertQuantity &&
                    product.currentQuantity > 0 && (
                      <span className="text-xs font-medium text-amber-600">
                        ⚠ Faible
                      </span>
                    )}
                  {product.currentQuantity === 0 && (
                    <span className="text-xs font-medium text-rose-600">
                      🔄 Rupture
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Prix détail</p>
                <p className="font-semibold text-emerald-600">
                  {product.sellingPriceRetail?.toFixed(2) || "0.00"} DA
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Prix gros</p>
                <p className="font-semibold text-purple-600 flex items-center gap-1">
                  <Store className="w-4 h-4" />
                  {product.sellingPriceWholesale?.toFixed(2) || "0.00"} DA
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">TVA</p>
                <p className="font-semibold text-gray-800">
                  {product.tva || 0}%
                </p>
              </div>
            </div>

            {product.expiry && (
              <div className="mt-3">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <CalendarToday className="w-4 h-4" />
                  Péremption
                </p>
                <div
                  className={`font-medium mt-1 ${
                    expiryStatus === "expired"
                      ? "text-rose-600"
                      : expiryStatus === "expiring_soon"
                        ? "text-amber-600"
                        : expiryStatus === "expiring_month"
                          ? "text-blue-600"
                          : "text-gray-900"
                  }`}
                >
                  {new Date(product.expiry).toLocaleDateString("fr-FR")}
                  {expiryStatus === "expired" && (
                    <span className="ml-2 text-xs font-medium bg-rose-100 text-rose-800 px-2 py-1 rounded-full">
                      Expiré
                    </span>
                  )}
                  {expiryStatus === "expiring_soon" && (
                    <span className="ml-2 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Expire bientôt
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => handleOpenEditDialog(product)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(product)}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
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
          <span className="font-semibold">{indexOfFirstProduct + 1}</span> à{" "}
          <span className="font-semibold">
            {Math.min(indexOfLastProduct, totalProducts)}
          </span>{" "}
          sur <span className="font-semibold">{totalProducts}</span> produits
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
                  ? "bg-emerald-600 text-white"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow">
              <Inventory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des Stocks
              </h1>
              <p className="text-sm text-gray-600">
                Gérez votre inventaire en temps réel
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportProductsExcel}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:shadow flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportProductsExcel}
                className="hidden"
                id="import-file"
              />
              <button
                onClick={() => setShowImportGuide(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:shadow flex items-center gap-2"
              >
                <CloudUpload className="w-4 h-4" />
                <span className="hidden sm:inline">Import Excel</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddDialog}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:shadow flex items-center gap-2"
            >
              <Add className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau Produit</span>
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
            placeholder="Rechercher un produit par nom, catégorie ou code-barres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
          />
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

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CategoryIcon className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm appearance-none"
          >
            <option value="all">Toutes catégories</option>
            {productCategories
              .filter((cat) => cat !== "all" && cat !== "")
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            <option value="">Non classé</option>
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterAlt className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm appearance-none"
          >
            <option value="all">Tous statuts</option>
            <option value="in_stock">En stock</option>
            <option value="low_stock">Stock faible</option>
            <option value="out_of_stock">Rupture</option>
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarToday className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all text-sm appearance-none"
          >
            <option value="all">Toutes dates</option>
            <option value="expiring_soon">Expire bientôt</option>
            <option value="expired">Expiré</option>
            <option value="has_expiry">Avec date</option>
            <option value="no_expiry">Sans date</option>
          </select>
        </div>
      </div>

      {/* Bouton réinitialiser filtres */}
      {(selectedCategory !== "all" ||
        stockStatus !== "all" ||
        expiryFilter !== "all") && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm border border-gray-300 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <ClearAll className="w-4 h-4" />
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Produits</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProducts}
              </p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Inventory className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Faible</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.lowStock}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Warning className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rupture</p>
              <p className="text-2xl font-bold text-rose-600">
                {stats.outOfStock}
              </p>
            </div>
            <div className="p-2 bg-rose-100 rounded-lg">
              <Error className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur Totale</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalValue?.toFixed(2)} DA
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Catégories</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.categories}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CategoryIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Inventory className="w-5 h-5" />
            Produits ({filteredAndSortedProducts.length})
          </h2>
          <div className="text-sm text-gray-500 hidden lg:block">
            Cliquez sur les en-têtes pour trier
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Aucun produit en stock
            </h3>
            <p className="text-blue-700 mb-4">
              Commencez par ajouter votre premier produit !
            </p>
            <button
              onClick={handleOpenAddDialog}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-800 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Add />
              Ajouter un produit
            </button>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-amber-700 mb-4">
              Aucun produit ne correspond à vos critères.
            </p>
            {(selectedCategory !== "all" ||
              stockStatus !== "all" ||
              expiryFilter !== "all") && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 mx-auto"
              >
                <ClearAll />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vue mobile - Cards */}
            <div className="lg:hidden space-y-4 mb-4">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                />
              ))}
            </div>

            {/* Vue desktop - Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-emerald-700 to-teal-800">
                    <tr>
                      <th
                        onClick={() => handleSort("name")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Produit
                          {sortField === "name" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("category")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Catégorie
                          {sortField === "category" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("purchasePrice")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Prix Achat
                          {sortField === "purchasePrice" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("sellingPriceRetail")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Prix Détail
                          {sortField === "sellingPriceRetail" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("sellingPriceWholesale")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Prix Gros
                          {sortField === "sellingPriceWholesale" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("currentQuantity")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Quantité
                          {sortField === "currentQuantity" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("alertQuantity")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Qtt Alerte
                          {sortField === "alertQuantity" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("expiry")}
                        className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-emerald-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarToday className="w-4 h-4" />
                          Péremption
                          {sortField === "expiry" &&
                            (sortDirection === "asc" ? (
                              <ArrowUpward className="w-3 h-3" />
                            ) : (
                              <ArrowDownward className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        TVA %
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentProducts.map((product) => {
                      const today = new Date();
                      const expiryDate = product.expiry
                        ? new Date(product.expiry)
                        : null;
                      let expiryStatus = null;

                      if (expiryDate) {
                        const diffTime = expiryDate - today;
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24)
                        );

                        if (diffDays < 0) {
                          expiryStatus = "expired";
                        } else if (diffDays <= 7) {
                          expiryStatus = "expiring_soon";
                        } else if (diffDays <= 30) {
                          expiryStatus = "expiring_month";
                        }
                      }

                      return (
                        <tr
                          key={product._id || product.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            product.currentQuantity === 0
                              ? "bg-red-50"
                              : product.currentQuantity <= product.alertQuantity
                                ? "bg-amber-50"
                                : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200">
                                  <ShoppingCart className="w-5 h-5 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.unit || "Sans unité"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {product.category ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <CategoryIcon className="w-3 h-3" />
                                {product.category}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">
                                Non classé
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">
                              {product.purchasePrice?.toFixed(2) || "0.00"} DA
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-emerald-600">
                              {product.sellingPriceRetail?.toFixed(2) || "0.00"}{" "}
                              DA
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-purple-600">
                              <span className="font-medium">
                                {product.sellingPriceWholesale?.toFixed(2) ||
                                  "0.00"}{" "}
                                DA
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={product.currentQuantity}
                                  onChange={(e) =>
                                    handleManualQuantityUpdate(
                                      product._id || product.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-20 text-center border border-gray-300 rounded-lg py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                  min="0"
                                />
                              </div>
                              {product.currentQuantity <=
                                product.alertQuantity &&
                                product.currentQuantity > 0 && (
                                  <span className="text-xs text-amber-600">
                                    ⚠ Stock faible
                                  </span>
                                )}
                              {product.currentQuantity === 0 && (
                                <span className="text-xs text-rose-600">
                                  🔄 Rupture
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`font-medium ${
                                product.currentQuantity <= product.alertQuantity
                                  ? "text-amber-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {product.alertQuantity % 1 === 0
                                ? product.alertQuantity
                                : parseFloat(product.alertQuantity).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {product.expiry ? (
                              <div className="space-y-1">
                                <div
                                  className={`font-medium ${
                                    expiryStatus === "expired"
                                      ? "text-rose-600"
                                      : expiryStatus === "expiring_soon"
                                        ? "text-amber-600"
                                        : expiryStatus === "expiring_month"
                                          ? "text-blue-600"
                                          : "text-gray-900"
                                  }`}
                                >
                                  {new Date(product.expiry).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </div>
                                {expiryStatus === "expired" && (
                                  <span className="inline-block px-2 py-1 text-xs font-medium bg-rose-100 text-rose-800 rounded-full">
                                    Expiré
                                  </span>
                                )}
                                {expiryStatus === "expiring_soon" && (
                                  <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                    Expire bientôt
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Non définie
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-lg border border-gray-200">
                              <span className="font-medium">
                                {product.tva || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditDialog(product)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Delete className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {filteredAndSortedProducts.length > 0 && <Pagination />}
      </div>

      {/* Guide d'importation Excel */}
      <ImportGuideDialog />

      {/* Aperçu de l'importation */}
      <ImportPreview />

      {/* Utilisation du ProductDialog */}
      <ProductDialog
        open={openProductDialog}
        onClose={handleCloseDialog}
        onSubmit={handleProductSaved}
        editingProduct={editingProduct}
        customUnits={customUnits}
        categories={categories}
        onAddUnit={handleAddUnit}
        onAddCategory={handleAddCategory}
        onDeleteUnit={handleDeleteUnit} // ← Ajoutez cette ligne
        onDeleteCategory={handleDeleteCategory} // ← Ajoutez cette ligne
      />
    </div>
  );
};

export default Stock;