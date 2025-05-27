import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Make an API request to Bitrix24.
 */
export async function bitrixApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	option: IDataObject = {},
): Promise<any> {
	const authenticationMethod = this.getNodeParameter('authentication', 0) as string;
	const isOAuth2 = authenticationMethod === 'bitrixOAuth2Api';
	const credentials = await this.getCredentials(authenticationMethod);

	const baseUrl = isOAuth2
		? `https://${credentials.domain}/rest`
		: credentials.webhookUrl.toString().replace(/\/$/, '');

	const uri = `${baseUrl}/${endpoint}.json`;

	const options: IRequestOptions = {
		method,
		uri,
		json: true,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json; charset=utf-8',
		},
		body,
		qs,
	};

	if (!Object.keys(body || {}).length) {
		delete options.body;
	}
	if (!Object.keys(qs || {}).length) {
		delete options.qs;
	}

	if (Object.keys(option).length) {
		Object.assign(options, option);
	}

	try {
		return isOAuth2
			? await this.helpers.requestWithAuthentication.call(this, authenticationMethod, options)
			: await this.helpers.request.call(this, options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export function processParameters(parameters: Array<{ name: string; value: string }>): IDataObject {
	const result: IDataObject = {};

	for (const param of parameters) {
		if (!param.name) continue;

		const keys = param.name.split('.');
		let current: any = result;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const isLast = i === keys.length - 1;

			if (isLast) {
				const arrayMatch = key.match(/(.*)\[(\d+)]$/);
				if (arrayMatch) {
					const arrayKey = arrayMatch[1];
					const index = parseInt(arrayMatch[2], 10);

					if (!current[arrayKey]) {
						current[arrayKey] = [];
					}
					current[arrayKey][index] = param.value;
				} else {
					current[key] = param.value;
				}
			} else {
				if (!current[key]) {
					current[key] = {};
				}
				current = current[key];
			}
		}
	}

	return result;
}
