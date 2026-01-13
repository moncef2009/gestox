// components/PrintService.js
import { useState } from "react";

const usePrintService = () => {
  const [isPrinting, setIsPrinting] = useState(false);

  // Fonction pour imprimer un ticket
  const printSaleTicket = async (saleData) => {
    setIsPrinting(true);

    try {
      // Préparer les données pour l'impression
      const ticketNumber = `T${Date.now().toString().slice(-6)}`;

      const ticketContent = {
        ticketNumber,
        date: new Date().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: saleData.products.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        total: saleData.total,
        payedAmount: saleData.payedAmount,
        remainingAmount: saleData.remainingAmount,
        client: saleData.client,
        status: saleData.status,
      };

      // Appeler l'impression sans vérification préalable
      const result = await window.printer.printTicket(ticketContent);

      return {
        success: true,
        printed: result.success || false,
        error: result.error || null,
      };
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      return {
        success: true, // La vente est toujours enregistrée
        printed: false,
        error: error.message || error,
      };
    } finally {
      setIsPrinting(false);
    }
  };

  // Fonction simplifiée pour tester l'imprimante (optionnelle)
  const testPrinterConnection = async () => {
    try {
      const result = await window.printer.checkPrinter();
      return result;
    } catch (error) {
      console.error("Erreur lors du test:", error);
      return { connected: false, error: error.message };
    }
  };

  return {
    isPrinting,
    printSaleTicket,
    testPrinterConnection,
  };
};

export default usePrintService;