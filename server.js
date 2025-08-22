const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5501;
const HOST = '0.0.0.0';

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static(path.join(__dirname, 'page')));

app.use('/Styles', express.static(path.join(__dirname, 'Styles')));

app.use('/code', express.static(path.join(__dirname, 'code')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'page', 'index.html'));
});

app.get('/status', (req, res) => {
    res.json({ 
        status: 'running', 
        timestamp: new Date().toISOString(),
        port: PORT,
        host: HOST
    });
});

function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = {};
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {   
                    results[name] = [];
                }
                results[name].push(net.address);                                                             
            }
        }
    }
    
    for (const name of Object.keys(results)) {
        if (results[name].length > 0) {
            return results[name][0];
        }
    }
    return 'No se encontró IP local';
}

app.listen(PORT, HOST, () => {
    const localIP = getLocalIP();
    
    console.log('🚀 Servidor iniciado!');
    console.log('📱 Acceso local: http://' + localIP + ':' + PORT);
    console.log('🌐 Acceso desde otros dispositivos: http://' + localIP + ':' + PORT);
    console.log('-'.repeat(60));
});

process.on('SIGINT', () => {
    console.log('\n🛑 Servidor detenido');
    process.exit(0);
});
