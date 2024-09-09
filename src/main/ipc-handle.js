const { ipcMain, screen, app, globalShortcut } = require('electron')
const nodemailer = require('nodemailer')
const createRemindWindow = require('./remind-handle')
const fs = require('fs')

const robotjs = require('@jitsi/robotjs')
const jimp = require("jimp")
const { createWorker } = require('tesseract.js')

let worker = null
const toolBarHeight = 32
const accuracy = 0.5
const border = 1

let auth = ''
try {
	const data = fs.readFileSync('./temp/config.json')
	auth = JSON.parse(data)
} catch (e) {
	console.log(e)
}

const getWorker = async () => {
	let worker = await createWorker(['eng', 'chi_sim'], 1, {
		logger: m => {},
		// langPath: '/resource/tesseract.js-v2.0.0',
	})
	// await worker.setParameters({
	// 	tessedit_char_whitelist: 'winlose',
	// })
	return worker
}

getWorker().then(w => {
	worker = w
})

const swapRedAndBlueChannel = bmp => {
    for (let i = 0; i < (bmp.width * bmp.height) * 4; i += 4) { // swap red and blue channel
        [bmp.image[i], bmp.image[i + 2]] = [bmp.image[i + 2], bmp.image[i]] // red channel;
    }
}

module.exports = (mainWindow) => {
	const remindWindow = createRemindWindow()
	mainWindow.on('move', () => {
		const { x, y } = mainWindow.getBounds()
		remindWindow.webContents.send('mousemove', {
			x, y,
		})
	})

	globalShortcut.register('CommandOrControl+Shift+E', () => {
		remindWindow.webContents.send('changeCheckBox')
	})

	ipcMain.handle('openDevTools', async (event) => {
		mainWindow.webContents.openDevTools()
	})
	ipcMain.handle('desktopCapturer', async () => {
		const { x, y } = mainWindow.getBounds()
		const mainWindowSize = mainWindow.getSize()
		const { size, scaleFactor } = screen.getPrimaryDisplay()
		const screenshot = robotjs.screen.capture(0, 0, size.width * scaleFactor, size.height * scaleFactor)
		swapRedAndBlueChannel(screenshot)
		const screenJimp = new jimp({ data: screenshot.image, width: screenshot.width, height: screenshot.height })
		screenJimp.crop(
			(x + accuracy + border) * scaleFactor,
			(y + toolBarHeight + accuracy) * scaleFactor,
			(mainWindowSize[0] - border * 4) * scaleFactor,
			(mainWindowSize[1] - toolBarHeight - border * 3 - accuracy) * scaleFactor
		)
		await new Promise((resolve, reject) => {
			screenJimp.write('./temp/screenshot.png', (e) => {
				if (e) resolve(e)
				resolve()
			})
		})
	})

	ipcMain.handle('mouseTo', async (event, position) => {
		robotjs.moveMouse(position[0], position[1])
	})

	ipcMain.handle('mouseClick', async (event) => {
		robotjs.mouseClick()
	})

	ipcMain.handle('quit', async (event) => {
		app.quit()
	})

	ipcMain.handle('sendMail', async (event, { content, title }) => {
		if (!auth) return {
			success: false,
			msg: '邮件授权配置获取失败！',
		}

		let transporter = nodemailer.createTransport({
			'host': 'smtp.qq.com',			// 主机
			'secureConnection': true,		// 使用 SSL
			'service': 'qq',
			'port': 465,					// SMTP 端口
			'auth': {
				user: auth.fromUser,
				pass: auth.pass,
			},
	   	})
	   	let mailContent = {
			from: auth.fromUser,				// 发件人地址
			to: auth.toUser,					// 收件人地址
			subject: title || 'NIKKE Arena Alarm',
			html: content || '',
	   	}

	   	// 发送邮件
	   	return await new Promise(resolve => {
			transporter.sendMail(mailContent, (err, info) => {
				if (err) {
					resolve({
						success: false,
						msg: err,
					})
				} else {
					resolve({
						success: true,
						msg: info,
					})
				}
			})
		})
	})

	ipcMain.handle('readImage', async (event) => {
		try {
			const mainWindowSize = mainWindow.getSize()
			const data = fs.readFileSync('./temp/screenshot.png')

			if (worker) {
				const result = await worker.recognize(data)

				return {
					imgWidth: mainWindowSize[0],
					imgHeight: mainWindowSize[1] - toolBarHeight - accuracy,
					image: `data:image/png;base64,${data.toString('base64')}`,
					...result.data,
				}
			} else {
				return ''
			}
			
		} catch (e) {
			console.log(e)
		}
		
		return ''
	})
}
