import * as crypto from 'crypto';

/**
 * Handles any transaction
 */
class Transaction {
    /**
     * 
     * @param amount amount to transfer denominated by the type i.e. Bitcoin
     * @param payer the person who is paying
     * @param payee the person who is receiving the payment
     */
    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ) {}

    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Container for multiple transation similar to linked list
 */
class Block {
    public nonce = Math.round(Math.random() * 999999999);

    /**
     * 
     * @param prevHash link to previous hash
     * @param transaction the transaction class 
     * @param ts the current time of the transaction
     */
    constructor(
        public prevHash: string | null,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    /**
     * Gets the hash and stringify it 
     * Creates a hash of the string version
     * Set it to a hexadecimal string
     */
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

/**
 * Linked list of blocks
 */
class Chain {
    /**
     * Creates a single instance of chain
     */
    public static instance = new Chain();
    chain: Block[];

    /**
     * Creates the first block in the chain, sending 100 coins from Genesis to Beb
     */
    constructor() {
        this.chain = [new Block(null, new Transaction(100, 'Genesis', 'Beb'))];
    }

    /**
     * Getter to grab the last block from the chain
     */
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Attempt to find a number, when added to nonce will have 4 0s
     * @param nonce one time use randome value
     * @returns the solution
     */
    mine(nonce: number) {
        let solution = 1;
        console.log('⛏️ mining...');
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substring(0,4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
    /**
     * Adds the block to the chain
     * @param transaction takes the transaction
     * @param senderPublicKey the public key of the sender
     * @param signature signature to verify
     */
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        /**
         * Creates a signature verification
         * Check if it valid by using the senders public key and signature
         * Proof of work to remove double spend issue
         */
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}

/**
 * Securely sends coins 
 */
class Wallet {
    public publicKey: string;
    public privateKey: string;

    /**
     * Format enconding as string 
     */
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, 
        });

        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    } 

    /**
     * Send money to the user
     * @param amount the amount you want to send
     * @param payeePublicKey public key of payee
     */
    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        /**
         * Like creating a one time passcode to verify the identity
         * Passing to the addBlock
         */
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

// Usage
const beb = new Wallet();
const nakamoto = new Wallet();
const vitalik = new Wallet();

nakamoto.sendMoney(50, beb.publicKey);
vitalik.sendMoney(23, beb.publicKey);
beb.sendMoney(1, nakamoto.publicKey);

console.log(Chain.instance);
