/**
 * This class simulates the blockchain ledger that each node has 
 * a copy of. If the consensus works, nodes should end up with the 
 * same results despite independently validating their ledgers. 
 */

const SimPleBlock = require('./SimPleBlock');

module.exports = class SimPleChain {
    constructor() {
        this.ledger = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        return new SimPleBlock(0, "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.ledger[this.ledger.length - 1];
    }

    addBlock(transactions) {
        const previousBlock = this.getLatestBlock();
        const newBlock = 
            new SimPleBlock(previousBlock.index + 1, transactions, previousBlock.hash);
        this.ledger.push(newBlock);
        return newBlock;
    }

    // A node can use this to verify its own history hasn't been corrupted
    isChainValid() {
        for (let i = 1; i < this.ledger.length; i++) {
            const currentBlock = this.ledger[i];
            const previousBlock = this.ledger[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) return false;
            if (currentBlock.previousHash !== previousBlock.hash) return false;
        }
        return true;
    }
}