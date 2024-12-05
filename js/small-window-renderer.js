const { ipcRenderer } = require('electron');

// Small window specific logic
ipcRenderer.on('lock-changed', (event, isLocked) => {
    const widget = document.getElementById('widget');
    const lockIcon = document.querySelector('.lock-icon');

    if (isLocked) {
        widget.classList.add('locked');
        lockIcon.classList.add('locked'); // Add locked class
    } else {
        widget.classList.remove('locked');
        lockIcon.classList.remove('locked'); // Remove locked class
    }
});

ipcRenderer.on('change-background-color', (event, color) => {
    const widget = document.getElementById('widget');
    widget.style.backgroundColor = color;
});