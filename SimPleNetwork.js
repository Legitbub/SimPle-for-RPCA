/**
 * This network class registers and connects nodes. I decided 
 * to have the nodes themselves send messages to make the simulation
 * of a peer-to-peer network more realistic. The network will route
 * messages to intended recipients, and the messages will propagate 
 * peer to peer from there.
 */

module.exports = class SimPleNetwork {
    constructor() {
        this.nodes = new Map();
    }

    register(nodes) {
        for (const node of nodes) {
            this.nodes.set(node.addr, node);
            node.joinNetwork(this);
        }
    }

    connectP2P(node1, node2) {
        let n1 = this.nodes.get(node1);
        let n2 = this.nodes.get(node2);
        if (n1 && n2) {
            n1.addNeighbor(n2);
            n2.addNeighbor(n1);
            console.log(`Nodes ${node1} and ${node2} connected`);
        } else {
            console.error("One of the peer nodes is undefined");
        }
    }

    /* The network will relay one node's message to one recipient
    at a time. Nodes can actually make a direct TCP connection 
    without a 'Network' class, but for the purposes of this 
    simulation, the data will simply be routed this way.*/

    routeMessage(msg, from, to, type) {
        const receiver = this.nodes.get(to);
        if (receiver) {
            const netMsg = JSON.parse(JSON.stringify(msg));
            receiver.receiveMessage(netMsg, from, type);
        } else {
            console.error(`Node at address ${to} failed to receive message`);
        }
    }
}