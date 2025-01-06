import { RequestBody, createAlova } from "alova";
import adapterFetch from "alova/fetch";
import { ReceiveData } from "./type";

const alovaInstance = createAlova({
	requestAdapter: adapterFetch(),
	responded: (response) => response.json(),
	beforeRequest(method) {
		const str = localStorage.getItem("user-info");
		const data = JSON.parse(str != null ? str : `{"state":{"token":""}}`);
		method.config.headers = {
			...method.config.headers,
			Authorization: data.state.token,
		};
	},
});

export default alovaInstance;
/**
 * @description 获取函数第几个参数的返回值
 */
type GetNthParameter<
	T extends (...args: any[]) => any,
	N extends number
> = T extends (...args: infer Args) => any
	? Args extends [...infer Head, infer Tail]
		? Tail extends [...infer _, infer Arg]
			? N extends Head["length"]
				? Arg
				: GetNthParameter<T, Exclude<N, Head["length"]>>
			: never
		: never
	: never;

export function Post<T = ReceiveData>(
	url: string,
	data?: RequestBody,
	option?: GetNthParameter<typeof createAlova, 3>
) {
	return alovaInstance.Post<T>(url, data, option);
}
export function Get<T = ReceiveData>(
	url: string,
	option?: GetNthParameter<typeof createAlova, 2>
) {
	return alovaInstance.Get<T>(url, option);
}
