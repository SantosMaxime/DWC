const { ipcRenderer } = require('electron');
const Pickr = require('@simonwep/pickr');

ipcRenderer.on('update-small-windows', (event, windows) => {
    const list = document.getElementById('small-windows-list');
    list.innerHTML = ''; // Clear the list

    if (windows.length === 0) {
        list.innerHTML = '<div class="empty-list">No small windows</div>';
    } else {
        windows.forEach((win, index) => {
            const item = document.createElement('div');
            item.className = 'window-item';
            item.innerHTML = `
                <span>Window ${index + 1}</span>
                <div id="color-picker-${index}"></div>
                <div>
                    <button onclick="toggleAlwaysOnTop(${index})">Toggle Always On Top</button>
                    <i id="lock-icon-${index}" class="fas fa-lock${win.isLocked ? '' : '-open'} lock-icon ${win.isLocked ? 'locked' : ''}" onclick="toggleLock(${index})"></i>
                    <i class="fas fa-trash delete-icon" onclick="deleteWindow(${index})"></i>
                </div>
            `;
            list.appendChild(item);

            const pickr = Pickr.create({
                el: `#color-picker-${index}`,
                theme: 'classic',
                default: win.color,
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: {
                        input: true,
                        save: true
                    }
                }
            });

            pickr.on('save', (color) => {
                const rgbaColor = color.toRGBA().toString();
                ipcRenderer.send('change-background-color', index, rgbaColor);
            });
        });
    }
});

function toggleLock(index) {
    ipcRenderer.send('toggle-lock-window', index);
    ipcRenderer.once('lock-toggled', (event, isLocked) => {
        const lockIcon = document.getElementById(`lock-icon-${index}`);
        if (isLocked) {
            lockIcon.classList.remove('fa-lock-open');
            lockIcon.classList.add('fa-lock', 'locked');
        } else {
            lockIcon.classList.remove('fa-lock', 'locked');
            lockIcon.classList.add('fa-lock-open');
        }
    });
}

function deleteWindow(index) {
    ipcRenderer.send('delete-small-window', index);
}

function toggleAlwaysOnTop(index) {
    ipcRenderer.send('toggle-always-on-top', index);
}

document.getElementById('close-button').addEventListener('click', () => {
    ipcRenderer.send('window-close');
});

document.getElementById('minimize-button').addEventListener('click', () => {
    ipcRenderer.send('window-minimize');
});

document.getElementById('maximize-button').addEventListener('click', () => {
    ipcRenderer.send('window-maximize');
});

document.getElementById('transparent-theme').addEventListener('click', () => {
    ipcRenderer.send('toggle-transparency', true);
});

document.getElementById('default-theme').addEventListener('click', () => {
    ipcRenderer.send('toggle-transparency', false);
});

document.getElementById('home-button').addEventListener('click', () => {
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('small-windows-page').style.display = 'none';
});

document.getElementById('small-windows-button').addEventListener('click', () => {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('small-windows-page').style.display = 'block';
});