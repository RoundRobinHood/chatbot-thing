const {HTTPClient, AddListener} = require('./server.js');
const fs = require('fs');
const https = require('https');

const OpenAI = require('openai');
const openai = new OpenAI();

AddListener('/webhook', (req, res, urlObj, body) => {
    res.writeHead(200, { 'Content-Type' : 'text/plain' });
    res.end('This is working!');
});
AddListener('/webhook', async (req, res, urlObj, body) => {
    const data = JSON.parse(body);
    fs.writeFileSync('received.json', body);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('EVENT RECEIVED');
    if(!process.env.UAZAPI_API_KEY || !process.env.UAZAPI_INSTANCE)
    {
        res.end('Environment variable(s) missing for UAZAPI API');
        return;
    }
    if(data.apikey !== process.env.UAZAPI_API_KEY)
    {
        res.end("Mismatched API event key");
        return;
    }
    switch(data.event)
    {
        case 'messages.upsert':
        {
            if(data.data.message_normalized.key.fromMe)
                break;
            const pushname = data.data.pushName, text = data.data.message_normalized.text, number = data.data.message_normalized.key.remoteJid.split('@')[0];
            let conversation = [];
            if(!fs.existsSync('conversations'))
                fs.mkdirSync('conversations');
            const filePath = `conversations/${number}.json`;
            const maxConversationLength = process.env.CONTEXT_LENGTH ?? 5;
            if(fs.existsSync(filePath))
                conversation = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            conversation.push({role: 'user', content: text});
            if(conversation.length > maxConversationLength)
                conversation.splice(0, conversation.length - maxConversationLength);
            const SystemContext = (fs.existsSync('systemcontext.txt') && fs.readFileSync('systemcontext.txt', 'utf8')) || 'You are a helpful assistant integrated into WhatsApp.';
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {role: 'system', content: SystemContext},
                    ...conversation
                ],
            });
            const response = completion.choices[0].message.content;
            fs.appendFileSync('responses.log', '===\n' + response + '\n');
            conversation.push({role: 'assistant', content: response});
            fs.writeFileSync(filePath, JSON.stringify(conversation));
            const bd = JSON.stringify({
                number: number,
                textMessage: {
                    text: response,
                },
                options: {
                    delay: 200,
                    linkPreview: false,
                    changeVariables: true,
                }
            });
            const state = await fetch(`https://server01.uazapi.dev/message/sendText/${process.env.UAZAPI_INSTANCE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: process.env.UAZAPI_API_KEY,
                },
                body: bd
            }).then(response => response.text());
            fs.writeFileSync('status.json', state);
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