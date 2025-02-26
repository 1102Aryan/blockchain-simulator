"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
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
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}
/**
 * Container for multiple transation similar to linked list
 */
class Block {
    /**
     *
     * @param prevHash link to previous hash
     * @param transaction the transaction class
     * @param ts the current time of the transaction
     */
    constructor(prevHash, transaction, ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        this.nonce = Math.round(Math.random() * 999999999);
    }
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
    mine(nonce) {
        let solution = 1;
        console.log('⛏️ mining...');
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substring(0, 4) === '0000') {
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
    addBlock(transaction, senderPublicKey, signature) {
        /**
         * Creates a signature verification
         * Check if it valid by using the senders public key and signature
         * Proof of work to remove double spend issue
         */
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}
/**
 * Creates a single instance of chain
 */
Chain.instance = new Chain();
/**
 * Securely sends coins
 */
class Wallet {
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
    sendMoney(amount, payeePublicKey) {
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
