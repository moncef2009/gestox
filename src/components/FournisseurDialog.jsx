import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Add,
  Edit,
  Person,
  Business,
  Phone,
  LocationOn,
  Save,
  Close,
} from "@mui/icons-material";

const FournisseurDialog = ({
  open,
  onClose,
  onFournisseurSaved,
  editingFournisseur,
}) => {
  // État local pour le formulaire - exactement les mêmes champs que ClientDialog
  const [form, setForm] = useState({
    nom: "",
    address: "",
    telephone: "",
    n_rc: "",
    n_if: "",
    n_is: "",
  });

  // État local pour les erreurs
  const [errors, setErrors] = useState({});

  // État pour suivre si on est en mode édition
  const [isEditing, setIsEditing] = useState(false);

  // Initialiser le formulaire quand l'editingFournisseur change
  useEffect(() => {
    if (editingFournisseur) {
      // Mode édition
      setIsEditing(true);
      setForm({
        nom: editingFournisseur.nom || "",
        address: editingFournisseur.address || "",
        telephone: editingFournisseur.telephone || "",
        n_rc: editingFournisseur.n_rc || "",
        n_if: editingFournisseur.n_if || "",
        n_is: editingFournisseur.n_is || "",
      });
    } else {
      // Mode création
      setIsEditing(false);
      resetForm();
    }
  }, [editingFournisseur, open]);

  const resetForm = () => {
    setForm({
      nom: "",
      address: "",
      telephone: "",
      n_rc: "",
      n_if: "",
      n_is: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.nom.trim()) newErrors.nom = "Le nom du fournisseur est requis";
    if (!form.address.trim()) newErrors.address = "L'adresse est requise";
    if (!form.telephone.trim()) newErrors.telephone = "Le téléphone est requis";

    // Validation du téléphone (format simple)
    const phoneRegex = /^[0-9+\-\s]{8,15}$/;
    if (form.telephone && !phoneRegex.test(form.telephone)) {
      newErrors.telephone = "Format de téléphone invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Préparer les données du fournisseur
    const now = new Date().toISOString();
    let fournisseurData;

    if (isEditing && editingFournisseur) {
      // Mise à jour d'un fournisseur existant
      fournisseurData = {
        ...editingFournisseur, // Conserver l'ID et les dates de création
        ...form,
        updatedAt: now,
      };
    } else {
      // Création d'un nouveau fournisseur
      fournisseurData = {
        id: uuidv4(), // Génération de l'UUID ici
        ...form,
        createdAt: now,
        updatedAt: now,
      };
    }

    // Appeler la fonction de callback avec le fournisseur créé/mis à jour
    onFournisseurSaved(fournisseurData, isEditing ? "edit" : "add");

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit />
                  Modifier Fournisseur
                </>
              ) : (
                <>
                  <Add />
                  Nouveau Fournisseur
                </>
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Person />
                  Nom du fournisseur *
                </span>
              </label>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                  errors.nom ? "border-rose-500" : "border-gray-300"
                }`}
                placeholder="Nom complet ou raison sociale"
              />
              {errors.nom && (
                <p className="text-sm text-rose-600 mt-1">{errors.nom}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <LocationOn />
                  Adresse *
                </span>
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                rows="3"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                  errors.address ? "border-rose-500" : "border-gray-300"
                }`}
                placeholder="Adresse complète"
              />
              {errors.address && (
                <p className="text-sm text-rose-600 mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Phone />
                  Téléphone *
                </span>
              </label>
              <input
                type="tel"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                  errors.telephone ? "border-rose-500" : "border-gray-300"
                }`}
                placeholder="Ex: 05 XX XX XX XX"
              />
              {errors.telephone && (
                <p className="text-sm text-rose-600 mt-1">{errors.telephone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Business />
                  N° Registre de Commerce (RC)
                </span>
              </label>
              <input
                type="text"
                name="n_rc"
                value={form.n_rc}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Numéro RC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Business />
                  N° Identifiant Fiscal (IF)
                </span>
              </label>
              <input
                type="text"
                name="n_if"
                value={form.n_if}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Numéro IF"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Business />
                  N° Identifiant Statistique (IS)
                </span>
              </label>
              <input
                type="text"
                name="n_is"
                value={form.n_is}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Numéro IS"
              />
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
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Save />
              {isEditing ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FournisseurDialog;
