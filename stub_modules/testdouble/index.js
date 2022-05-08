const stub = new Proxy(() => stub, {
    get() { return stub },
    set() { },
    has() { return true },
})
module.exports = stub