import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Add,
  Delete,
  Edit,
  Save,
  Search,
  LocalShipping,
  Close,
  CheckCircle,
  Warning,
  Error,
  AttachMoney,
  Business,
  Inventory,
} from "@mui/icons-material";

const BonAchatDialog = ({
  open,
  onClose,
  onBonAchatSaved,
  editingBonAchat,
}) => {
  const [form, setForm] = useState({
    numero: "",
    date: new Date().toISOString().split("T")[0],
    fournisseurId: "",
    fournisseurNom: "",
    notes: "",
    produits: [],
    status: "non-payer",
    total: 0,
    payedAmount: 0,
  });

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedProduits, setSelectedProduits] = useState([]);
  const [searchProduit, setSearchProduit] = useState("");
  const [showProduitsList, setShowProduitsList] = useState(false);

  // Générer le prochain numéro (BA-001-2026)
  const generateNextNumero = () => {
    const savedBonsAchat = localStorage.getItem("bonsAchat");
    if (!savedBonsAchat) return `BA-001-${new Date().getFullYear()}`;

    const bonsAchat = JSON.parse(savedBonsAchat);
    const currentYear = new Date().getFullYear();

    const currentYearBons = bonsAchat.filter((ba) => {
      const baYear = ba.numero.split("-")[2];
      return baYear === currentYear.toString();
    });

    if (currentYearBons.length === 0) return `BA-001-${currentYear}`;

    const maxNumero = Math.max(
      ...currentYearBons.map((ba) => {
        const match = ba.numero.match(/BA-(\d+)-/);
        return match ? parseInt(match[1]) : 0;
      })
    );

    const nextNum = (maxNumero + 1).toString().padStart(3, "0");
    return `BA-${nextNum}-${currentYear}`;
  };

  useEffect(() => {
    const savedFournisseurs = localStorage.getItem("fournisseurs");
    const savedProduits = localStorage.getItem("products");

    if (savedFournisseurs) {
      setFournisseurs(JSON.parse(savedFournisseurs));
    }

    if (savedProduits) {
      setProduits(JSON.parse(savedProduits));
    }
  }, []);

  useEffect(() => {
    if (editingBonAchat) {
      setIsEditing(true);
      setForm({
        ...editingBonAchat,
        date: editingBonAchat.date.split("T")[0],
        payedAmount: editingBonAchat.payedAmount || 0,
      });
      setSelectedProduits(editingBonAchat.produits || []);
    } else {
      setIsEditing(false);
      resetForm();
    }
  }, [editingBonAchat, open]);

  const resetForm = () => {
    setForm({
      numero: generateNextNumero(),
      date: new Date().toISOString().split("T")[0],
      fournisseurId: "",
      fournisseurNom: "",
      notes: "",
      produits: [],
      status: "non-payer",
      total: 0,
      payedAmount: 0,
    });
    setSelectedProduits([]);
    setErrors({});
    setSearchProduit("");
  };

  // Mettre à jour les totaux et le statut
  useEffect(() => {
    const totalHT = selectedProduits.reduce(
      (sum, p) =>
        sum + parseFloat(p.quantiteAchetee || 0) * parseFloat(p.prixAchat || 0),
      0
    );

    const totalTTC = selectedProduits.reduce((sum, p) => {
      const sousTotal =
        parseFloat(p.quantiteAchetee || 0) * parseFloat(p.prixAchat || 0);
      const tva = sousTotal * (parseFloat(p.tva || 0) / 100);
      return sum + sousTotal + tva;
    }, 0);

    const currentPayedAmount = form.payedAmount || 0;
    let status = "non-payer";

    if (currentPayedAmount >= totalTTC) {
      status = "completement-payer";
    } else if (currentPayedAmount > 0) {
      status = "partielement-payer";
    }

    setForm((prev) => ({
      ...prev,
      total: totalTTC,
      status,
    }));
  }, [selectedProduits, form.payedAmount]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.fournisseurId) {
      newErrors.fournisseurId = "Veuillez sélectionner un fournisseur";
    }

    if (selectedProduits.length === 0) {
      newErrors.produits = "Veuillez ajouter au moins un produit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "fournisseurId") {
      const fournisseur = fournisseurs.find((f) => f.id === value);
      setForm({
        ...form,
        fournisseurId: value,
        fournisseurNom: fournisseur ? fournisseur.nom : "",
      });
    } else if (name === "payedAmount") {
      const total = form.total;
      let payedAmount = parseFloat(value) || 0;

      if (payedAmount > total) payedAmount = total;
      if (payedAmount < 0) payedAmount = 0;

      let status = form.status;
      if (payedAmount >= total) {
        status = "completement-payer";
      } else if (payedAmount > 0) {
        status = "partielement-payer";
      } else {
        status = "non-payer";
      }

      setForm((prev) => ({
        ...prev,
        payedAmount,
        status,
      }));
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleAddProduit = (produit) => {
    const existingIndex = selectedProduits.findIndex(
      (p) => p.id === produit.id
    );

    if (existingIndex !== -1) {
      const updatedProduits = [...selectedProduits];
      const currentQty =
        parseFloat(updatedProduits[existingIndex].quantiteAchetee) || 0;
      updatedProduits[existingIndex] = {
        ...updatedProduits[existingIndex],
        quantiteAchetee: (currentQty + 1).toString(),
      };
      setSelectedProduits(updatedProduits);
    } else {
      const produitAchete = {
        id: produit.id,
        nom: produit.name,
        quantiteAchetee: "1",
        prixAchat: produit.purchasePrice,
        unite: produit.unit || "unité",
        tva: produit.tva || 19,
        isNew: false,
      };
      setSelectedProduits([...selectedProduits, produitAchete]);
    }

    setSearchProduit("");
    setShowProduitsList(false);
  };

  const handleAddNewProduit = () => {
    const nouveauProduit = {
      id: uuidv4(),
      nom: searchProduit,
      quantiteAchetee: "1",
      prixAchat: "0",
      unite: "unité",
      tva: "19",
      isNew: true,
    };
    setSelectedProduits([...selectedProduits, nouveauProduit]);
    setSearchProduit("");
    setShowProduitsList(false);
  };

  const handleUpdateProduit = (index, field, value) => {
    const updatedProduits = [...selectedProduits];
    updatedProduits[index] = {
      ...updatedProduits[index],
      [field]: value,
    };
    setSelectedProduits(updatedProduits);
  };

  const handleRemoveProduit = (index) => {
    const updatedProduits = selectedProduits.filter((_, i) => i !== index);
    setSelectedProduits(updatedProduits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const now = new Date().toISOString();

    const bonAchatData = {
      id: editingBonAchat ? editingBonAchat.id : uuidv4(),
      ...form,
      date: new Date(form.date).toISOString(),
      produits: selectedProduits.map((p) => ({
        ...p,
        quantiteAchetee: parseFloat(p.quantiteAchetee),
        prixAchat: parseFloat(p.prixAchat),
        tva: parseFloat(p.tva),
      })),
      total: form.total,
      payedAmount: form.payedAmount,
      status: form.status,
      createdAt: editingBonAchat ? editingBonAchat.createdAt : now,
      updatedAt: now,
    };

    onBonAchatSaved(bonAchatData, isEditing ? "edit" : "add");
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredProduits = produits.filter(
    (produit) =>
      produit.name.toLowerCase().includes(searchProduit.toLowerCase()) ||
      (produit.category &&
        produit.category.toLowerCase().includes(searchProduit.toLowerCase()))
  );

  const calculateSousTotal = (produit) => {
    const qty = parseFloat(produit.quantiteAchetee) || 0;
    const prix = parseFloat(produit.prixAchat) || 0;
    const tva = parseFloat(produit.tva) || 0;
    const sousTotalHT = qty * prix;
    const tvaMontant = sousTotalHT * (tva / 100);
    return (sousTotalHT + tvaMontant).toFixed(2);
  };

  const calculateTotalHT = () => {
    return selectedProduits
      .reduce(
        (sum, p) =>
          sum +
          parseFloat(p.quantiteAchetee || 0) * parseFloat(p.prixAchat || 0),
        0
      )
      .toFixed(2);
  };

  const calculateTotalTVA = () => {
    return selectedProduits
      .reduce((sum, p) => {
        const sousTotalHT =
          parseFloat(p.quantiteAchetee || 0) * parseFloat(p.prixAchat || 0);
        return sum + sousTotalHT * (parseFloat(p.tva || 0) / 100);
      }, 0)
      .toFixed(2);
  };

  const calculateRemaining = () => {
    return Math.max(0, form.total - form.payedAmount).toFixed(2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completement-payer":
        return "bg-green-100 text-green-800";
      case "partielement-payer":
        return "bg-yellow-100 text-yellow-800";
      case "non-payer":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completement-payer":
        return <CheckCircle className="w-5 h-5" />;
      case "partielement-payer":
        return <Warning className="w-5 h-5" />;
      case "non-payer":
        return <Error className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LocalShipping />
              {isEditing ? "Modifier Bon d'Achat" : "Nouveau Bon d'Achat"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <Close />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro *
              </label>
              <input
                type="text"
                name="numero"
                value={form.numero}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fournisseur *
              </label>
              <select
                name="fournisseurId"
                value={form.fournisseurId}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.fournisseurId ? "border-rose-500" : "border-gray-300"
                }`}
              >
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map((fournisseur) => (
                  <option key={fournisseur.id} value={fournisseur.id}>
                    {fournisseur.nom}
                  </option>
                ))}
              </select>
              {errors.fournisseurId && (
                <p className="text-sm text-rose-600 mt-1">
                  {errors.fournisseurId}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Notes additionnelles..."
            />
          </div>

          {/* Section produits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Produits achetés *
              </label>
              {errors.produits && (
                <p className="text-sm text-rose-600">{errors.produits}</p>
              )}
            </div>

            {/* Barre de recherche produit */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchProduit}
                    onChange={(e) => {
                      setSearchProduit(e.target.value);
                      setShowProduitsList(true);
                    }}
                    onFocus={() => setShowProduitsList(true)}
                    placeholder="Rechercher un produit existant..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddNewProduit}
                  disabled={!searchProduit.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 flex items-center gap-2"
                >
                  <Add />
                  Nouveau produit
                </button>
              </div>

              {showProduitsList &&
                searchProduit &&
                filteredProduits.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProduits.slice(0, 5).map((produit) => (
                      <div
                        key={produit.id}
                        onClick={() => handleAddProduit(produit)}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {produit.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Stock: {produit.currentQuantity}{" "}
                          {produit.unit || "unité"} • Prix d'achat:{" "}
                          {produit.purchasePrice} DA
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Liste des produits sélectionnés */}
            <div className="space-y-3">
              {selectedProduits.map((produit, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {produit.nom}
                        </span>
                        {produit.isNew ? (
                          <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                            Nouveau
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Existant
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduit(index)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={produit.quantiteAchetee}
                        onChange={(e) =>
                          handleUpdateProduit(
                            index,
                            "quantiteAchetee",
                            e.target.value
                          )
                        }
                        min="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix d'achat (DA)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={produit.prixAchat}
                        onChange={(e) =>
                          handleUpdateProduit(
                            index,
                            "prixAchat",
                            e.target.value
                          )
                        }
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TVA (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={produit.tva}
                        onChange={(e) =>
                          handleUpdateProduit(index, "tva", e.target.value)
                        }
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sous-total TTC
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg">
                        <span className="font-medium text-gray-900">
                          {calculateSousTotal(produit)} DA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section paiement et totaux */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AttachMoney />
                  Paiement
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(form.status)}`}
                >
                  {getStatusIcon(form.status)}
                  {form.status === "completement-payer" && "Complètement payé"}
                  {form.status === "partielement-payer" && "Partiellement payé"}
                  {form.status === "non-payer" && "Non payé"}
                </span>
              </div>

              {/* Montant payé */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
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
                    max={form.total}
                    name="payedAmount"
                    value={form.payedAmount}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-xs text-gray-500">DA</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: "payedAmount", value: form.total },
                      })
                    }
                    className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200"
                  >
                    Tout payer
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: "payedAmount", value: 0 },
                      })
                    }
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Rien payer
                  </button>
                </div>
              </div>

              {/* Totaux */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total HT</div>
                  <div className="text-xl font-bold text-gray-900">
                    {calculateTotalHT()} DA
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total TVA</div>
                  <div className="text-xl font-bold text-gray-900">
                    {calculateTotalTVA()} DA
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600">Total TTC</div>
                  <div className="text-xl font-bold text-blue-900">
                    {form.total.toFixed(2)} DA
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg ${form.status === "completement-payer" ? "bg-green-50" : form.status === "partielement-payer" ? "bg-yellow-50" : "bg-red-50"}`}
                >
                  <div className="text-sm text-gray-600">
                    {form.status === "completement-payer"
                      ? "Payé"
                      : form.status === "partielement-payer"
                        ? "Payé"
                        : "Reste à payer"}
                  </div>
                  <div
                    className={`text-xl font-bold ${form.status === "completement-payer" ? "text-green-900" : form.status === "partielement-payer" ? "text-yellow-900" : "text-red-900"}`}
                  >
                    {form.payedAmount.toFixed(2)} DA
                    {form.status === "partielement-payer" && (
                      <div className="text-sm font-normal">
                        Reste: {calculateRemaining()} DA
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center justify-center gap-2"
            >
              <Close />
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Save />
              {isEditing ? "Mettre à jour" : "Enregistrer le bon d'achat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BonAchatDialog;
