const { BrowserWindow, screen, ipcMain, app } = require('electron')
const { join } = require('path')

let remindWindow = null

app.commandLine.appendSwitch('disable-site-isolation-trials') // 禁用同源策略

function createRemindWindow(closeHandle) {
	remindWindow = new BrowserWindow({
		height: 290,
		width: 400,
		show: false,
		resizable: true,
		frame: true,
		skipTaskbar: true, // 窗口是否不显示在任务栏上面
		transparent: true, // 窗口透明
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
			webSecurity: false, // 禁用同源策略
		},
	})
	remindWindow.removeMenu()

	remindWindow.on('close', closeHandle)

	// 右下角弹出
	const { size, scaleFactor } = screen.getPrimaryDisplay()
	const { height, width } = remindWindow.getBounds()

	remindWindow.setBounds({
		x: size.width - width + 7,
		y: size.height - height - 33,
		height,
		width,
	})
	remindWindow.setAlwaysOnTop(true)
	remindWindow.loadFile(join(__dirname, '../renderer/remind.html'))
	remindWindow.show()

	ipcMain.handle('openRemindDevTools', async (event) => {
		remindWindow.webContents.openDevTools()
	})

	ipcMain.handle('getScaleFactor', async (event) => {
		return scaleFactor
	})

	return remindWindow
}

module.exports = createRemindWindow
