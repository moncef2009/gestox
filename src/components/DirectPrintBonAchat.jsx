import React, { useEffect, useRef } from "react";
import {
  Print,
  Close,
  LocalShipping,
  Download,
  Business,
  CalendarToday,
  AttachMoney,
  Inventory,
  CheckCircle,
  Warning,
} from "@mui/icons-material";

const DirectPrintBonAchat = ({ bonAchatData, onClose }) => {
  const bonAchatRef = useRef();

  // Données par défaut si aucune n'est fournie
  const bonAchat = bonAchatData || {
    numero: "BA-2024-001",
    date: new Date().toISOString().split("T")[0],
    fournisseurNom: "Fournisseur SARL",
    fournisseurAddress: "123 Rue des Fournisseurs",
    fournisseurCity: "Alger",
    fournisseurTelephone: "+213 XX XX XX XX",
    fournisseurEmail: "fournisseur@email.dz",
    fournisseurRC: "RC 123456789",
    fournisseurNIF: "NIF 987654321",
    fournisseurNIS: "NIS 456789123",
    notes: "Livraison prévue dans les 5 jours",
    produits: [
      {
        nom: "Produit A",
        quantiteAchetee: 10,
        prixAchat: 1500,
        unite: "Pièce",
        tva: 19,
      },
    ],
    total: 17850,
    payedAmount: 0,
    remainingAmount: 17850,
    status: "non-payer",
  };

  // Fonction pour convertir un nombre en lettres
  const numberToWords = (num) => {
    const number = Number(num);
    if (isNaN(number) || number === 0) return "Zéro dinars algériens";

    const integerPart = Math.floor(number);
    const decimalPart = Math.round((number - integerPart) * 100);

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

    const convertBelow1000 = (n) => {
      if (n === 0) return "";

      let result = "";
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;

      if (hundreds > 0) {
        result += hundreds === 1 ? "cent" : `${units[hundreds]} cent`;
        if (remainder > 0) result += " ";
      }

      if (remainder > 0) {
        if (remainder < 10) {
          result += units[remainder];
        } else if (remainder < 20) {
          result += teens[remainder - 10];
        } else {
          const tensDigit = Math.floor(remainder / 10);
          const unitDigit = remainder % 10;

          if (tensDigit === 7 || tensDigit === 9) {
            const base = tens[tensDigit].split("-")[0];
            const teenPart = remainder - (tensDigit === 7 ? 60 : 80);
            result +=
              base +
              "-" +
              (teenPart === 1 ? "et-" : "") +
              (teenPart < 10 ? units[teenPart] : teens[teenPart - 10]);
          } else {
            result += tens[tensDigit];
            if (unitDigit > 0) {
              result +=
                (unitDigit === 1 && tensDigit !== 8 ? "-et-" : "-") +
                units[unitDigit];
            } else if (tensDigit === 8) {
              result += "s";
            }
          }
        }
      }

      return result;
    };

    const convertInteger = (n) => {
      if (n === 0) return "zéro";

      const billions = Math.floor(n / 1e9);
      const millions = Math.floor((n % 1e9) / 1e6);
      const thousands = Math.floor((n % 1e6) / 1e3);
      const below1000 = n % 1e3;

      let parts = [];

      if (billions > 0)
        parts.push(
          `${convertBelow1000(billions)} milliard${billions > 1 ? "s" : ""}`
        );
      if (millions > 0)
        parts.push(
          `${convertBelow1000(millions)} million${millions > 1 ? "s" : ""}`
        );
      if (thousands > 0)
        parts.push(
          thousands === 1 ? "mille" : `${convertBelow1000(thousands)} mille`
        );
      if (below1000 > 0) parts.push(convertBelow1000(below1000));

      return parts.join(" ").trim();
    };

    let result = [];

    // Partie entière
    if (integerPart > 0) {
      result.push(
        `${convertInteger(integerPart)} dinar${integerPart > 1 ? "s" : ""} algérien${integerPart > 1 ? "s" : ""}`
      );
    }

    // Partie décimale
    if (decimalPart > 0) {
      result.push(
        `${convertInteger(decimalPart)} centime${decimalPart > 1 ? "s" : ""} algérien${decimalPart > 1 ? "s" : ""}`
      );
    }

    // Mettre en majuscule la première lettre
    const finalResult = result.join(" et ");
    return finalResult.charAt(0).toUpperCase() + finalResult.slice(1);
  };

  // Formatage des dates
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // Formatage des montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-DZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calcul du total TVA
  const calculateTotalTVA = () => {
    if (!bonAchat.produits) return 0;
    return bonAchat.produits.reduce((total, produit) => {
      const sousTotalHT = produit.quantiteAchetee * produit.prixAchat;
      const tvaMontant = sousTotalHT * (produit.tva / 100);
      return total + tvaMontant;
    }, 0);
  };

  // Calcul du total HT
  const calculateTotalHT = () => {
    if (!bonAchat.produits) return 0;
    return bonAchat.produits.reduce((total, produit) => {
      return total + produit.quantiteAchetee * produit.prixAchat;
    }, 0);
  };

  const totalHT = calculateTotalHT();
  const totalTVA = calculateTotalTVA();

  // Fonction d'impression directe
  const handleDirectPrint = () => {
    // Générer le contenu HTML pour l'impression
    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon d'Achat ${bonAchat.numero}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background: #fff;
            line-height: 1.5;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            margin: 15mm;
            size: A4;
          }
          
          .document-container {
            max-width: 100%;
            margin: 0 auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .document-header {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            color: white;
            padding: 25px 30px;
            text-align: center;
          }
          
          .document-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 1px;
          }
          
          .document-number {
            font-size: 16px;
            background: rgba(255, 255, 255, 0.1);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
            font-weight: 500;
          }
          
          .document-subtitle {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 5px;
          }
          
          .document-body {
            padding: 25px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 30px;
          }
          
          .info-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .info-header {
            background: #f8fafc;
            padding: 12px 18px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
            color: #1e293b;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .info-content {
            padding: 18px;
          }
          
          .info-line {
            margin-bottom: 10px;
            font-size: 13px;
            color: #475569;
            display: flex;
            align-items: flex-start;
          }
          
          .info-label {
            min-width: 120px;
            font-weight: 500;
            color: #334155;
          }
          
          .info-value {
            flex: 1;
          }
          
          .company-name {
            font-weight: 700;
            color: #1e293b;
            font-size: 16px;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 2px solid #3b82f6;
          }
          
          .items-section {
            margin: 30px 0;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .items-table th {
            background: #f1f5f9;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            border-bottom: 2px solid #cbd5e1;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .items-table td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          
          .product-name {
            font-weight: 600;
            color: #1e293b;
            font-size: 13px;
            margin-bottom: 4px;
          }
          
          .product-details {
            font-size: 11px;
            color: #64748b;
          }
          
          .totals-section {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
            border: 1px solid #e5e7eb;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
          }
          
          .total-row:not(:last-child) {
            border-bottom: 1px solid #e5e7eb;
          }
          
          .total-label {
            color: #475569;
          }
          
          .total-amount {
            font-weight: 600;
            color: #1e293b;
          }
          
          .total-ttc {
            font-size: 16px;
            font-weight: 700;
            color: #1e40af;
            padding-top: 12px;
            margin-top: 8px;
            border-top: 2px solid #cbd5e1;
          }
          
          .amount-in-words {
            background: #fef3c7;
            padding: 18px;
            border-radius: 8px;
            margin-top: 25px;
            border-left: 4px solid #f59e0b;
          }
          
          .amount-label {
            font-size: 12px;
            color: #92400e;
            margin-bottom: 8px;
            font-weight: 600;
          }
          
          .amount-text {
            font-weight: 500;
            color: #92400e;
            font-size: 13px;
            line-height: 1.6;
          }
          
          .payment-status {
            margin-top: 25px;
            padding: 15px;
            border-radius: 8px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
          }
          
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
          }
          
          .signature-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            width: 45%;
            padding: 15px;
            border-top: 2px solid #334155;
            min-height: 120px;
          }
          
          .signature-label {
            font-style: italic;
            color: #64748b;
            font-size: 12px;
            margin-top: 10px;
            text-align: center;
          }
          
          .notes-section {
            margin-top: 25px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 4px solid #94a3b8;
          }
          
          .notes-label {
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
            font-size: 13px;
          }
          
          .notes-content {
            color: #475569;
            font-size: 12px;
            line-height: 1.5;
          }
          
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .document-container {
              border: none;
              box-shadow: none;
              max-width: 100%;
            }
            
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-container">
          <!-- EN-TÊTE DU BON D'ACHAT -->
          <div class="document-header">
            <h1 class="document-title">BON D'ACHAT</h1>
            <div class="document-subtitle">Document d'achat fournisseur</div>
            <div class="document-number">N° ${bonAchat.numero}</div>
          </div>
          
          <!-- CORPS DU DOCUMENT -->
          <div class="document-body">
            <!-- INFORMATIONS DES ENTREPRISES -->
            <div class="info-grid">
              <!-- FOURNISSEUR -->
              <div class="info-card">
                <div class="info-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  FOURNISSEUR
                </div>
                <div class="info-content">
                  <div class="company-name">${bonAchat.fournisseurNom}</div>
                  <div class="info-line">
                    <span class="info-label">Adresse :</span>
                    <span class="info-value">${bonAchat.fournisseurAddress || "Non spécifié"}</span>
                  </div>
                  <div class="info-line">
                    <span class="info-label">Ville :</span>
                    <span class="info-value">${bonAchat.fournisseurCity || "Non spécifié"}</span>
                  </div>
                  <div class="info-line">
                    <span class="info-label">Téléphone :</span>
                    <span class="info-value">${bonAchat.fournisseurTelephone || "Non spécifié"}</span>
                  </div>
                  <div class="info-line">
                    <span class="info-label">Email :</span>
                    <span class="info-value">${bonAchat.fournisseurEmail || "Non spécifié"}</span>
                  </div>
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #64748b;">
                    ${bonAchat.fournisseurRC ? `<div><strong>RC :</strong> ${bonAchat.fournisseurRC}</div>` : ""}
                    ${bonAchat.fournisseurNIF ? `<div><strong>NIF :</strong> ${bonAchat.fournisseurNIF}</div>` : ""}
                    ${bonAchat.fournisseurNIS ? `<div><strong>NIS :</strong> ${bonAchat.fournisseurNIS}</div>` : ""}
                  </div>
                </div>
              </div>
              
              <!-- ENTREPRISE ACHETEUSE -->
              <div class="info-card">
                <div class="info-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  ENTREPRISE ACHETEUSE
                </div>
                <div class="info-content">
                  <div class="company-name">VOTRE ENTREPRISE SARL</div>
                  <div class="info-line">
                    <span class="info-label">Adresse :</span>
                    <span class="info-value">123 Rue d'Affaires, 16000</span>
                  </div>
                  <div class="info-line">
                    <span class="info-label">Ville :</span>
                    <span class="info-value">Alger</span>
                  </div>
                  <div class="info-line">
                    <span class="info-label">Téléphone :</span>
                    <span class="info-value">+213 XX XX XX XX</span>
                  </div>
                  <div class="info-line">
                    <span class="info-label">Email :</span>
                    <span class="info-value">contact@entreprise.dz</span>
                  </div>
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #64748b;">
                    <div><strong>RC :</strong> RC 123456789</div>
                    <div><strong>NIF :</strong> NIF 987654321</div>
                    <div><strong>NIS :</strong> NIS 456789123</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- INFORMATIONS DU BON -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
              <div class="info-card">
                <div class="info-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  INFORMATIONS
                </div>
                <div class="info-content">
                  <div class="info-line">
                    <span class="info-label">Date :</span>
                    <span class="info-value">${formatDate(bonAchat.date)}</span>
                  </div>
                  <div class="info-line">
                    <span class="info-label">N° Bon :</span>
                    <span class="info-value" style="font-weight: 700;">${bonAchat.numero}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- ARTICLES -->
            <div class="items-section">
              <div style="margin-bottom: 15px; font-weight: 600; color: #1e293b; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                ARTICLES COMMANDÉS
              </div>
              
              <div style="overflow-x: auto;">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th class="w-6/24">Article</th>
                      <th class="w-3/24">Quantité</th>
                      <th class="w-4/24">Prix Unitaire HT</th>
                      <th class="w-3/24">TVA</th>
                      <th class="w-4/24">Montant HT</th>
                      <th class="w-4/24">Montant TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bonAchat.produits
                      .map((produit, index) => {
                        const sousTotalHT =
                          produit.quantiteAchetee * produit.prixAchat;
                        const tvaMontant = sousTotalHT * (produit.tva / 100);
                        const sousTotalTTC = sousTotalHT + tvaMontant;

                        return `
                          <tr>
                            <td>
                              <div class="product-name">${produit.nom}</div>
                              <div class="product-details">
                                ${produit.isNew ? "Nouveau produit" : "Produit existant"}
                              </div>
                            </td>
                            <td class="text-center">
                              <div style="font-weight: 600;">${produit.quantiteAchetee}</div>
                              <div style="font-size: 11px; color: #64748b;">${produit.unite || "Unité"}</div>
                            </td>
                            <td class="text-right">
                              <div style="font-weight: 600;">${formatCurrency(produit.prixAchat)} DA</div>
                              <div style="font-size: 11px; color: #64748b;">Prix d'achat</div>
                            </td>
                            <td class="text-center">
                              <span style="display: inline-block; padding: 4px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                ${produit.tva}%
                              </span>
                            </td>
                            <td class="text-right" style="font-weight: 600;">${formatCurrency(sousTotalHT)} DA</td>
                            <td class="text-right" style="font-weight: 600;">${formatCurrency(sousTotalTTC)} DA</td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- TOTAUX -->
            <div class="totals-section">
              <div class="total-row">
                <span class="total-label">Total Hors Taxes :</span>
                <span class="total-amount">${formatCurrency(totalHT)} DA</span>
              </div>
              <div class="total-row">
                <span class="total-label">Total TVA :</span>
                <span class="total-amount">${formatCurrency(totalTVA)} DA</span>
              </div>
              <div class="total-row total-ttc">
                <span class="total-label">Total TTC :</span>
                <span class="total-amount">${formatCurrency(bonAchat.total)} DA</span>
              </div>
            </div>
            
            <!-- STATUT DE PAIEMENT -->
            <div class="payment-status">
              <div style="font-weight: 600; color: #0369a1; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                STATUT DE PAIEMENT
              </div>
              <div class="payment-row">
                <span>Montant total :</span>
                <span style="font-weight: 600;">${formatCurrency(bonAchat.total)} DA</span>
              </div>
              <div class="payment-row">
                <span>Déjà payé :</span>
                <span style="color: #059669; font-weight: 600;">${formatCurrency(bonAchat.payedAmount || 0)} DA</span>
              </div>
              <div class="payment-row">
                <span>Reste à payer :</span>
                <span style="color: ${(bonAchat.remainingAmount || bonAchat.total) > 0 ? "#d97706" : "#059669"}; font-weight: 600;">
                  ${formatCurrency(bonAchat.remainingAmount || bonAchat.total)} DA
                </span>
              </div>
              <div class="payment-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #bae6fd;">
                <span>Statut :</span>
                <span style="font-weight: 700; text-transform: uppercase; color: ${
                  bonAchat.status === "completement-payer"
                    ? "#059669"
                    : bonAchat.status === "partielement-payer"
                      ? "#d97706"
                      : "#dc2626"
                };">
                  ${
                    bonAchat.status === "completement-payer"
                      ? "PAYÉ"
                      : bonAchat.status === "partielement-payer"
                        ? "PARTIELLEMENT PAYÉ"
                        : "EN ATTENTE DE PAIEMENT"
                  }
                </span>
              </div>
            </div>
            
            <!-- MONTANT EN LETTRES -->
            <div class="amount-in-words">
              <div class="amount-label">Arrêtée le présent bon d'achat à la somme de :</div>
              <div class="amount-text">${numberToWords(bonAchat.total)}</div>
            </div>
            
            <!-- NOTES -->
            ${
              bonAchat.notes
                ? `
            <div class="notes-section">
              <div class="notes-label">Notes :</div>
              <div class="notes-content">${bonAchat.notes}</div>
            </div>
            `
                : ""
            }
            
            <!-- SIGNATURES -->
            <div class="signature-section">
              <div class="signature-box">
                <div style="height: 60px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;"></div>
                <div class="signature-label">
                  Signature et cachet du fournisseur
                </div>
              </div>
              
              <div class="signature-box">
                <div style="height: 60px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;"></div>
                <div class="signature-label">
                  Signature et cachet de l'entreprise
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Lancer l'impression automatiquement
          window.onload = function() {
            setTimeout(() => {
              window.print();
              setTimeout(() => {
                // Fermer la fenêtre après impression (si possible)
                if (window.opener) {
                  window.close();
                }
              }, 100);
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    // Ouvrir une nouvelle fenêtre et écrire le contenu
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Lancer l'impression automatiquement au chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDirectPrint();
      // Fermer le composant après un délai
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Interface utilisateur minimale
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Print className="text-blue-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Impression en cours...
            </h2>
            <p className="text-sm text-gray-600">
              Le bon d'achat {bonAchat.numero} est en cours d'impression
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="animate-pulse">
                <Print className="w-4 h-4" />
              </div>
              <span className="font-medium">
                Ouverture de la fenêtre d'impression...
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Si la fenêtre d'impression ne s'ouvre pas, vérifiez votre bloqueur
              de fenêtres popup.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Numéro</div>
                <div className="font-medium">{bonAchat.numero}</div>
              </div>
              <div>
                <div className="text-gray-500">Fournisseur</div>
                <div className="font-medium">{bonAchat.fournisseurNom}</div>
              </div>
              <div>
                <div className="text-gray-500">Total TTC</div>
                <div className="font-medium">
                  {formatCurrency(bonAchat.total)} DA
                </div>
              </div>
              <div>
                <div className="text-gray-500">Date</div>
                <div className="font-medium">{formatDate(bonAchat.date)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => onClose && onClose()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
          >
            <Close className="w-5 h-5" />
            Annuler
          </button>

          <button
            onClick={handleDirectPrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded flex items-center gap-2"
          >
            <Print className="w-5 h-5" />
            Réessayer l'impression
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectPrintBonAchat;
