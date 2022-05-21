const { requests } = require('libgovno');

/**
 * It's a subtype of the UserInfo
 * @see https://api.monobank.ua/docs/index.html#tag/Kliyentski-personalni-dani/paths/~1personal~1client-info/get
 * @typedef {Object} UserInfoAccount
 * @property {string} id - Account identifier
 * @property {string} sendId - Not documentated
 * @property {number} balance - Account balance
 * @property {number} creditLimit - Account credit limit
 * @property {Array<string>} maskedPan - Account masked pen (not documentated)
 * @property {('black'|'white'|'platinum'|'iron'|'fop'|'yellow')} type - Account type
 * @property {number} currencyCode - Currency code (ISO 4217)
 * @property {('None'|'UAH'|'Miles')} cashbackType - Cashback type
 */

/**
 * It's a subtype of the UserInfo
 * @see https://api.monobank.ua/docs/index.html#tag/Kliyentski-personalni-dani/paths/~1personal~1client-info/get
 * @typedef {Object} UserInfoJar
 * @property {string} id - Jar indetifier
 * @property {string} sendId - https://send.monobank.ua/{sendId} service identifier
 * @property {string} title - Jar title
 * @property {string} description - Jar description
 * @property {number} currencyCode - Jar currency code (ISO 4217)
 * @property {number} balance - Jar balance
 * @property {number} goal - Jar's goal in the minimal currency amount
 */

/**
 * @see https://api.monobank.ua/docs/index.html#tag/Kliyentski-personalni-dani/paths/~1personal~1client-info/get
 * @typedef {Object} UserInfo
 * @property {string} clientId - Client identifier
 * @property {string} name - Client's name
 * @property {string} webHookUrl - New transaction notification url
 * @property {string} permissions - Client's permissions
 * @property {Array<UserInfoAccount>} accounts - Array of the client's accounts
 * @property {Array<UserInfoJar>} jars - Array of the client's jars
 */

/**
 * @see https://api.monobank.ua/docs/index.html#tag/Kliyentski-personalni-dani/paths/~1personal~1statement~1{account}~1{from}~1{to}/get
 * @typedef {Object} StatementItem
 * @property {string} id - Transaction identifier
 * @property {number} time - Unix time in seconds
 * @property {string} description - Transaction description
 * @property {number} mcc - Transaction Merchant Category Code (ISO 18245)
 * @property {number} originalMcc = Original Merchant Category Code (ISO 18245)
 * @property {boolean} hold - Authorization hold status
 * @property {number} amount - Transaction amount in the original currency in the minimal currency amount
 * @property {number} operationAmount - Transaction amount in the bank's currency (UAH) in the minimal currency amount
 * @property {number} currencyCode - Currency code (ISO 4217)
 * @property {number} commissionRate - Commision rate in the minimal currency amount
 * @property {number} cashbackAmount - Cashback amount in the minimal currency amount
 * @property {number} balance - Account balance in the minimal currency amount
 * @property {(string | undefined)} comment - Transaction comment
 * @property {(string | undefined)} receiptId - Receipt id for the check.gov.ua
 * @property {(stirng | undefined)} invoiceId - Invoide id (only on money transfer)
 * @property {string} counterEdrpou - EDRPOU of the counterparty
 * @property {string} counterIban - IBAN of the counterparty
 */

/**
 * @see https://api.monobank.ua/docs/index.html#tag/Publichni-dani/paths/~1bank~1currency/get
 * @typedef {Object} CurrencyInfo
 * @property {number} currencyCodeA - Currency code (ISO 4217)
 * @property {number} currencyCodeB - Currency code (ISO 4217)
 * @property {number} date - Unix time in seconds
 * @property {number} rateSell
 * @property {number} rateBuy
 * @property {number} rateCross
 */

class Monobank
{
    #token
    #base_uri
    #last_currency
    #last_info
    #last_statement
    
    /**
     * @description Monobank api constructor
     * @param {string | null} token - Access token (can be empty)
     * @param {string | null} base_uri
     */
    constructor(token, base_uri) {
        this.#token = token ?? null;
        this.#base_uri = base_uri ?? 'api.monobank.ua';
        this.#last_currency = {time: 0, data:null};
        this.#last_info = {time: 0, data:null};
        this.#last_statement = {time: 0, data:null};
    }

    /**
     * @param {string} method - HTTP request method
     * @param {string} path  - HTTP request path
     * @param {boolean} token - Should we use monobank token?
     * @param {object} data - JSON object data
     * @returns {Promise<Response>}
     * @throws Will throw on the request error
     */
    async method(method, path, token, data) {
        return await requests.request(`https://${this.#base_uri}${path}`, {
            method: method.toUpperCase(), 
            headers: {'X-Token': token === true && this.#token || ''},
            json: data
        });
    }

    #checkcache(obj, time, force) {
        const curtime = Math.floor(Date.now()/1000);
        const res = time == 0 || curtime - obj.time >= time || force;
        if (res)
            obj.time = curtime;
        return res;
    }

    /**
     * @see https://api.monobank.ua/docs/index.html#tag/Publichni-dani/paths/~1bank~1currency/get
     * @param {boolean | undefined} force - Force update (without cache)
     * @returns {Promise<Array<CurrencyInfo>>} Bank currency info
     */
    async currency(force) {
        if (this.#checkcache(this.#last_currency, 360, force))
            this.#last_currency.data = (await this.method('get', '/bank/currency', false)).json();

        return this.#last_currency.data;
    }

    /**
     * @see https://api.monobank.ua/docs/index.html#tag/Kliyentski-personalni-dani/paths/~1personal~1client-info/get
     * @param {boolean | undefined} force - Force update (without cache)
     * @returns {Promise<UserInfo>} - Client's user info
     */
    async client_info(force) {
        if (this.#checkcache(this.#last_info, 60, force))
            this.#last_info.data = (await this.method('get', '/personal/client-info', true)).json();

        return this.#last_info.data;
    }

    /**
     * @see https://api.monobank.ua/docs/index.html#tag/Kliyentski-personalni-dani/paths/~1personal~1webhook/post
     * @param {string} url - Webhook url
     * @returns {boolean}
     */
    async set_webhook(url) {
        return (await this.method('get', '/personal/webhook', true, {json:{"webHookUrl":url}})).status == 200;
    }
    
    /**
     * @see https://api.monobank.ua/docs/index.html#tag/Kliyentski-personalni-dani/paths/~1personal~1statement~1{account}~1{from}~1{to}/get
     * @param {string} account  - Client account id
     * @param {string | number | undefined} from - Unix time in seconds 
     * @param {string | number | undefined} to - Unix time in seconds
     * @param {boolean | undefined} force - Force update (without cache)
     * @returns {Promise<Array<StatementItem>>} - List of the statements 
     */
    async statement(account, from, to, force) {
        if (this.#checkcache(this.#last_statement, 60, force)) {
            from = from ?? (Math.floor(Date.now()/1000) - 2592000);
            to = to ?? '';
            this.#last_statement.data = (await this.method('get', `/personal/statement/${account}/${typeof(from) == 'string' && from || from.toString()}/${typeof(to) == 'string' && to || to.toString()}`, true)).json();
        }
        
        return this.#last_statement.data;
    }
}

module.exports.Monobank = Monobank;