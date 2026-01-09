import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Add,
  Edit,
  Close,
  Save,
  Category,
  CloudUpload,
  PhotoCamera,
  CalendarToday,
  QrCode,
  Delete,
  AddCircle,
  Straighten,
} from "@mui/icons-material";

const ProductDialog = ({
  open,
  onClose,
  onSubmit,
  editingProduct,
  customUnits = [],
  categories = [],
  onAddUnit,
  onAddCategory,
}) => {
  // État local pour le formulaire
  const [form, setForm] = useState({
    id: "",
    image: "",
    name: "",
    purchasePrice: "",
    sellingPriceRetail: "",
    sellingPriceWholesale: "",
    currentQuantity: "",
    alertQuantity: "",
    expiry: "",
    unit: "",
    tva: "",
    category: "",
    barcodes: [""],
  });

  // État pour les erreurs
  const [errors, setErrors] = useState({});

  // État pour l'image
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // État pour les dialogues d'unité et catégorie
  const [openUnitDialog, setOpenUnitDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [newUnit, setNewUnit] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // Initialiser le formulaire quand editingProduct change
  useEffect(() => {
    if (editingProduct) {
      setForm({
        id: editingProduct.id,
        image: editingProduct.image || "",
        name: editingProduct.name || "",
        purchasePrice: editingProduct.purchasePrice?.toString() || "",
        sellingPriceRetail: editingProduct.sellingPriceRetail?.toString() || "",
        sellingPriceWholesale:
          editingProduct.sellingPriceWholesale?.toString() || "",
        currentQuantity: editingProduct.currentQuantity?.toString() || "",
        alertQuantity: editingProduct.alertQuantity?.toString() || "",
        expiry: editingProduct.expiry || "",
        unit: editingProduct.unit || "",
        tva: editingProduct.tva?.toString() || "",
        category: editingProduct.category || "",
        barcodes:
          editingProduct.barcodes && editingProduct.barcodes.length > 0
            ? editingProduct.barcodes
            : [""],
      });

      if (
        editingProduct.image &&
        editingProduct.image.startsWith("data:image")
      ) {
        setImagePreview(editingProduct.image);
      } else {
        setImagePreview(editingProduct.image || "");
      }
    } else {
      resetForm();
    }
  }, [editingProduct, open]);

  const resetForm = () => {
    setForm({
      id: "",
      image: "",
      name: "",
      purchasePrice: "",
      sellingPriceRetail: "",
      sellingPriceWholesale: "",
      currentQuantity: "",
      alertQuantity: "",
      expiry: "",
      unit: "",
      tva: "",
      category: "",
      barcodes: [""],
    });
    setImageFile(null);
    setImagePreview("");
    setErrors({});
  };

  const uploadImage = async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fileName = `product_${uuidv4()}_${file.name}`;
        const imagePath = `/assets/products/${fileName}`;

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          resolve({
            path: imagePath,
            dataUrl: base64String,
            fileName: fileName,
          });
        };
        reader.readAsDataURL(file);
      }, 1000);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Le nom est requis";
    if (form.currentQuantity === "" || parseFloat(form.currentQuantity) < 0)
      newErrors.currentQuantity = "La quantité ne peut pas être négative";
    if (!form.purchasePrice || parseFloat(form.purchasePrice) < 0)
      newErrors.purchasePrice = "Le prix d'achat ne peut pas être négatif";
    if (!form.sellingPriceRetail || parseFloat(form.sellingPriceRetail) < 0)
      newErrors.sellingPriceRetail =
        "Le prix de vente détail ne peut pas être négatif";
    if (
      !form.sellingPriceWholesale ||
      parseFloat(form.sellingPriceWholesale) < 0
    )
      newErrors.sellingPriceWholesale =
        "Le prix de vente gros ne peut pas être négatif";
    if (!form.tva || parseFloat(form.tva) < 0 || parseFloat(form.tva) > 100)
      newErrors.tva = "Le taux de TVA doit être entre 0 et 100%";
    if (form.alertQuantity !== "" && parseFloat(form.alertQuantity) < 0)
      newErrors.alertQuantity =
        "La quantité d'alerte ne peut pas être négative";

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) {
        alert("Veuillez sélectionner une image valide (JPG, PNG, etc.)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5MB");
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm({
      ...form,
      image: "",
    });
  };

  const handleBarcodeChange = (index, value) => {
    const newBarcodes = [...form.barcodes];
    newBarcodes[index] = value;
    setForm({
      ...form,
      barcodes: newBarcodes,
    });
  };

  const addBarcodeField = () => {
    setForm({
      ...form,
      barcodes: [...form.barcodes, ""],
    });
  };

  const removeBarcodeField = (index) => {
    const newBarcodes = form.barcodes.filter((_, i) => i !== index);
    setForm({
      ...form,
      barcodes: newBarcodes,
    });
  };

  const handleAddUnit = () => {
    if (newUnit.trim() && !customUnits.includes(newUnit.trim())) {
      onAddUnit(newUnit.trim());
      setNewUnit("");
      setOpenUnitDialog(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory("");
      setOpenCategoryDialog(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUploadingImage(true);

    let finalImageUrl = form.image;

    if (imageFile) {
      try {
        const uploadedImage = await uploadImage(imageFile);
        finalImageUrl = uploadedImage.dataUrl;
      } catch (error) {
        console.error("Erreur lors de l'upload de l'image:", error);
        alert("Erreur lors de l'upload de l'image. Veuillez réessayer.");
        setUploadingImage(false);
        return;
      }
    }

    setUploadingImage(false);

    const productData = {
      ...form,
      id: editingProduct ? editingProduct.id : uuidv4(),
      image: finalImageUrl,
      currentQuantity: parseFloat(form.currentQuantity) || 0,
      alertQuantity: form.alertQuantity ? parseFloat(form.alertQuantity) : 0,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      sellingPriceRetail: parseFloat(form.sellingPriceRetail) || 0,
      sellingPriceWholesale: parseFloat(form.sellingPriceWholesale) || 0,
      tva: parseFloat(form.tva) || 0,
      category: form.category || "",
      unit: form.unit || "",
      barcodes: form.barcodes.filter((b) => b.trim() !== ""),
      lastUpdated: new Date().toISOString(),
      totalValue:
        (parseFloat(form.currentQuantity) || 0) *
        (parseFloat(form.purchasePrice) || 0),
      createdAt: editingProduct
        ? editingProduct.createdAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(productData, editingProduct ? "edit" : "add");
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Dialog principal produit */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editingProduct ? (
                  <>
                    <Edit />
                    Modifier Produit
                  </>
                ) : (
                  <>
                    <Add />
                    Nouveau Produit
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                    errors.name ? "border-rose-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-rose-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <div className="flex gap-2">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Non classé</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setOpenCategoryDialog(true)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                  >
                    <Add className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité disponible *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="currentQuantity"
                  value={form.currentQuantity}
                  onChange={handleChange}
                  required
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                    errors.currentQuantity
                      ? "border-rose-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.currentQuantity && (
                  <p className="text-sm text-rose-600 mt-1">
                    {errors.currentQuantity}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité d'alerte
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="alertQuantity"
                  value={form.alertQuantity}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                    errors.alertQuantity ? "border-rose-500" : "border-gray-300"
                  }`}
                />
                {errors.alertQuantity && (
                  <p className="text-sm text-rose-600 mt-1">
                    {errors.alertQuantity}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité
                </label>
                <div className="flex gap-2">
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Sans unité</option>
                    {customUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setOpenUnitDialog(true)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                  >
                    <Add className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix d'achat (DA) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="purchasePrice"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  required
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                    errors.purchasePrice ? "border-rose-500" : "border-gray-300"
                  }`}
                />
                {errors.purchasePrice && (
                  <p className="text-sm text-rose-600 mt-1">
                    {errors.purchasePrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de vente détail (DA) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="sellingPriceRetail"
                  value={form.sellingPriceRetail}
                  onChange={handleChange}
                  required
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                    errors.sellingPriceRetail
                      ? "border-rose-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.sellingPriceRetail && (
                  <p className="text-sm text-rose-600 mt-1">
                    {errors.sellingPriceRetail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de vente gros (DA) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="sellingPriceWholesale"
                  value={form.sellingPriceWholesale}
                  onChange={handleChange}
                  required
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                    errors.sellingPriceWholesale
                      ? "border-rose-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.sellingPriceWholesale && (
                  <p className="text-sm text-rose-600 mt-1">
                    {errors.sellingPriceWholesale}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TVA (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="tva"
                    value={form.tva}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 ${
                      errors.tva ? "border-rose-500" : "border-gray-300"
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    %
                  </span>
                </div>
                {errors.tva && (
                  <p className="text-sm text-rose-600 mt-1">{errors.tva}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de péremption
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="expiry"
                    value={form.expiry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute left-3 top-2 text-gray-500">
                    <CalendarToday className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <PhotoCamera />
                  Image du produit
                </div>
              </label>
              {(imagePreview || form.image) && (
                <div className="text-center space-y-2">
                  <img
                    src={imagePreview || form.image}
                    alt="Preview"
                    className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-xl border border-gray-200 mx-auto"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-rose-600 hover:text-rose-700 text-sm flex items-center gap-1 mx-auto"
                  >
                    <Delete className="w-4 h-4" />
                    Supprimer l'image
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id="upload-image"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="upload-image">
                <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all flex items-center justify-center gap-2">
                  <CloudUpload />
                  {imagePreview || form.image
                    ? "Changer l'image"
                    : "Télécharger une image"}
                </div>
              </label>
              <p className="text-xs text-gray-500">
                Formats acceptés : JPG, PNG, GIF • Taille max : 5MB
              </p>
              {uploadingImage && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  Upload de l'image en cours...
                </div>
              )}
            </div>

            {/* Codes-barres */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <QrCode />
                  Codes-barres (facultatifs)
                </div>
              </label>
              {form.barcodes.map((barcode, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Code-barres ${index + 1}`}
                    value={barcode}
                    onChange={(e) => handleBarcodeChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeBarcodeField(index)}
                    disabled={form.barcodes.length === 1}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBarcodeField}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm"
              >
                <AddCircle />
                Ajouter un code-barres
              </button>
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
                disabled={uploadingImage}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save />
                    {editingProduct ? "Mettre à jour" : "Enregistrer"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dialog unité */}
      {openUnitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Straighten />
                Nouvelle unité
              </h3>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddUnit()}
                placeholder="Nom de l'unité"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                autoFocus
              />
              {customUnits.length > 0 && (
                <p className="text-sm text-gray-500">
                  Unités disponibles : {customUnits.join(", ")}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setOpenUnitDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2"
                >
                  <Close />
                  Annuler
                </button>
                <button
                  onClick={handleAddUnit}
                  disabled={
                    !newUnit.trim() || customUnits.includes(newUnit.trim())
                  }
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Add />
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog catégorie */}
      {openCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Category />
                Nouvelle catégorie
              </h3>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="Nom de la catégorie"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                autoFocus
              />
              {categories.length > 0 && (
                <p className="text-sm text-gray-500">
                  Catégories disponibles : {categories.join(", ")}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setOpenCategoryDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2"
                >
                  <Close />
                  Annuler
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={
                    !newCategory.trim() ||
                    categories.includes(newCategory.trim())
                  }
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Add />
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDialog;
