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
• `client.currency(force?: boolean | undefined)` - Bank currency info
   - force - Force update (without cache)

• `client.client_info(force?: boolean)` - Client's user info
  - force - Force update (without cache)

• `client.set_webhook(url: string)`
  - url - Webhook url

• `client.statement(account: string, from?: string | number , to?: string | number, force?: boolean)`
  - account - Client account id
  - from - Unix time in seconds (default is current time - 30days)
  - to - Unix time in seconds
  - force - Force update (without cache)
