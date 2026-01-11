import { contextBridge, ipcRenderer } from "electron";
import { EVENT_CONSTANTS } from "./renderUtils";

contextBridge.exposeInMainWorld("electronAPI", {
  sendRendererEvent: (event, payload) => {
    ipcRenderer.send(event, payload);
  },
  onKeyBoardShortcut: (callback) =>
    ipcRenderer.on(
      EVENT_CONSTANTS.SEND_KEYBOARD_SHORTCUT_TO_RENDERER,
      (_, data) => callback(data)
    ),
  onWindowBlur: (callback) => {
    ipcRenderer.on(EVENT_CONSTANTS.WINDOW_BLUR, (_, data) => callback(data));
  },
  takeScreenshot: () => ipcRenderer.invoke(EVENT_CONSTANTS.TAKE_SCREENSHOT),
  saveApiKey: (key) => ipcRenderer.invoke(EVENT_CONSTANTS.SAVE_API_KEY, key),
  loadApiKey: () => ipcRenderer.invoke(EVENT_CONSTANTS.LOAD_API_KEY),
  getSttApiKey: () => ipcRenderer.invoke(EVENT_CONSTANTS.GET_STT_API_KEY),
  checkScreenPermission: () =>
    ipcRenderer.invoke(EVENT_CONSTANTS.CHECK_SCREEN_PERMISSION),
});
