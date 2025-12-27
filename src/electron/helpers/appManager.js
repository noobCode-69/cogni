import {
  app,
  ipcMain,
  desktopCapturer,
  systemPreferences,
  shell,
} from "electron";
import { MainWindowManager } from "./mainWindowManager.js";
import { ShortcutManager } from "./shortCutManager.js";
import { EVENT_CONSTANTS } from "../renderUtils.js";
import { globalShortcut } from "electron";
import path from "path";
import fs from "fs";

export class AppManager {
  constructor() {
    this.mainWindowManager = new MainWindowManager();
    this.shortcutManager = new ShortcutManager(this.mainWindowManager, app);
    this.registerAppEvents();
    this.registerIpcEvents();
  }

  initialize() {
    this.mainWindowManager.createWindow(() => {
      this.shortcutManager.registerShortcuts();
    });
  }

  getApiKeyPath() {
    return path.join(app.getPath("userData"), "apiKey.json");
  }

  registerAppEvents() {
    app.on("activate", () => {
      if (this.mainWindowManager.isWindowClosed()) {
        this.mainWindowManager.createWindow(() => {
          this.shortcutManager.registerShortcuts();
        });
      }
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("will-quit", () => {
      globalShortcut.unregisterAll();
    });
  }

  registerIpcEvents() {
    ipcMain.on(EVENT_CONSTANTS.TOGGLE_VISIBILITY, () => {
      this.mainWindowManager.toggleVisibility();
    });

    ipcMain.on(EVENT_CONSTANTS.MOUSE_FORWARDING, (_event, payload) => {
      this.mainWindowManager.toggleMouseEvents(payload);
    });

    ipcMain.on(EVENT_CONSTANTS.QUIT_APPLICATION, (_event, payload) => {
      app.quit();
    });

    ipcMain.on(EVENT_CONSTANTS.TOGGLE_INCOGNITO_MODE, (_event, payload) => {
      this.mainWindowManager.toggleIncognitoMode(payload);
    });

    ipcMain.handle(EVENT_CONSTANTS.TAKE_SCREENSHOT, async () => {
      const { screen } = require("electron");
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      const sources = await desktopCapturer.getSources({
        types: ["window"],
        thumbnailSize: { width, height },
      });

      const screenSource = sources[0];
      return screenSource.thumbnail.toDataURL();
    });

    ipcMain.handle(EVENT_CONSTANTS.SAVE_API_KEY, async (_event, payload) => {
      const apiKeyPath = this.getApiKeyPath();
      fs.writeFileSync(apiKeyPath, JSON.stringify({ apiKey: payload }));
      return true;
    });

    ipcMain.handle(EVENT_CONSTANTS.LOAD_API_KEY, async () => {
      const apiKeyPath = this.getApiKeyPath();
      if (fs.existsSync(apiKeyPath)) {
        const content = fs.readFileSync(apiKeyPath);
        return JSON.parse(content).apiKey;
      }
      return null;
    });

    ipcMain.handle(EVENT_CONSTANTS.CHECK_SCREEN_PERMISSION, () => {
      const status = systemPreferences.getMediaAccessStatus("screen");
      if (status === "denied") {
        shell.openExternal(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
        );
        return false;
      }
      return true;
    });
  }
}
