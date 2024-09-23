const http = require('http');
const url = require('url');

const Listeners = [];
const HTTPClient = http.createServer((req, res) => {
    const urlObj = url.parse(req.url, true);
    let listeners = Listeners.filter(listener => listener.key.pathname === urlObj.pathname && listener.key.method === req.method);
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        listeners.forEach(listener => listener.callback(req, res, urlObj, body));
        if(listeners.length === 0)
        {
            res.writeHead(404, {'Content-Type' : 'text/plain'});
            res.end('Page not found');
        }
    })
});
const AddListener = (path, callback, method = 'GET') => {
    Listeners.push({
        key: {
            pathname: path,
            method: method,
        },
        callback: callback,
    });
}

HTTPClient.listen(3000, () => {
    console.log('Booted up client');
});

module.exports = {
    HTTPClient: HTTPClient,
    AddListener: AddListener,
};