import {AddListener} from './server.js';

AddListener('/webhook', (req, res) => {
    res.writeHead(200, { 'Content-Type' : 'text/plain' });
    res.end('This is working!');
});