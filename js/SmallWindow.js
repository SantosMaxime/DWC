class SmallWindow {
    constructor(window, color = 'rgba(255, 255, 255, 0.5)', alwaysOnTop = false, isLocked = false) {
        this.window = window;
        this.color = color;
        this.alwaysOnTop = alwaysOnTop;
        this.isLocked = isLocked;

        // Set the default background color
        this.window.webContents.on('did-finish-load', () => {
            this.window.webContents.send('change-background-color', this.color);
            this.window.webContents.send('lock-changed', this.isLocked);
        });

        this.window.setAlwaysOnTop(this.alwaysOnTop);
        this.window.setResizable(!this.isLocked);
    }

    setColor(color) {
        this.color = color;
        this.window.webContents.send('change-background-color', color);
    }

    toggleAlwaysOnTop() {
        this.alwaysOnTop = !this.alwaysOnTop;
        this.window.setAlwaysOnTop(this.alwaysOnTop);
    }

    setLock(isLocked) {
        this.isLocked = isLocked;
        this.window.webContents.send('lock-changed', isLocked);
        this.window.setResizable(!isLocked);
    }

    toggleLock() {
        this.setLock(!this.isLocked);
    }

    close() {
        this.window.close();
    }
}

module.exports = SmallWindow;