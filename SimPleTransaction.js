/**
 * A SimPle transaction with a from address, to address,
 * and amount of tokens sent.
 */

module.exports = class SimPleTransaction {
    constructor(from, to, amount) {
        // Make a random ID, even if transactions are generated
        // at the same time
        this.id = Date.now() + "_" + Math.random().toString(36).substr(2, 5);;
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    // Convert the object to a string for network transit or hashing
    serialize() {
        return JSON.stringify(this);
    }

    // Rebuild the object when a node receives it from the network
    static deserialize(jsonString) {
        const data = JSON.parse(jsonString);
        let tx = new SimPleTransaction(data.from, data.to, data.amount);
        tx.id = data.id; // Override the newly generated ID with the real one
        return tx;
    }
}