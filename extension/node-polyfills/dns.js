
function isIPv6(addr) {
    return addr.indexOf(':') > -1;
}

async function lookup(host, options, cb) {
    if (!cb) {
        cb = options;
        options = {};
    }
    try {
        const result = (await browser.dns.resolve(host)).addresses;
        if (all) {
            cb(null, result.map(address => ({ address, family: isIPv6(address) ? 6 : 4 })));
        } else {
            cb(null, result, isIPv6(result));
        }
    } catch (e) {
        cb(e);
    }
}

async function resolve4(hostname, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    const address = (await browser.dns.resolve(hostname)).addresses[0];
    callback(null, address);
}

async function resolve6(hostname, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    const address = (await browser.dns.resolve(hostname)).addresses[0];
    callback(null, address);
}

async function resolveAny(hostname, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    const address = (await browser.dns.resolve(hostname)).addresses[0]
    callback(null, address.map(addr => ({ address: addr })));
}

function resolve(hostname, rrtype, callback) {
    if (!callback) {
        callback = rrtype;
        rrtype = 'A';
    }
    const returnFirstResult = (err, r) => callback(err, r && r[0]);
    switch(rrtype) {
        case 'A':
            resolve4(hostname, returnFirstResult);
            break;
        case 'AAAA':
            resolve6(hostname, returnFirstResult);
            break;
        case 'ANY':
            resolveAny(hostname, returnFirstResult);
            break;
    }
}

module.exports = {
    resolve,
    lookup,
    resolveAny,
    resolve4,
    resolve6,
};
