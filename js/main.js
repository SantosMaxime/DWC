const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const SmallWindow = require('./SmallWindow');

let tray = null;
let mainWindow = null;
let smallWindows = [];
const stateFilePath = path.join(app.getPath('userData'), 'window-state.json');

app.on('ready', () => {
    tray = new Tray(path.join(__dirname, '../assets/icon.png'));
    tray.setToolTip('My Electron App');

    const trayMenu = Menu.buildFromTemplate([
        { label: 'Open Main Window', click: () => createMainWindow() },
        { label: 'Create Small Window', click: () => createSmallWindow() },
        { label: 'Exit', click: () => app.quit() },
    ]);
    tray.setContextMenu(trayMenu);

    const createMainWindow = () => {
        if (mainWindow) {
            mainWindow.focus();
            return;
        }

        mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            frame: false,
            transparent: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });

        mainWindow.loadFile('index.html');

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    };

    const createSmallWindow = (state = {}) => {
        const newWindow = new BrowserWindow({
            width: state.width || 300,
            height: state.height || 200,
            x: state.x,
            y: state.y,
            frame: false,
            transparent: true,
            resizable: true,
            alwaysOnTop: state.alwaysOnTop || false,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });

        newWindow.loadFile('small-window.html');

        const smallWindow = new SmallWindow(newWindow, state.color || 'rgba(255, 255, 255, 0.5)', state.alwaysOnTop, state.isLocked);

        newWindow.on('closed', () => {
            const index = smallWindows.indexOf(smallWindow);
            if (index > -1) {
                smallWindows.splice(index, 1);
            }
            updateMainWindow();
        });

        newWindow.on('move', () => {
            saveWindowState();
        });

        newWindow.on('resize', () => {
            saveWindowState();
        });

        smallWindows.push(smallWindow);
        updateMainWindow();
    };

    const updateMainWindow = () => {
        if (mainWindow) {
            mainWindow.webContents.send('update-small-windows', smallWindows.map((smallWindow, index) => ({
                id: index,
                alwaysOnTop: smallWindow.alwaysOnTop,
                color: smallWindow.color,
                isLocked: smallWindow.isLocked,
                x: smallWindow.window.getBounds().x,
                y: smallWindow.window.getBounds().y,
                width: smallWindow.window.getBounds().width,
                height: smallWindow.window.getBounds().height,
            })));
        }
    };

    const saveWindowState = () => {
        const state = smallWindows.map(smallWindow => ({
            alwaysOnTop: smallWindow.alwaysOnTop,
            color: smallWindow.color,
            isLocked: smallWindow.isLocked,
            x: smallWindow.window.getBounds().x,
            y: smallWindow.window.getBounds().y,
            width: smallWindow.window.getBounds().width,
            height: smallWindow.window.getBounds().height,
        }));
        fs.writeFileSync(stateFilePath, JSON.stringify(state));
    };

    const loadWindowState = () => {
        if (fs.existsSync(stateFilePath)) {
            const state = JSON.parse(fs.readFileSync(stateFilePath));
            state.forEach(createSmallWindow);
        } else {
            createSmallWindow();
        }
    };

    ipcMain.on('toggle-lock-window', (event, index) => {
        if (smallWindows[index]) {
            smallWindows[index].toggleLock();
            event.sender.send('lock-toggled', smallWindows[index].isLocked);
        }
    });

    ipcMain.on('delete-small-window', (event, index) => {
        if (smallWindows[index]) {
            smallWindows[index].close();
            smallWindows.splice(index, 1);
            event.sender.send('small-window-deleted', index);
        }
    });

    ipcMain.on('toggle-always-on-top', (event, index) => {
        if (smallWindows[index]) {
            smallWindows[index].toggleAlwaysOnTop();
            event.sender.send('always-on-top-toggled', index);
        }
    });

    ipcMain.on('change-background-color', (event, index, color) => {
        if (smallWindows[index]) {
            smallWindows[index].setColor(color);
        }
    });

    app.on('before-quit', () => {
        console.log("App is quitting, saving state...");
        saveWindowState();
    });

    createMainWindow();
    loadWindowState();
});

ipcMain.on('window-close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.on('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('toggle-transparency', (event, isTransparent) => {
    if (mainWindow) {
        if (isTransparent) {
            mainWindow.setBackgroundColor('#00000000');
            mainWindow.setOpacity(0.5);
        } else {
            mainWindow.setBackgroundColor('#ffffff');
            mainWindow.setOpacity(1.0);
        }
    }
});

app.on('window-all-closed', () => {});