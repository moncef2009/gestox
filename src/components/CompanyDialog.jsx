import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Add,
  Edit,
  Business,
  Phone,
  LocationOn,
  Email,
  Save,
  Close,
} from "@mui/icons-material";

const CompanyDialog = ({ open, onClose, onCompanySaved, editingCompany }) => {
  // État local pour le formulaire
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    rc: "",
    nif: "",
    nis: "",
  });

  // État local pour les erreurs
  const [errors, setErrors] = useState({});

  // État pour suivre si on est en mode édition
  const [isEditing, setIsEditing] = useState(false);

  // Initialiser le formulaire quand l'editingCompany change
  useEffect(() => {
    if (editingCompany) {
      // Mode édition
      setIsEditing(true);
      setForm({
        name: editingCompany.name || "",
        address: editingCompany.address || "",
        phone: editingCompany.phone || "",
        email: editingCompany.email || "",
        rc: editingCompany.rc || "",
        nif: editingCompany.nif || "",
        nis: editingCompany.nis || "",
      });
    } else {
      // Mode création
      setIsEditing(false);
      resetForm();
    }
  }, [editingCompany, open]);

  const resetForm = () => {
    setForm({
      name: "",
      address: "",
      phone: "",
      email: "",
      rc: "",
      nif: "",
      nis: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Le nom de l'entreprise est requis";
    if (!form.address.trim()) newErrors.address = "L'adresse est requise";
    if (!form.phone.trim()) newErrors.phone = "Le téléphone est requis";

    // Validation du téléphone
    const phoneRegex = /^[0-9+\-\s]{8,15}$/;
    if (form.phone && !phoneRegex.test(form.phone)) {
      newErrors.phone = "Format de téléphone invalide";
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = "Format d'email invalide";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const now = new Date().toISOString();
      let companyData;

      if (isEditing && editingCompany) {
        // Mise à jour d'une entreprise existante
        companyData = {
          ...editingCompany,
          ...form,
          updatedAt: now,
        };

        // Appeler l'API pour mettre à jour
        await window.db.updateCompany(editingCompany._id, companyData);
      } else {
        // Création d'une nouvelle entreprise
        companyData = {
          ...form,
          isCurrent: false, // Par défaut, pas l'entreprise courante
          createdAt: now,
          updatedAt: now,
        };

        // Appeler l'API pour créer
        const result = await window.db.addCompany(companyData);
        companyData._id = result._id || result.id;
      }

      // Appeler la fonction de callback avec l'entreprise créée/mise à jour
      onCompanySaved(companyData, isEditing ? "edit" : "add");

      resetForm();
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'entreprise:", error);
      alert("Une erreur est survenue lors de l'enregistrement.");
    }
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
                  Modifier l'Entreprise
                </>
              ) : (
                <>
                  <Add />
                  Nouvelle Entreprise
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
                  <Business />
                  Nom de l'entreprise *
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.name ? "border-rose-500" : "border-gray-300"
                }`}
                placeholder="Raison sociale"
              />
              {errors.name && (
                <p className="text-sm text-rose-600 mt-1">{errors.name}</p>
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
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
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.phone ? "border-rose-500" : "border-gray-300"
                }`}
                placeholder="Ex: 05 XX XX XX XX"
              />
              {errors.phone && (
                <p className="text-sm text-rose-600 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Email />
                  Email
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.email ? "border-rose-500" : "border-gray-300"
                }`}
                placeholder="contact@entreprise.com"
              />
              {errors.email && (
                <p className="text-sm text-rose-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Business />
                N° Registre de Commerce (RC)
              </label>
              <input
                type="text"
                name="rc"
                value={form.rc}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Numéro RC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Business />
                N° Identifiant Fiscal (NIF)
              </label>
              <input
                type="text"
                name="nif"
                value={form.nif}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Numéro NIF"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Business />
                N° Identifiant Statistique (NIS)
              </label>
              <input
                type="text"
                name="nis"
                value={form.nis}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Numéro NIS"
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
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2"
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

export default CompanyDialog;
