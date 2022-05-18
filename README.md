#### Getting started
instal package from npm `npm install monobankua`
 
#### Quick example 
```js
const { Monobank } = require('monobankua');

const client = new Monobank(process.env.token);

(async () => {
  // Currency list
  const currency_list = await client.currency();
  
  // Client info
  const info = await client.client_info();
  
  // Webhook
  await client.set_webhook('https://example.com/');
  
  // Statement
  const statement = await client.statement((await client.client_info()).accounts[0].id);
})();
```

#### Available methods
• `client.currency(force)` - Bank currency info
   - force - Force update (without cache)

• `client.client_info()` - Client's user info

• `client.set_webhook(url)`
  - url - Webhook url

• `client.statement(account, from, to)`
  - account - Client account id
  - from - Unix time in seconds 
  - to - Unix time in seconds
