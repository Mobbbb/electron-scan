// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu } = require('electron')
const { join } = require('path')
const ipcHandle = require('./ipc-handle')
const createRemindWindow = require('./remind-handle')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let remindWindow = null
let tray = null
let flickerTimer = null

function createWindow () {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 85,
		height: 55,
		resizable: true,
		frame: false,
		transparent: true,
		backgroundColor: '#00000000',
		autoHideMenuBar: true,
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
		}
	})

	mainWindow.setAlwaysOnTop(true)
	// and load the index.html of the app.
	// mainWindow.loadFile('index.html')
	mainWindow.loadFile(join(__dirname, '../renderer/index.html'))

	return mainWindow
	// Open the DevTools.
	// mainWindow.webContents.openDevTools()
}

const gotTheLock = app.requestSingleInstanceLock({ key: '' })
if (!gotTheLock) {
	app.quit()
} else {
	app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
		// 有人试图运行第二个实例，我们应该关注我们的窗口
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore()
			mainWindow.show()
			mainWindow.focus()
		}
	})

	app.whenReady().then(() => {
		function closeHandle(event) {
			event.preventDefault() // 阻止默认行为
			remindWindow.hide() // 隐藏窗口
		}
		remindWindow = createRemindWindow(closeHandle)
		mainWindow = createWindow()
		
		mainWindow.on('close', () => {
			remindWindow.off('close', closeHandle)
			remindWindow.close()
			app.quit()
		})
	
		tray = createTray(mainWindow, remindWindow, closeHandle) // 创建系统托盘图标
		ipcHandle(mainWindow, remindWindow, tray)
	
		app.on('activate', function () {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (BrowserWindow.getAllWindows().length === 0) createWindow()
		})
	})
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  	if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
app.on('will-quit', () => {

})

// 创建托盘图标右键菜单
function createTray(mainWindow, remindWindow, closeHandle) {
	let tray = new Tray(resolvePath('icon.ico')) // 使用系统托盘图标
	const contextMenu = Menu.buildFromTemplate([
		{ label: '退出       ', click: () => {
			remindWindow.off('close', closeHandle)
			app.quit()
		}},
	])
	tray.setContextMenu(contextMenu)
	tray.on('double-click', function() {
		remindWindow.show()
		mainWindow.show()
	})
	tray.on('click', function() {
		remindWindow.show()
		mainWindow.show()
	})
	return tray
}

function flickerTray(tray) {
	if (!flickerTimer) {
		let hasIco = false
		flickerTimer = setInterval(() => {
			tray.setImage(resolvePath(hasIco ? 'icon.ico' : 'empty.ico'))
			hasIco = !hasIco
		}, 500)
	}
}

function stopTray(tray) {
	if (flickerTimer) {
		clearInterval(flickerTimer)
		flickerTimer = null
	}
	tray.setImage(resolvePath('icon.ico'))
}

function resolvePath(fileName, rootPath = '') {
	const publicPath = rootPath ? rootPath : 'public'
	// if (process.env.NODE_ENV === 'development') {
	// 	return `../../${publicPath}/${fileName}`
	// }
	return path.join(__dirname, `../../${publicPath}/${fileName}`)
}
