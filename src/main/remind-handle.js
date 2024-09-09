const { BrowserWindow, screen, ipcMain } = require('electron')
const { join } = require('path')

let remindWindowMap = {}
let windowId = 0

function createRemindWindow() {
	remindWindowMap[windowId] = new BrowserWindow({
		height: 250,
		width: 360,
		show: false,
		resizable: true,
		frame: true,
		skipTaskbar: false, // 窗口是否不显示在任务栏上面
		transparent: false, // 窗口透明
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			nodeIntegration: true,
			contextIsolation: false, // 关闭上下文隔离
		},
	})
	remindWindowMap[windowId].removeMenu()

	// 右下角弹出
	const { size, scaleFactor } = screen.getPrimaryDisplay()
	const { height, width } = remindWindowMap[windowId].getBounds()

	remindWindowMap[windowId].setBounds({
		x: size.width - width + 7,
		y: size.height - height - 33,
		height,
		width,
	})
	remindWindowMap[windowId].setAlwaysOnTop(true)
	remindWindowMap[windowId].loadFile(join(__dirname, '../renderer/remind.html'))
	remindWindowMap[windowId].show()

	ipcMain.handle('openRemindDevTools', async (event) => {
		remindWindowMap[windowId].webContents.openDevTools()
	})

	ipcMain.handle('getScaleFactor', async (event) => {
		return scaleFactor
	})

	return remindWindowMap[windowId]
}

module.exports = createRemindWindow
