import { computeAddress, ethers } from 'ethers';
import { DEXLWalletSigner } from './DEXLWalletSigner.ts';
import { DEXLWalletClient } from './DEXLWalletClient.ts';
import { DEXLAbstractWallet } from './AbstractWallet.ts';

export class DEXLWalletEVM extends DEXLAbstractWallet {
	constructor(public readonly client: DEXLWalletClient) {
		super(client, 'evm');
	}

	protected async getAddressFromPrivateKey(privateKey: Uint8Array) {
		const signingKey = new ethers.SigningKey(privateKey);
		const address = computeAddress(signingKey.publicKey);

		return address;
	}

	getEthersSigner(provider?: null | ethers.Provider) {
		if (!this.client.bundle) {
			throw new Error('Client bundle does not exist');
		}
		return new DEXLWalletSigner(this.client, provider);
	}
}