import { ILoadOptionsFunctions, INodePropertyOptions, NodeOperationError } from 'n8n-workflow';
import { bitrixApiRequest } from '../GenericFunctions';

interface BXField {
	type?: string;
	isRequired?: boolean;
	isReadOnly?: boolean;
	isImmutable?: boolean;
	isMultiple?: boolean;
	isDynamic?: boolean;
	title?: string;
}

export async function getEntityFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const resource = this.getNodeParameter('resource', 0) as string;
	const endpoint = `${resource}.fields`;

	try {
		const responseData = await bitrixApiRequest.call(this, 'POST', endpoint, {});
		if (!responseData?.result || typeof responseData.result !== 'object') {
			throw new NodeOperationError(this.getNode(), 'No valid fields data returned');
		}

		return Object.entries(responseData.result as Record<string, BXField>).map(([key, field]) => {
			const fieldType = field.type || 'unknown';

			const displayName = field?.title && field.title !== key
				? `${field.title} (${key})`
				: key;

			const descriptionParts = [`Type: ${fieldType}`];
			if (field.isRequired) descriptionParts.push('Required');
			if (field.isReadOnly) descriptionParts.push('Read-only');

			return {
				name: displayName,
				value: key,
				description: descriptionParts.join(' | '),
				action: field.type || 'string',
			};
		});

	} catch (error) {
		throw new Error(`Bitrix24 Error: ${error.message}`);
	}
};
