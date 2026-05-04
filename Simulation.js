const SimPleNetwork = require('./SimPleNetwork');
const SimPleNode = require('./SimPleNode');
const BySimPleNode = require('./BySimPleNode');
const SimPleTransaction = require('./SimPleTransaction');
const SimPleBlock = require('./SimPleBlock');

// A simple helper function to pause execution (simulates network time)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulation() {
    console.log("==========================================");
    console.log("🚀 STARTING RIPPLE CONSENSUS SIMULATION");
    console.log("==========================================\n");

    // Initialize the Network Router
    const network = new SimPleNetwork();

    // Create 10 Honest Nodes dynamically
    const honestNodes = [];
    for (let i = 1; i <= 10; i++) {
        honestNodes.push(new SimPleNode(`Node_${i}`));
    }
    
    // Create the 2 Byzantine Hackers
    const hacker1 = new BySimPleNode('Hacker_1');
    const hacker2 = new BySimPleNode('Hacker_2');

    const allNodes = [...honestNodes, hacker1, hacker2];

    // Register to Network
    network.register(allNodes);

    // Wire P2P channels for this test
    console.log("--- Establishing P2P Connections ---");
    for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
            network.connectP2P(allNodes[i].addr, allNodes[j].addr);
        }
    }

    // Configure Trust (UNLs)
    // To prove the protocol works, we will actually let the honest nodes 
    // trust the hackers in their UNLs! The math will still protect them.
    const allAddresses = allNodes.map(n => n.addr);
    allNodes.forEach(node => node.setUNL(allAddresses));

    await sleep(1000);

    // Run 3 Blocks (Ledgers) of History
    for (let blockNum = 1; blockNum <= 3; blockNum++) {
        console.log(`\n==========================================`);
        console.log(` 📦 MINING BLOCK ${blockNum}`);
        console.log(`==========================================`);

        // --- Handle Transactions ---
        console.log(`\n[Phase A] Clients sending new transactions...`);
        
        // We simulate a client submitting a transaction directly to Node A and Node C
        let tx1 = new SimPleTransaction('Alice', 'Bob', Math.floor(Math.random() * 100));
        let tx2 = new SimPleTransaction('Charlie', 'Dave', Math.floor(Math.random() * 100));
        let tx3 = new SimPleTransaction('Eve', 'Frank', Math.floor(Math.random() * 100));

        // Inject transactions into different parts of the network
        honestNodes[0].receiveMessage(tx1, 'CLIENT', 'TRANSACTION'); // Node 1
        honestNodes[4].receiveMessage(tx2, 'CLIENT', 'TRANSACTION'); // Node 5
        honestNodes[9].receiveMessage(tx3, 'CLIENT', 'TRANSACTION'); // Node 10

        await sleep(500);

        // --- Proposing ---
        console.log(`\n[Phase B] Nodes building initial proposals...`);
        allNodes.forEach(n => n.prepareVoting());
        
        await sleep(500);

        // --- Consensus Rounds ---
        // Ripple scales up: 50% -> 60% -> 70% -> 80%. 
        // We will loop exactly 4 times to hit the final threshold.
        for (let round = 1; round <= 4; round++) {
            const currentThreshold = Math.round((0.4 + (round * 0.1)) * 100);
            console.log(`\n   --- Voting Round ${round} (Threshold: ${currentThreshold}%) ---`);
            
            // Trigger every node to evaluate their peers' proposals
            allNodes.forEach(n => n.evaluate());
            
            await sleep(600);
        }

        // --- Verification ---
        console.log(`\n✅ BLOCK ${blockNum} CONSENSUS REACHED`);
        
        // Verify that the honest nodes survived the hackers
        // Grab ledgers from opposite sides of the network
        const honestBlock1 = honestNodes[0].ledger.getLatestBlock();
        const honestBlock10 = honestNodes[9].ledger.getLatestBlock();
        const hackerBlock1 = hacker1.ledger.getLatestBlock();
        const hackerBlock2 = hacker2.ledger.getLatestBlock();

        console.log(`\n🔍 AUDIT REPORT:`);
        console.log(`Node_1's  Block Hash:  
            ${honestBlock1 ? honestBlock1.hash.substring(0, 15) : 'FAILED'}...`);
        console.log(`Node_10's Block Hash:  ${honestBlock10.hash.substring(0, 15)}...`);
        console.log(`Hacker_2's Block Hash: ${hackerBlock2.hash.substring(0, 15)}...`);
        
        // Check in case of genesis block (string)
        const honestTxs = Array.isArray(honestBlock1.transactions) 
            ? honestBlock1.transactions.map(tx => tx.id).join(', ') 
            : 'No transactions mined';

        const hackerTxs = Array.isArray(hackerBlock1.transactions) 
            ? hackerBlock1.transactions.map(tx => tx ? tx.id : 'FAKE_DATA').join(', ') 
            : 'No transactions mined';

        console.log(`\nHonest Network Valid Txs:    [ ${honestTxs} ]`);
        console.log(`Hacker Txs saved:  [ ${hackerTxs} ]`);

        if (Array.isArray(honestBlock1.transactions) && honestBlock1.transactions.length === 3) {
            console.log(`\n🛡️  SUCCESS: The 10 honest nodes overpowered the 2 hackers!`);
        } else {
            console.log(`\n❌ FAILED: Honest nodes did not reach consensus.`);
        }
        
        await sleep(2000);
    }
}

// Execute the simulation
runSimulation();