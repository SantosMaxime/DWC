const { ipcMain, shell } = require('electron');
const querystring = require('querystring');
const axios = require('axios');

const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const redirectUri = 'http://localhost:8888/callback';
const scopes = 'user-read-private user-read-email';

let accessToken = null;

ipcMain.on('connect-to-spotify', (event, index) => {
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
    })}`;
    shell.openExternal(authUrl);
});

ipcMain.on('spotify-auth-callback', async (event, code) => {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        accessToken = response.data.access_token;
        event.sender.send('spotify-auth-success', accessToken);
    } catch (error) {
        event.sender.send('spotify-auth-failure', error.message);
    }
});