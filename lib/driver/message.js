const axios = require('axios').default;
const runtime = require('./runtime');

async function send (to, message, type) {
    try {
        const resp = await axios.put(runtime.url('local/message'), {to, message, type});
        return resp.data;
    }
    catch(e) {
        return e.response.data;
    }
}

module.exports = {
    send,
};