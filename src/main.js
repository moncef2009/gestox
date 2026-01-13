import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import Datastore from "nedb-promises";
const usb = require("usb");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// =======================
// NeDB Promises Databases
// =======================
const db = {
  products: new Datastore({
    filename: path.join(app.getPath("userData"), "products.db"),
    autoload: true,
  }),
  clients: new Datastore({
    filename: path.join(app.getPath("userData"), "clients.db"),
    autoload: true,
  }),
  fournisseurs: new Datastore({
    filename: path.join(app.getPath("userData"), "fournisseurs.db"),
    autoload: true,
  }),
  sales: new Datastore({
    filename: path.join(app.getPath("userData"), "sales.db"),
    autoload: true,
  }),
  proformaInvoices: new Datastore({
    filename: path.join(app.getPath("userData"), "proformaInvoices.db"),
    autoload: true,
  }),
  invoices: new Datastore({
    filename: path.join(app.getPath("userData"), "invoices.db"),
    autoload: true,
  }),
  bonsAchat: new Datastore({
    filename: path.join(app.getPath("userData"), "bonsAchat.db"),
    autoload: true,
  }),
  units: new Datastore({
    filename: path.join(app.getPath("userData"), "units.db"),
    autoload: true,
  }),
  categories: new Datastore({
    filename: path.join(app.getPath("userData"), "categories.db"),
    autoload: true,
  }),
};

// =======================
// Configuration imprimante
// =======================
const PRINTER_VID = 0x8866;
const PRINTER_PID = 0x0100;

async function printTicket(ticketContent) {
  return new Promise((resolve, reject) => {
    try {
      const device = usb.findByIds(PRINTER_VID, PRINTER_PID);
      if (!device) return reject("Imprimante non trouvée");

      device.open();

      const iface = device.interfaces[0];

      if (process.platform !== "win32") {
        if (iface.isKernelDriverActive()) {
          iface.detachKernelDriver();
        }
      }

      iface.claim();

      const outEndpoint = iface.endpoints.find((e) => e.direction === "out");
      if (!outEndpoint) {
        device.close();
        return reject("Endpoint OUT introuvable");
      }

      // =======================
      // Commandes ESC/POS
      // =======================
      const escpos = {
        INIT: Buffer.from([0x1b, 0x40]),
        ALIGN_LEFT: Buffer.from([0x1b, 0x61, 0x00]),
        ALIGN_RIGHT: Buffer.from([0x1b, 0x61, 0x02]),
        FEED_LINES: (n) => Buffer.from([0x1b, 0x64, n]),
        CUT: Buffer.from([0x1d, 0x56, 0x00]),
      };

      // =======================
      // Ticket MINIMAL
      // =======================
      const ticket = Buffer.concat([
        escpos.INIT,
        escpos.ALIGN_LEFT,

        Buffer.from(`Date: ${new Date().toLocaleString()}\n`, "ascii"),
        Buffer.from(`Ticket: ${ticketContent.ticketNumber}\n`, "ascii"),
        Buffer.from("-".repeat(32) + "\n", "ascii"),

        ...ticketContent.items.flatMap((item) => [
          Buffer.from(`${item.name.substring(0, 20)}\n`, "ascii"),
          Buffer.from(
            `${item.quantity} x ${item.unitPrice.toFixed(2)} = ${item.subtotal.toFixed(2)} DA\n`,
            "ascii"
          ),
        ]),

        Buffer.from("-".repeat(32) + "\n", "ascii"),

        escpos.ALIGN_RIGHT,
        Buffer.from(`TOTAL : ${ticketContent.total.toFixed(2)} DA\n`, "ascii"),
        Buffer.from(
          `PAYÉ  : ${ticketContent.payedAmount.toFixed(2)} DA\n`,
          "ascii"
        ),
        Buffer.from(
          `RESTE : ${ticketContent.remainingAmount.toFixed(2)} DA\n`,
          "ascii"
        ),

        escpos.FEED_LINES(2),
        escpos.CUT,
      ]);

      outEndpoint.transfer(ticket, (err) => {
        iface.release(true, () => device.close());

        if (err) reject("Erreur impression");
        else resolve("Ticket imprimé");
      });
    } catch (err) {
      reject(err.message);
    }
  });
}

ipcMain.handle("print-ticket", async (_, data) => {
  try {
    await printTicket(data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
});

ipcMain.handle("check-printer", () => {
  const device = usb.findByIds(PRINTER_VID, PRINTER_PID);
  return { connected: !!device };
});

// =======================
// IPC Handlers
// =======================
ipcMain.handle("db-insert", async (event, collection, doc) => {
  return db[collection].insert(doc);
});

ipcMain.handle("db-find", async (event, collection, query) => {
  return db[collection].find(query);
});

ipcMain.handle(
  "db-update",
  async (event, collection, query, update, options) => {
    return db[collection].update(query, update, options);
  }
);

ipcMain.handle("db-remove", async (event, collection, query, options) => {
  return db[collection].remove(query, options);
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, "../icons/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.maximize();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
