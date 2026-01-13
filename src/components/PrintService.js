// components/PrintService.js
import { useState } from "react";

const usePrintService = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);

  // Fonction pour imprimer un ticket
  const printSaleTicket = async (saleData) => {
    setIsPrinting(true);
    setPrintStatus({ type: "info", message: "Impression en cours..." });

    try {
      // Vérifier si l'imprimante est connectée
      const printerCheck = await window.printer.checkPrinter();

      if (!printerCheck.connected) {
        setPrintStatus({
          type: "warning",
          message:
            "Imprimante non connectée. Vente enregistrée sans impression.",
        });
        setIsPrinting(false);
        return {
          success: true,
          printed: false,
          warning: "Imprimante non connectée",
        };
      }

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

      // Appeler l'impression
      const result = await window.printer.printTicket(ticketContent);

      if (result.success) {
        setPrintStatus({
          type: "success",
          message: "Ticket imprimé avec succès",
        });
        return { success: true, printed: true };
      } else {
        setPrintStatus({
          type: "warning",
          message: `Vente enregistrée mais impression échouée: ${result.error}`,
        });
        return {
          success: true,
          printed: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      setPrintStatus({
        type: "error",
        message: `Erreur lors de l'impression: ${error.message || error}`,
      });
      return {
        success: false,
        printed: false,
        error: error.message || error,
      };
    } finally {
      setIsPrinting(false);
      // Effacer le message après 5 secondes
      setTimeout(() => setPrintStatus(null), 5000);
    }
  };

  // Tester la connexion de l'imprimante
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
    printStatus,
    printSaleTicket,
    testPrinterConnection,
  };
};

export default usePrintService;
