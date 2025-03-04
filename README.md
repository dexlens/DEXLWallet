# DEXLWallet
Non-Custodial Wallet Using MPC Via Telegram

Built using Multi-Party Computation (MPC) technology, DEXLWallet provides a secure and seamless solution for developers to embed blockchain wallets directly into Telegram-based applications.

Most wallets available today are custodial, semi-custodial, or rely on your phone to stay functional—lose your phone, lose your wallet. DEXL Wallet is built differently.

Support for EVM and Solana Wallets

### How does it work?

1. We generate `ClientPublicKey` and `ClientSecretKey` 32-byte keys on the user's device and save them in the Telegram CloudStorage.
2. We send `ClientPublicKey` to the server along with Telegram-signed `initData` (current user's authorization data).
3. Server validates user's authorization (using new Telegram Ed25519-signature scheme) and checks second factor authentication (if it is enabled).
4. Then, server generates `IntermediaryKey` by signing (`ClientPublicKey` + `telegramUserId`) with `ServerSecretKey` (unique for your project).
5. Asymmetrically-encrypted `IntermediaryKey` is sent back to the device and decrypted.
6. Finally, `IntermediaryKey` is signed by `ClientSecretKey` and used as a `WalletPrivateKey`.

### Why?

1. **Secure by Design**: Neither our servers (nor yours), nor any third party (e.g., Telegram), have access to the user’s private key.
2. **As Seamless as Possible**: Designed specifically for Telegram Mini Apps, this wallet uses Telegram's frictionless mini-app authentication for effortless access.
3. **Truly Non-Custodial**: The user’s private key never leaves their device and only exists in memory for nanoseconds while signing transactions.
4. **Multi-Party Recovery**: Wallet recovery involves a six-step computational process using the user’s secret key stored in Telegram CloudStorage, a server-side secret key, and advanced cryptography (details in the footer).
5. **Open Source**: The code is fully auditable, ensuring complete transparency.
6. **Improved User Experience**: Whether on desktop or mobile, users logged into the same account can access the same wallet seamlessly.
7. **Familiar Interface**: DEXL Wallet supports ethers.js out of the box, so you can use it as a drop-in replacement for other wallets.
8. **No privacy compromises**: DEXL Wallet supports new Telegram Ed25519-signature scheme, so you don't need to give your bot token to us. We cryptographically validate user's authorization using Telegram Public Key and your public bot id.

### EVM Example
```javascript
import { ethers } from 'ethers';
const client = new DEXLWalletClient(myApiKey);
const evmWallet = new DEXLWalletEVM(client);
await evmWallet.authenticate(); // Automatically loads an existing user and wallet, or creates a new one if needed
console.log('Your wallet address: ', evmWallet.walletAddress);
const provider = new ethers.JsonRpcProvider();
const signer = evmWallet.getEthersSigner(provider); // Use DEXL Wallet seamlessly with ethers.js and any provider
const tx = await signer.sendTransaction({
	to: '0x...',
	value: ethers.parseEther('1'),
});
```

### Solana Example
```javascript
import {
	createSolanaRpc,
	createTransactionMessage,
	setTransactionMessageFeePayer,
	signTransaction,
} from '@solana/web3.js';

const client = new DEXLWalletClient(myApiKey);
const solanaWallet = new DEXLWalletSolana(client);
await solanaWallet.authenticate(); // Automatically loads an existing user and wallet, or creates a new one if needed
console.log('Your wallet address: ', solanaWallet.walletAddress);
const rpc = createSolanaRpc('https://api.devnet.solana.com'); // replace with your RPC
const signer = await solanaWallet.getSolanaSigner();
const transactionMessage = createTransactionMessage({ version: 0 });
const feePayerAddress = solanaWallet.walletAddress;
const transactionMessageWithFeePayer = setTransactionMessageFeePayer(feePayerAddress, transactionMessage);

// Attempting to sign the transaction message without a lifetime will throw a type error
const signedTransaction = await signTransaction([signer], transactionMessageWithFeePayer);
const txHash = await rpc.sendTransaction(signedTransaction);
```


