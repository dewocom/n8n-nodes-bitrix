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
