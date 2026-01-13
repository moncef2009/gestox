import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("db", {
  // Produits
  addProduct: (data) => ipcRenderer.invoke("db-insert", "products", data),
  getProducts: () => ipcRenderer.invoke("db-find", "products", {}),
  getProduct: (id) => ipcRenderer.invoke("db-find", "products", { _id: id }),
  updateProduct: (id, data) =>
    ipcRenderer.invoke(
      "db-update",
      "products",
      { _id: id },
      { $set: data },
      {}
    ),
  deleteProduct: (id) =>
    ipcRenderer.invoke("db-remove", "products", { _id: id }, {}),

  // Clients
  addClient: (data) => ipcRenderer.invoke("db-insert", "clients", data),
  getClients: () => ipcRenderer.invoke("db-find", "clients", {}),
  getClient: (id) => ipcRenderer.invoke("db-find", "clients", { _id: id }),
  updateClient: (id, data) =>
    ipcRenderer.invoke("db-update", "clients", { _id: id }, { $set: data }, {}),
  deleteClient: (id) =>
    ipcRenderer.invoke("db-remove", "clients", { _id: id }, {}),

  // Fournisseurs
  addFournisseur: (data) =>
    ipcRenderer.invoke("db-insert", "fournisseurs", data),
  getFournisseurs: () => ipcRenderer.invoke("db-find", "fournisseurs", {}),
  getFournisseur: (id) =>
    ipcRenderer.invoke("db-find", "fournisseurs", { _id: id }),
  updateFournisseur: (id, data) =>
    ipcRenderer.invoke(
      "db-update",
      "fournisseurs",
      { _id: id },
      { $set: data },
      {}
    ),
  deleteFournisseur: (id) =>
    ipcRenderer.invoke("db-remove", "fournisseurs", { _id: id }, {}),

  // Ventes
  addSale: (data) => ipcRenderer.invoke("db-insert", "sales", data),
  getSales: () => ipcRenderer.invoke("db-find", "sales", {}),
  getSale: (id) => ipcRenderer.invoke("db-find", "sales", { _id: id }),
  updateSale: (id, data) =>
    ipcRenderer.invoke("db-update", "sales", { _id: id }, { $set: data }, {}),
  deleteSale: (id) => ipcRenderer.invoke("db-remove", "sales", { _id: id }, {}),

  // Factures proforma
  addProforma: (data) =>
    ipcRenderer.invoke("db-insert", "proformaInvoices", data),
  getProformas: () => ipcRenderer.invoke("db-find", "proformaInvoices", {}),
  getProforma: (id) =>
    ipcRenderer.invoke("db-find", "proformaInvoices", { _id: id }),
  updateProforma: (id, data) =>
    ipcRenderer.invoke(
      "db-update",
      "proformaInvoices",
      { _id: id },
      { $set: data },
      {}
    ),
  deleteProforma: (id) =>
    ipcRenderer.invoke("db-remove", "proformaInvoices", { _id: id }, {}),

  // Factures
  addInvoice: (data) => ipcRenderer.invoke("db-insert", "invoices", data),
  getInvoices: () => ipcRenderer.invoke("db-find", "invoices", {}),
  getInvoice: (id) => ipcRenderer.invoke("db-find", "invoices", { _id: id }),
  updateInvoice: (id, data) =>
    ipcRenderer.invoke(
      "db-update",
      "invoices",
      { _id: id },
      { $set: data },
      {}
    ),
  deleteInvoice: (id) =>
    ipcRenderer.invoke("db-remove", "invoices", { _id: id }, {}),

  // Bons d'achat
  addBonAchat: (data) => ipcRenderer.invoke("db-insert", "bonsAchat", data),
  getBonsAchat: () => ipcRenderer.invoke("db-find", "bonsAchat", {}),
  getBonAchat: (id) => ipcRenderer.invoke("db-find", "bonsAchat", { _id: id }),
  updateBonAchat: (id, data) =>
    ipcRenderer.invoke(
      "db-update",
      "bonsAchat",
      { _id: id },
      { $set: data },
      {}
    ),
  deleteBonAchat: (id) =>
    ipcRenderer.invoke("db-remove", "bonsAchat", { _id: id }, {}),

  // Unités
  addUnit: (data) => ipcRenderer.invoke("db-insert", "units", data),
  getUnits: () => ipcRenderer.invoke("db-find", "units", {}),
  getUnit: (id) => ipcRenderer.invoke("db-find", "units", { _id: id }),
  updateUnit: (id, data) =>
    ipcRenderer.invoke("db-update", "units", { _id: id }, { $set: data }, {}),
  deleteUnit: (id) => ipcRenderer.invoke("db-remove", "units", { _id: id }, {}),

  // Catégories
  addCategory: (data) => ipcRenderer.invoke("db-insert", "categories", data),
  getCategories: () => ipcRenderer.invoke("db-find", "categories", {}),
  getCategory: (id) => ipcRenderer.invoke("db-find", "categories", { _id: id }),
  updateCategory: (id, data) =>
    ipcRenderer.invoke(
      "db-update",
      "categories",
      { _id: id },
      { $set: data },
      {}
    ),
  deleteCategory: (id) =>
    ipcRenderer.invoke("db-remove", "categories", { _id: id }, {}),
});

contextBridge.exposeInMainWorld("printer", {
  printTicket: (ticketData) => ipcRenderer.invoke("print-ticket", ticketData),
  checkPrinter: () => ipcRenderer.invoke("check-printer"),
});
