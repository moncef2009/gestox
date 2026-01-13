export default function PrintButton() {
  const items = [
    { name: "Produit A", qty: 2, price: 5 },
    { name: "Produit B", qty: 1, price: 3.5 },
  ];

  const handlePrint = async () => {
    const res = await window.electron.printTicket(items);

    if (!res.success) {
      alert("Erreur impression : " + res.error);
    }
  };

  return <button onClick={handlePrint}>Imprimer Ticket</button>;
}
