const {Server, AddListener } = require('./server.js');

const OpenAI = require('openai');
const openai = new OpenAI();

AddListener('/webhook', (req, res, urlObj) => {
    res.writeHead(200, { 'Content-Type' : 'text/plain' });
    res.end('This is working!');
});

AddListener('/chatbot', async (req, res, urlObj) => {
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