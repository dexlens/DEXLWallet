import { EventEmitter } from 'npm:eventemitter3';
import WebApp from 'npm:@twa-dev/sdk';
import { hmacSha256 } from './hmacSha256.ts';
import { hexToUint8Array } from './hexToUint8Array.ts';
import { uint8ArrayToHex } from './uint8ArrayToHex.ts';
import { IClientBundle, ClientBundleController } from './ClientBundle.ts';
import { AbstractStorage } from './AbstractStorage.ts';
import { TelegramCloudStorage } from './TelegramCloudStorage.ts';

const MAIN_ENDPOINT = 'https://api.dexlens.io';

export interface IDEXLWalletClientOptions {
	storage?: AbstractStorage;
	endpoint?: string;
	telegramInitData?: string;
}

export type DEXLWalletClientEvents = 'walletChanged';

export class DEXLWalletClient extends EventEmitter<DEXLWalletClientEvents> {
	private _bundle: IClientBundle | null = null;

	private readonly telegramInitData: string;
	public readonly storage: AbstractStorage;
	private readonly endpoint: string;
	private clientBundleController: ClientBundleController;

	constructor(public readonly projectPublicToken: string, options: IDEXLWalletClientOptions = {}) {
		super();
		this.endpoint = options.endpoint ?? MAIN_ENDPOINT;
		this.telegramInitData = options.telegramInitData || WebApp.initData;
		this.storage = options.storage ?? new TelegramCloudStorage();
		this.clientBundleController = new ClientBundleController(this.storage);
	}

	get isBundleExists() {
		return !!this._bundle;
	}

	get bundle() {
		return this._bundle;
	}

	async _init() {
		this._bundle = await this.clientBundleController.getClientBundle();
	}

	async _authenticate() {
		await this._init();
		if (!this._bundle) {
			await this._createBundle();
		}
	}

	private async _createBundle() {
		if (this._bundle) {
			throw new Error('Client bundle already exists');
		}
		this._bundle = await this.clientBundleController.createNewBundle();
	}

	async _storeWalletAddress(type: string, walletAddress: string) {
		await fetch(`${this.endpoint}/wallet/address`, {
			method: 'POST',
			body: JSON.stringify({
				type,
				projectPublicToken: this.projectPublicToken,
				telegramInitData: this.telegramInitData,
				walletAddress,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	async destroyBundleAndLoseWalletAccessForever() {
		await this.clientBundleController.clearClientBundle();
		this._bundle = null;
	}

	private async getIntermediaryKey(telegramInitData: string, clientPublicKey: Uint8Array): Promise<Uint8Array> {
		const response = await fetch(`${this.endpoint}/wallet/access`, {
			method: 'POST',
			body: JSON.stringify({
				projectPublicToken: this.projectPublicToken,
				telegramInitData,
				clientPublicKey: uint8ArrayToHex(clientPublicKey),
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const responseData = (await response.json()) as
			| {
					result: true;
					data: {
						intermediaryKey: string;
					};
			  }
			| {
					result: false;
					error: string;
			  };

		if (responseData.result) {
			const intermediaryKey = hexToUint8Array(responseData.data.intermediaryKey);
			return intermediaryKey;
		} else {
			throw new Error(responseData.error);
		}
	}

	private async restorePrivateKey(initData: string) {
		if (!this._bundle) {
			throw new Error('Client bundle does not exist');
		}

		const intermediaryKey = await this.getIntermediaryKey(initData, this._bundle.clientPublicKey);
		const privateKey = await hmacSha256(intermediaryKey, this._bundle.clientSecretKey);

		return privateKey;
	}

	async accessPrivateKey() {
		if (!this._bundle) {
			throw new Error('Client bundle does not exist');
		}

		const privateKey = await this.restorePrivateKey(this.telegramInitData);

		return privateKey;
	}

	async createBundle() {
		if (this._bundle) {
			throw new Error('Client bundle already exists');
		}
		this._bundle = await this.clientBundleController.createNewBundle();
	}
}