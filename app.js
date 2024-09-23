const {HTTPClient, AddListener} = require('./server.js');
const fs = require('fs');
const https = require('https');

const OpenAI = require('openai');
const openai = new OpenAI();

AddListener('/webhook', (req, res, urlObj, body) => {
    res.writeHead(200, { 'Content-Type' : 'text/plain' });
    res.end('This is working!');
});
AddListener('/webhook', (req, res, urlObj, body) => {
    const data = JSON.parse(body);
    if(!process.env.UAZAPI_API_KEY || !process.env.UAZAPI_INSTANCE)
    {
        console.error("Environment variable(s) missing for UAZAPI API");
        return;
    }
    if(data.apikey !== process.env.UAZAPI_API_KEY)
    {
        console.error("Mismatched API event key");
        return;
    }
    switch(data.event)
    {
        case 'messages.upsert':
        {
            const pushname = data.data.pushName, text = data.data.message_normalized.text, number = data.data.number;
            const bd = JSON.stringify({
                number: number,
                textMessage: {
                    text: `Hi ${pushname}!`,
                },
                options: {
                    delay: 200,
                    linkPreview: false,
                    changeVariables: true,
                }
            });
            const req = https.request({
                hostname: 'server01.uazapi.dev',
                port: 443,
                path: `/message/sendText/${process.env.UAZAPI_INSTANCE}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: process.env.UAZAPI_API_KEY,
                    'Content-Length': bd.length,
                },
            }, (res) => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk.toString();
                });
                res.on('end', () => console.log(data));
            });
            req.write(bd);
            req.end();

            // fetch(`https://server01.uazapi.dev/message/sendText/${process.env.UAZAPI_INSTANCE}`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         apikey: process.env.apikey,
            //     },
            //     body: JSON.stringify({
            //         number: number,
            //         textMessage: {
            //             text: `Hi ${pushname}!`,
            //         },
            //         options: {
            //             delay: 200,
            //             linkPreview: false,
            //             changeVariables: true,
            //         }
            //     })
            // });
            let list = [];
            if(fs.existsSync('messages.json'))
                list = JSON.parse(fs.readFileSync('messages.json'), 'utf8');
            list.push({name: pushname, text: text, number: number});
            fs.writeFileSync('messages.json', JSON.stringify(list));
        } break;
    }
}, 'POST')

AddListener('/chatbot', async (req, res, urlObj, body) => {
    const message = urlObj.query['prompt'];
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {role: "system", content: "You are a helpful assistant."},
            {role: "user", content: message},
        ],
    });
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(completion.choices[0].message.content);
});