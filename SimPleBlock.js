/**
 * A class representing a block on the SimPleChain. Blocks
 * hold transaction data as well as the hash of the previous 
 * block for on-chain verification.
 */

const crypto = require('crypto');

module.exports = class SimPleBlock {
    constructor(index, transactions, previousHash) {
        this.index = index;
        this.timestamp = Date.now();
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        const data = this.index + this.previousHash + JSON.stringify(this.transactions);
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}