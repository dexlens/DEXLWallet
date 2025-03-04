import { simpleHash } from './simpleHash.ts';
import { AbstractStorage } from './AbstractStorage.ts';

export class WalletBundleController {
	constructor(public readonly type: string, private readonly storage: AbstractStorage) {
		//
	}

	private get key() {
		return `dexl_wallet_address_${this.type}`;
	}

	async getWalletAddress(clientPublicKey: Uint8Array) {
		const walletData = await this.storage.getItem(this.key);
		if (walletData) {
			const [publicKeyHash, walletAddress] = walletData.split('|$|');
			const hash = simpleHash(clientPublicKey).toString(16);
			if (publicKeyHash === hash) {
				return walletAddress;
			}
		}
		return null;
	}

	async storeWalletAddress(clientPublicKey: Uint8Array, walletAddress: string) {
		const hash = simpleHash(clientPublicKey).toString(16);
		await this.storage.setItem(this.key, `${hash}|$|${walletAddress}`);
	}

	async clearWalletAddress() {
		await this.storage.removeItem(this.key);
	}
}