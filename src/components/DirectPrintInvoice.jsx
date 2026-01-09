import React, { useEffect, useRef } from "react";
import {
  Print,
  Close,
  Receipt,
  Download,
  ContentCopy,
} from "@mui/icons-material";

const DirectPrintInvoice = ({ invoiceData, onClose, invoiceType }) => {
  const invoiceRef = useRef();

  // Données par défaut si aucune n'est fournie
  const invoice = invoiceData || {
    invoiceNumber: "FACT-2024-001",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    companyInfo: {
      name: "VOTRE ENTREPRISE SARL",
      address: "123 Rue d'Affaires, 16000",
      city: "Alger",
      phone: "+213 XX XX XX XX",
      email: "contact@entreprise.dz",
      rc: "RC 123456789",
      nif: "NIF 987654321",
      nis: "NIS 456789123",
    },
    client: {
      nom: "Client SARL",
      address: "456 Avenue du Client",
      city: "Oran",
      telephone: "0550 00 00 00",
      email: "client@email.com",
      n_rc: "RC 111222333",
      n_if: "IF 444555666",
      n_is: "IS 777888999", // Changé de n_ic à n_is
    },
    items: [
      {
        productName: "Produit A",
        quantity: 2,
        unitPrice: 1500,
        tva: 19,
        ht: 3000,
        ttc: 3570,
      },
    ],
    totalHT: 3000,
    totalTVA: 570,
    totalTTC: 3570,
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

  // Fonction d'impression directe
  const handleDirectPrint = () => {
    // Générer le contenu HTML pour l'impression
    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${invoice.invoiceNumber}</title>
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
          
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .invoice-header {
            background: #f8f9fa;
            color: #333;
            padding: 20px 30px;
            border-bottom: 1px solid #ddd;
          }
          
          .invoice-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .invoice-title {
            font-size: 24px;
            font-weight: 600;
          }
          
          .invoice-number {
            font-size: 14px;
            background: #fff;
            padding: 5px 10px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-weight: 500;
          }
          
          .invoice-dates {
            display: flex;
            gap: 20px;
            margin-top: 8px;
            font-size: 13px;
          }
          
          .date-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .invoice-body {
            padding: 25px;
          }
          
          .companies-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }
          
          .company-card {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .company-header {
            background: #f5f5f5;
            padding: 10px 14px;
            border-bottom: 1px solid #ddd;
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }
          
          .company-content {
            padding: 14px;
          }
          
          .company-info-line {
            margin-bottom: 6px;
            font-size: 13px;
            color: #555;
          }
          
          .company-name {
            font-weight: 600;
            color: #333;
            font-size: 15px;
            margin-bottom: 8px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            font-size: 12px;
          }
          
          .items-table th {
            background: #f8f9fa;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            color: #555;
            border-bottom: 2px solid #ddd;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
          }
          
          .product-name {
            font-weight: 500;
            color: #333;
            font-size: 13px;
          }
          
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          
          .totals-container {
            background: #f8f9fa;
            border-radius: 4px;
            padding: 15px;
            margin-top: 25px;
            border: 1px solid #ddd;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
          }
          
          .total-row:not(:last-child) {
            border-bottom: 1px solid #ddd;
          }
          
          .total-ttc {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            padding-top: 10px;
            margin-top: 6px;
            border-top: 2px solid #666;
          }
          
          .amount-in-words {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            border-left: 4px solid #666;
          }
          
          .amount-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
          }
          
          .amount-text {
            font-weight: 500;
            color: #333;
            font-size: 13px;
            line-height: 1.5;
          }
          
          .signature-section {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: right;
          }
          
          .signature-box {
            display: inline-block;
            padding: 15px 30px;
            border-top: 2px solid #333;
            min-width: 250px;
          }
          
          .signature-label {
            font-style: italic;
            color: #666;
            font-size: 12px;
            margin-top: 6px;
          }
          
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .invoice-container {
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
        <div class="invoice-container">
          <!-- EN-TÊTE DE LA FACTURE -->
          <div class="invoice-header">
            <div class="invoice-title-row">
              <h1 class="invoice-title">
                ${invoiceType === "PROFORMA" ? "FACTURE PROFORMA" : "FACTURE"}
              </h1>
              <div class="invoice-number">
                N° ${invoice.invoiceNumber}
              </div>
            </div>
            
            <div class="invoice-dates">
              <div class="date-item">
                <span>Émise le :</span>
                <strong>${formatDate(invoice.date)}</strong>
              </div>
            </div>
          </div>
          
          <!-- CORPS DE LA FACTURE -->
          <div class="invoice-body">
            <!-- INFORMATIONS DES ENTREPRISES -->
            <div class="companies-grid">
              <!-- ÉMETTEUR -->
              <div class="company-card">
                <div class="company-header">
                  Votre Entreprise
                </div>
                <div class="company-content">
                  <div class="company-name">
                    ${invoice.companyInfo.name}
                  </div>
                  <div class="company-info-line">
                    ${invoice.companyInfo.address}
                  </div>
                  <div class="company-info-line">
                    ${invoice.companyInfo.city}
                  </div>
                  <div class="company-info-line">
                    Téléphone : ${invoice.companyInfo.phone}
                  </div>
                  <div class="company-info-line">
                    Email : ${invoice.companyInfo.email}
                  </div>
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px;">
                    <div>RC : ${invoice.companyInfo.rc}</div>
                    <div>NIF : ${invoice.companyInfo.nif}</div>
                    <div>NIS : ${invoice.companyInfo.nis}</div>
                  </div>
                </div>
              </div>
              
              <!-- CLIENT -->
              <div class="company-card">
                <div class="company-header">
                  Client
                </div>
                <div class="company-content">
                  <div class="company-name">
                    ${invoice.client.nom}
                  </div>
                  <div class="company-info-line">
                    ${invoice.client.address}
                  </div>
                  <div class="company-info-line">
                    ${invoice.client.city}
                  </div>
                  <div class="company-info-line">
                    Téléphone : ${invoice.client.telephone}
                  </div>
                  <div class="company-info-line">
                    Email : ${invoice.client.email || "Non spécifié"}
                  </div>
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px;">
                    ${invoice.client.n_rc ? `<div>RC : ${invoice.client.n_rc}</div>` : ""}
                    ${invoice.client.n_if ? `<div>NIF : ${invoice.client.n_if}</div>` : ""}
                    ${invoice.client.n_is ? `<div>NIS : ${invoice.client.n_is}</div>` : ""} <!-- Changé de NIC à NIS -->
                  </div>
                </div>
              </div>
            </div>
            
            <!-- ARTICLES -->
            <div style="overflow-x: auto;">
              <table class="items-table">
                <thead>
                  <tr>
                    <th class="w-8/24">Article</th>
                    <th class="w-2/24">Qté</th>
                    <th class="w-4/24">Prix Unitaire HT</th>
                    <th class="w-2/24">TVA</th>
                    <th class="w-4/24">Montant HT</th>
                    <th class="w-4/24">Montant TTC</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items
                    .map(
                      (item, index) => `
                    <tr>
                      <td>
                        <div class="product-name">${item.productName}</div>
                      </td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">${formatCurrency(item.unitPrice)} DA</td>
                      <td class="text-center">
                        <span style="display: inline-block; padding: 2px 6px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 2px; font-size: 11px; font-weight: 500;">
                          ${item.tva}%
                        </span>
                      </td>
                      <td class="text-right" style="font-weight: 500;">${formatCurrency(item.ht)} DA</td>
                      <td class="text-right" style="font-weight: 500;">${formatCurrency(item.ttc)} DA</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            
            <!-- TOTAUX -->
            <div class="totals-container">
              <div class="total-row">
                <span>Total Hors Taxes :</span>
                <span style="font-weight: 500;">${formatCurrency(invoice.totalHT)} DA</span>
              </div>
              <div class="total-row">
                <span>TVA (${invoice.items[0]?.tva || 19}%) :</span>
                <span style="font-weight: 500;">${formatCurrency(invoice.totalTVA)} DA</span>
              </div>
              <div class="total-row total-ttc">
                <span>Total TTC :</span>
                <span>${formatCurrency(invoice.totalTTC)} DA</span>
              </div>
            </div>
            
            <!-- MONTANT EN LETTRES -->
            <div class="amount-in-words">
              <div class="amount-label">Montant en lettres :</div>
              <div class="amount-text">${numberToWords(invoice.totalTTC)}</div>
            </div>
            
            <!-- SIGNATURE -->
            <div class="signature-section">
              <div class="signature-box">
                <div style="height: 40px; border-bottom: 1px solid #ccc; margin-bottom: 8px;"></div>
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
          <div className="p-2 bg-gray-100 rounded-lg">
            <Print className="text-gray-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Impression en cours...
            </h2>
            <p className="text-sm text-gray-600">
              La facture {invoice.invoiceNumber} est en cours d'impression
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-700">
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
                <div className="font-medium">{invoice.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-gray-500">Client</div>
                <div className="font-medium">{invoice.client.nom}</div>
              </div>
              <div>
                <div className="text-gray-500">Total TTC</div>
                <div className="font-medium">
                  {formatCurrency(invoice.totalTTC)} DA
                </div>
              </div>
              <div>
                <div className="text-gray-500">Date</div>
                <div className="font-medium">{formatDate(invoice.date)}</div>
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
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded flex items-center gap-2"
          >
            <Print className="w-5 h-5" />
            Réessayer l'impression
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectPrintInvoice;
