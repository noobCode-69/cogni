import { BrowserWindow, screen } from "electron";
import path from "node:path";
import { EVENT_CONSTANTS } from "../renderUtils";

export class MainWindowManager {
  constructor() {
    this.mainWindow = null;
  }

  getBrowserWindowOptions() {
    const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().bounds;
    const x = 0;
    const y = 0;

    return {
      width: screenWidth,
      height: screenHeight,
      minimizable: false,
      x,
      y,
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    };
  }

  createWindow(onReady) {
    const options = this.getBrowserWindowOptions();
    this.mainWindow = new BrowserWindow(options);

    this.mainWindow.setHiddenInMissionControl(true);
    this.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    this.mainWindow.setAlwaysOnTop(true);
    this.mainWindow.setResizable(false);
    this.mainWindow.setIgnoreMouseEvents(true, { forward: true });
    this.mainWindow.on("blur", () => {
      this.mainWindow.webContents.send(EVENT_CONSTANTS.WINDOW_BLUR, {
        blurred: true,
      });
    });
    this.mainWindow.setContentProtection(false);
    this.mainWindow.setMenu(null);
    this.mainWindow.webContents.on("before-input-event", (event, input) => {
      if (input.key.toLowerCase() === "w" && input.meta) {
        event.preventDefault();
      }
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      this.mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }

    this.mainWindow.webContents.on("did-finish-load", onReady);
    // this.mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  getWindow() {
    return this.mainWindow;
  }

  isWindowClosed() {
    return !BrowserWindow.getAllWindows().length;
  }

  toggleMouseEvents(payload) {
    if (!this.mainWindow) return;
    if (payload === "ENTER") {
      this.mainWindow.setIgnoreMouseEvents(false);
    } else {
      this.mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  toggleVisibility() {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible() && !this.mainWindow.isMinimized()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
    }
  }

  toggleIncognitoMode(payload) {
    this.mainWindow.setContentProtection(payload);
  }

  sendToRenderer(channel, message) {
    const window = this.getWindow();
    if (window && window.webContents) {
      window.webContents.send(channel, message);
    }
  }

  isVisible() {
    const window = this.getWindow();
    return window ? window.isVisible() : false;
  }

  onWindowEvent(event, callback) {
    const window = this.getWindow();
    if (window) {
      window.on(event, callback);
    }
  }
  focus() {
    const window = this.getWindow();
    if (window) {
      window.focus();
    }
  }
}
