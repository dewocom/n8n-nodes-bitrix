import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import * as GeneralOperations from '../Description';
import * as CustomOperation from '../CustomMethodDescription';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	let returnData: INodeExecutionData[] = [];

	const items = this.getInputData();
	let responseData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const resource = this.getNodeParameter('resource', i) as string;

		try {
			switch (resource) {
				case 'custom':
					responseData = await CustomOperation.execute.call(this, i);
					break;
				default:
					responseData = await GeneralOperations.execute.call(this, i);
			}
			const executionData = this.helpers.constructExecutionMetaData(responseData, {
				itemData: { item: i }
			});
			returnData.push(...executionData);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: this.getInputData(i)[0].json,
					error: error
				});
				continue;
			}
			throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
		}
	}
	return [returnData];
}
