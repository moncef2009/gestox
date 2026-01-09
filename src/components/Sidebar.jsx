import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  Info as InfoIcon,
  ExpandLess,
  ExpandMore,
  ShoppingCart,
  Store,
  Inventory,
  Receipt,
  Payment,
  History,
  CreditCard,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Person,
  Business, // Icône pour entreprise
  Storefront, // Icône pour boutique
  People, // Icône pour utilisateurs
  AdminPanelSettings, // Icône pour administration
} from "@mui/icons-material";

const Sidebar = ({ open, setOpen }) => {
  const [venteOpen, setVenteOpen] = useState(false);
  const [achatOpen, setAchatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false); // État pour le dropdown admin
  const location = useLocation();

  useEffect(() => {
    if (!open) {
      setVenteOpen(false);
      setAchatOpen(false);
      setAdminOpen(false);
    }
  }, [open]);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: "/", icon: <HomeIcon className="w-5 h-5" />, text: "Accueil" },
    { path: "/stock", icon: <Inventory className="w-5 h-5" />, text: "Stock" },
  ];

  const venteItems = [
    {
      path: "/historique-vente",
      icon: <History className="w-4 h-4" />,
      text: "Historique de vente",
    },
    {
      path: "/facture-proformat",
      icon: <Receipt className="w-4 h-4" />,
      text: "Facture Proformat",
    },
    {
      path: "/facture",
      icon: <Receipt className="w-4 h-4" />,
      text: "Facture",
    },
    {
      path: "/clients",
      icon: <Person className="w-4 h-4" />,
      text: "Clients",
    },
  ];

  const achatItems = [
    {
      path: "/bon-achat",
      icon: <ShoppingBag className="w-4 h-4" />,
      text: "Bon d'achat",
    },
    {
      path: "/fournisseurs",
      icon: <Business className="w-4 h-4" />,
      text: "Fournisseurs",
    },
  ];

  // Nouveau menu Administration
  const adminItems = [
    {
      path: "/entreprises",
      icon: <Business className="w-4 h-4" />,
      text: "Entreprises",
    },
    {
      path: "/utilisateurs",
      icon: <People className="w-4 h-4" />,
      text: "Utilisateurs",
    },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out shadow-xl z-50 ${
        open ? "w-64" : "w-20"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50">
        {open && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent tracking-wide">
            MENU
          </h1>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200 hover:scale-105"
        >
          {open ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
        {/* Main Menu Items */}
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              isActive(item.path)
                ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg"
                : "hover:bg-gray-800/50 hover:translate-x-1"
            }`}
          >
            <div
              className={
                isActive(item.path) ? "text-blue-200" : "text-gray-300"
              }
            >
              {item.icon}
            </div>
            {open && (
              <span
                className={`font-medium ${isActive(item.path) ? "text-white" : "text-gray-200"}`}
              >
                {item.text}
              </span>
            )}
          </Link>
        ))}

        <div className="border-t border-gray-700 my-4"></div>

        {/* Vente Section */}
        <div>
          <button
            onClick={() => {
              if (!open) setOpen(true);
              setVenteOpen(!venteOpen);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
              venteOpen ? "bg-gray-800/50" : "hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
              {open && <span className="font-medium text-gray-200">Vente</span>}
            </div>
            {open && (
              <span className="text-cyan-400">
                {venteOpen ? <ExpandLess /> : <ExpandMore />}
              </span>
            )}
          </button>

          {/* Vente Submenu */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              venteOpen && open ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="ml-6 pl-4 border-l border-gray-700 space-y-2 mt-2">
              {venteItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-cyan-900/30 text-cyan-300"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
                  }`}
                >
                  <div className="text-cyan-400">{item.icon}</div>
                  {open && (
                    <span
                      className={`text-sm ${isActive(item.path) ? "font-medium" : ""}`}
                    >
                      {item.text}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Achat Section */}
        <div>
          <button
            onClick={() => {
              if (!open) setOpen(true);
              setAchatOpen(!achatOpen);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
              achatOpen ? "bg-gray-800/50" : "hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-emerald-400" />
              {open && <span className="font-medium text-gray-200">Achat</span>}
            </div>
            {open && (
              <span className="text-emerald-400">
                {achatOpen ? <ExpandLess /> : <ExpandMore />}
              </span>
            )}
          </button>

          {/* Achat Submenu */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              achatOpen && open ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="ml-6 pl-4 border-l border-gray-700 space-y-2 mt-2">
              {achatItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-emerald-900/30 text-emerald-300"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
                  }`}
                >
                  <div className="text-emerald-400">{item.icon}</div>
                  {open && (
                    <span
                      className={`text-sm ${isActive(item.path) ? "font-medium" : ""}`}
                    >
                      {item.text}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* NOUVELLE SECTION: Administration */}
        <div>
          <button
            onClick={() => {
              if (!open) setOpen(true);
              setAdminOpen(!adminOpen);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
              adminOpen ? "bg-gray-800/50" : "hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <AdminPanelSettings className="w-5 h-5 text-purple-400" />
              {open && (
                <span className="font-medium text-gray-200">
                  Administration
                </span>
              )}
            </div>
            {open && (
              <span className="text-purple-400">
                {adminOpen ? <ExpandLess /> : <ExpandMore />}
              </span>
            )}
          </button>

          {/* Administration Submenu */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              adminOpen && open ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="ml-6 pl-4 border-l border-gray-700 space-y-2 mt-2">
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-purple-900/30 text-purple-300"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
                  }`}
                >
                  <div className="text-purple-400">{item.icon}</div>
                  {open && (
                    <span
                      className={`text-sm ${isActive(item.path) ? "font-medium" : ""}`}
                    >
                      {item.text}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {open && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900/50 text-center">
          <p className="text-sm text-gray-500">© 2024 POS System</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
