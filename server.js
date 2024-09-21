import http from 'http';
import url from 'url';

const Listeners = [];
export const HTTPClient = http.createServer((req, res) => {
    const urlObj = url.parse(req.url, true);

    for(let listener of Listeners)
    {
        if(listener.key.pathname === urlObj.pathname && listener.key.method === req.method)
        {
            listener.callback(req, res);
        }
    }
});
export const AddListener = (path, callback, method = 'GET') => {
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