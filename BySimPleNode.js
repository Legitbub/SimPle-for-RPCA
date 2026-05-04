/**
 * The SimPleChain should be byzantine fault tolerant because of 
 * the consensus protocol. This class creates a node that intentionally
 * tries to cause a byzantine fault by making up and deleting 
 * transactions. The network does not need to know which nodes are 
 * the byzantine bad guys in order to achieve consensus as long as 
 * a supermajority of validators are trustworthy.
 */

const SimPleNode = require('./SimPleNode');

module.exports = class BySimPleNode extends SimPleNode {
    constructor(addr) {
        super(addr);
    }

    evaluate() {
        let advancing = new Set();
        
        // Maliciously ignore the UNL's actual votes.
        // Instead, randomly drop 50% of the legitimate transactions we currently have.
        for (let trx of this.candidates) {
            if (Math.random() > 0.5) { 
                advancing.add(trx);
            }
        }

        // Inject a fake, unverified transaction ID.
        // If the network is secure, the honest nodes should reject this.
        const fakeTxId = `BAD_TX_${this.addr}_${Math.floor(Math.random() * 1000)}`;
        advancing.add(fakeTxId);

        this.candidates = advancing;

        // Pretend to play along with the network rounds so peers don't 
        // immediately disconnect from us for breaking the timer rules.
        if (this.threshold >= SimPleNode.FINAL_THRESHOLD) {
            this.consensus();
        } else {
            this.threshold = Math.round((this.threshold + SimPleNode.STEP_UP_INC) * 10) / 10;
            this.broadcastProposal();
        }
    }
}