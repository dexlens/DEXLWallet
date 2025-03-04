export let randomBytes: (n: number) => Uint8Array;

(function () {
	let baseCrypto = typeof self !== 'undefined' ? self.crypto || (self as any).msCrypto : null;
	if (baseCrypto && typeof baseCrypto.getRandomValues === 'function') {
		const crypto = baseCrypto;
		// Browsers.
		const QUOTA = 65536;
		randomBytes = (n: number) => {
			const v = new Uint8Array(n);
			for (let i = 0; i < n; i += QUOTA) {
				crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
			}
			return v;
		};
	} else if (typeof require !== 'undefined') {
		// Node.js.
		const crypto = require('crypto');
		if (crypto && typeof crypto.randomBytes === 'function') {
			randomBytes = (n: number) => crypto.randomBytes(n);
		}
	}
})();