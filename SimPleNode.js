/**
 * A node in the network. Each node has a Unique Node List
 * that has its chosen validators on it. These will be the 
 * nodes that it "votes" for when transactions are compared.
 * 
 * Nodes are decentralized and send messages to each other
 * via network packets. This is meant to mimic a direct TCP
 * connection, instead of "shouting into the void" using 
 * broadcasting and events. 
 */
const SimPleNode = require('./SimPleNode');
const SimPleNetwork = require('./SimPleNetwork');
const SimPleChain = require('./SimPleChain');

module.exports = class SimPleNode {
    /* During voting, the nodes will approve transactions
    that appear on at least these proportions of their UNL's proposals 
    If more rounds are necessary to meet the threshold, there will be 
    an increment until the final acceptable level is reached */
    static INITIAL_THRESHOLD = 0.5;
    static STEP_UP_INC = 0.1;
    static FINAL_THRESHOLD = 0.8;

    constructor(addr) {
        this.addr = addr;
        this.unl = [];
        this.neighbors = new Map();
        this.ledger = new SimPleChain();
        this.pendingProposals = new Map();
        this.candidates = new Set();
        this.transactions = new Map();
        this.threshold = SimPleNode.INITIAL_THRESHOLD;
    }

    setUNL(nodeList) {
        this.unl = nodeList;
    }

    joinNetwork(network) {
        this.network = network;
    }

    addNeighbor(n) {
        if (this.neighbors.has(n.addr)) {
            console.log(`Nodes ${this.addr}, ${n.addr} already connected`);
            return;
        }
        this.neighbors.set(n.addr, n);
    }

    sendMessage(msg, to, type) {
        this.network.routeMessage(msg, this.addr, to, type);
    }

    receiveMessage(msg, addr, type) {
        // Nodes can receive transaction messages from other nodes
        switch (type) {
            case "TRANSACTION":
                if (!this.transactions.has(msg.id)) {
                    this.transactions.set(msg.id, msg);

                    // Gossip the message to the rest of the node's neighbors
                    for (let n of this.neighbors.keys()) {
                        if (n !== addr) {
                            this.sendMessage(msg, n, type);
                        }
                    }
                }
                break;
        // Nodes listen to transactions proposed by nodes on their UNL
            case "PROPOSAL":
                if (this.unl.includes(addr)) {
                    this.pendingProposals.set(addr, msg);
                }
        }
    }

    // When voting begins, send proposals to neighbors to vote on
    broadcastProposal() {
        let peerList = Array.from(this.candidates);
        for (const n of this.neighbors.keys()) {
            this.sendMessage(peerList, n, "PROPOSAL");
        }
    }

    prepareVoting() {
        this.threshold = SimPleNode.INITIAL_THRESHOLD;
        this.candidates = new Set(this.transactions.keys());
        this.broadcastProposal();
    }

    evaluate() {
        let votes = {};
        let advancing = new Set();
        for (let trx of this.candidates) {
            votes[trx] = 1;
        }
        for (let [node, proposals] of this.pendingProposals.entries()) {
            for (let trx of proposals) {
                votes[trx] = (votes[trx] || 0) + 1;
            }
        }
        for (let trx of this.candidates) {
            if (votes[trx] / this.unl.length >= this.threshold) {
                advancing.add(trx);
            }
        }
        this.candidates = advancing;
        if (this.threshold >= SimPleNode.FINAL_THRESHOLD) {
            this.consensus();
        } else {
            this.threshold = Math.round((this.threshold + SimPleNode.STEP_UP_INC) * 10) / 10;
            this.broadcastProposal();
        }
    }

    consensus() {
        const finalizedTrxs= Array.from(this.candidates).map(id => this.transactions.get(id));
        finalizedTrxs.sort((a, b) => a.id.localeCompare(b.id)); // ensure same order for hashing
        const approvedBlock = this.ledger.addBlock(finalizedTrxs);
        for (let trx of this.candidates) {
            this.transactions.delete(trx);
        }
        this.candidates.clear();
        this.pendingProposals.clear();
    }
}