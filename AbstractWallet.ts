import { WalletBundleController } from './WalletBundle.ts';
import { DEXLWalletClient } from './DEXLWalletClient.ts';

export abstract class DEXLAbstractWallet {
	protected walletBundleController: WalletBundleController;
	protected lastReportedWalletAddress: string | null = null;
	protected _walletAddress: string | null = null;

	constructor(public readonly client: DEXLWalletClient, public readonly type: string) {
		this.walletBundleController = new WalletBundleController(type, client.storage);
	}

	protected abstract getAddressFromPrivateKey(privateKey: Uint8Array): Promise<string>;

	async _init() {
		if (this.client.bundle) {
			this._walletAddress = await this.walletBundleController.getWalletAddress(
				this.client.bundle.clientPublicKey,
			);
		} else {
			this._walletAddress = null;
		}
	}

	private async _initWallet() {
		if (!this.client.bundle) {
			throw new Error('Client bundle does not exist');
		}

		const privateKey = await this.client.accessPrivateKey();
		const walletAddress = await this.getAddressFromPrivateKey(privateKey);

		await this.walletBundleController.storeWalletAddress(this.client.bundle.clientPublicKey, walletAddress);
		this._walletAddress = walletAddress;

		try {
			await this.client._storeWalletAddress(this.type, walletAddress);
		} catch (error) {
			console.warn('Error reporting wallet address: ', error);
		}
	}

	private _checkStateChanged() {
		if (this.lastReportedWalletAddress !== this._walletAddress) {
			this.lastReportedWalletAddress = this._walletAddress;
			this.client.emit('walletChanged', this._walletAddress);
		}
	}

	get state() {
		if (!this.client.bundle) {
			return { registered: false, walletAddress: null } as const;
		} else {
			console.log('state.walletAddress: ', this._walletAddress);
			return { registered: true, walletAddress: this._walletAddress } as const;
		}
	}

	get walletAddress() {
		return this._walletAddress;
	}

	async init() {
		await this.client._init();
		await this._init();
		this._checkStateChanged();
		return this.state;
	}

	async authenticate() {
		await this.client._authenticate();
		await this._init();
		if (!this._walletAddress) {
			await this._initWallet();
		}
		this._checkStateChanged();
		return this.state;
	}

	async initWallet() {
		await this._initWallet();
		this._checkStateChanged();
		return this.state;
	}

	async clearLocalWalletAddress() {
		await this.walletBundleController.clearWalletAddress();
		this._walletAddress = null;
		this._checkStateChanged();
		return this.state;
	}
}