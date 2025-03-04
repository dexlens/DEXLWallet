import { AbstractStorage } from './AbstractStorage.ts';
import { randomBytes } from './randomBytes.ts';
import { hexToUint8Array } from './hexToUint8Array.ts';
import { uint8ArrayToHex } from './uint8ArrayToHex.ts';

export interface IClientBundle {
	timestamp: number;
	clientPublicKey: Uint8Array;
	clientSecretKey: Uint8Array;
}

export class ClientBundleController {
	constructor(private readonly storage: AbstractStorage) {
		//
	}

	async getClientBundle(): Promise<IClientBundle | null> {
		const values = await this.storage.getItems([
			'dexl_registered_at',
			'dexl_client_public_key',
			'dexl_client_secret_key',
		]);
		if (!values || typeof values !== 'object') {
			return null;
		}
		const { dexl_registered_at, dexl_client_public_key, dexl_client_secret_key } = values;
		if (
			typeof dexl_registered_at !== 'string' ||
			typeof dexl_client_public_key !== 'string' ||
			typeof dexl_client_secret_key !== 'string'
		) {
			return null;
		}
		if (dexl_client_public_key.length !== 64 || dexl_client_secret_key.length !== 64) {
			return null;
		}
		const timestamp = Number(dexl_registered_at);
		if (isNaN(timestamp) || timestamp <= 0) {
			return null;
		}
		return {
			timestamp,
			clientPublicKey: hexToUint8Array(dexl_client_public_key),
			clientSecretKey: hexToUint8Array(dexl_client_secret_key),
		};
	}

	async createNewBundle(): Promise<IClientBundle> {
		const clientPublicKey = randomBytes(32);
		const clientSecretKey = randomBytes(32);

		const clientPublicKeyHex = uint8ArrayToHex(clientPublicKey);
		const clientSecretKeyHex = uint8ArrayToHex(clientSecretKey);

		const timestamp = Date.now();

		await this.storage.setItems({
			dexl_registered_at: timestamp.toString(),
			dexl_client_public_key: clientPublicKeyHex,
			dexl_client_secret_key: clientSecretKeyHex,
		});

		return {
			timestamp,
			clientPublicKey,
			clientSecretKey,
		};
	}

	async clearClientBundle() {
		await this.storage.removeItems(['dexl_registered_at', 'dexl_client_public_key', 'dexl_client_secret_key']);
	}
}