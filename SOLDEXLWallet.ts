import { DEXLWalletClient } from './DEXLWalletClient.ts';
import { DEXLAbstractWallet } from './AbstractWallet.ts';
import {
	createKeyPairFromPrivateKeyBytes,
	createSignerFromKeyPair,
	createSolanaRpc,
	getAddressFromPublicKey,
} from 'npm:@solana/web3.js';

export class TMAWalletSolana extends DEXLAbstractWallet {
	constructor(public readonly client: DEXLWalletClient) {
		super(client, 'solana');
	}

	protected async getAddressFromPrivateKey(privateKey: Uint8Array) {
		const keyPair = await createKeyPairFromPrivateKeyBytes(privateKey);
		const walletAddress = await getAddressFromPublicKey(keyPair.publicKey);

		return walletAddress;
	}

	async getSolanaSigner() {
		const privateKey = await this.client.accessPrivateKey();
		const keyPair = await createKeyPairFromPrivateKeyBytes(privateKey);
		const signer = await createSignerFromKeyPair(keyPair);
		return signer;
	}
}