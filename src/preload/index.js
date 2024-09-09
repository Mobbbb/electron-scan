const { contextBridge, ipcRenderer,  } = require('electron')
// import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for ipcMain
const listen = {
	mousemove: (callback) => ipcRenderer.on('mousemove', async (event, value) => callback(value)),
	changeCheckBox: (callback) => ipcRenderer.on('changeCheckBox', async (event, value) => callback(value)),
}

// Custom APIs for renderer
const call = {
	desktopCapturer: () => ipcRenderer.invoke('desktopCapturer'),
	readImage: () => ipcRenderer.invoke('readImage'),
	sendMail: (params) => ipcRenderer.invoke('sendMail', params),
	mouseTo: (pos) => ipcRenderer.invoke('mouseTo', pos),
	mouseClick: () => ipcRenderer.invoke('mouseClick'),
	openRemindWindow: () => ipcRenderer.invoke('openRemindWindow'),
	getScaleFactor: () => ipcRenderer.invoke('getScaleFactor'),
	quit: () => ipcRenderer.invoke('quit'),
	openDevTools: () => ipcRenderer.invoke('openDevTools'),
	openRemindDevTools: () => ipcRenderer.invoke('openRemindDevTools'),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		// contextBridge.exposeInMainWorld('electron', electronAPI)
		contextBridge.exposeInMainWorld('listen', listen)
		contextBridge.exposeInMainWorld('call', call)
	} catch (error) {
		console.error(error)
	}
} else {
	// window.electron = electronAPI
	window.listen = listen
	window.call = call
}
