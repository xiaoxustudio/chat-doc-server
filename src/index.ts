import {
	Configuration,
	onLoadDocumentPayload,
	onStoreDocumentPayload,
	Server,
} from "@hocuspocus/server";
import { TiptapTransformer } from "@hocuspocus/transformer";
// 服务器相关
import Koa from "koa";
import websocket from "koa-easy-ws";
import ws from "ws";
import { IncomingMessage } from "http";

import { domStringToProseMirrorJson, MsgWrapper } from "@/utils";
import { ReceiveData, WsCode } from "@/type";

const app = new Koa();
app.use(websocket());

// 服务器配置
const config: Partial<Configuration> = {
	port: 8001,
	address: "localhost",
};

// 全局文档ws
interface IDocProp {
	block: string;
	ready: boolean;
	title: string;
	content: string;
	users: any;
}
const docWs = new Map<string, IDocProp>();
const docWsFuns = new Map<string, ((...args: any[]) => void)[]>(); // 回调执行栈

// master Websocket
const wsIns = new ws("ws://localhost:8000/doc");
wsIns.onopen = () => {
	if (wsIns.readyState === ws.OPEN) {
		console.log("连接到 Master");
	}
};
wsIns.onmessage = (e) => {
	try {
		const data = JSON.parse(e.data as string) as ReceiveData;
		if (data.type == WsCode.DocInit) {
			const docData = data.data as IDocProp;
			docWs.set(docData.block, docData);
			const callArr = docWsFuns.get(docData.block)!;
			if (!callArr) return;
			const len = callArr.length;
			for (let i = 0; i < len; i++) {
				const cb = callArr[i];
				cb();
				callArr.splice(i, 1); // 运行后删除
			}
		}
		// console.log("master ", data);
	} catch (e) {
		console.log("master 消息接收失败", e);
	}
};
wsIns.onerror = wsIns.onclose = () => console.log("连接 master 失败");

const server = Server.configure({
	...config,
	async onConnect(data) {
		const DocData = docWs.get(data.documentName);
		if (!DocData) {
			// 加载文档，等待主要服务器load
			let Dws = {
				block: data.documentName,
				content: "",
				title: "",
				ready: false,
				users: [],
			} as IDocProp;
			docWs.set(data.documentName, Dws);
			wsIns.send(MsgWrapper(WsCode.DocInit, "", Dws));
		}
	},
	async onLoadDocument(data) {
		let callArr = docWsFuns.get(data.documentName);
		if (!callArr) {
			callArr = [];
			docWsFuns.set(data.documentName, callArr);
		}
		callArr.push(() => {
			const d = docWs.get(data.documentName)!;
			const domString = domStringToProseMirrorJson(d.content);
			const transform = TiptapTransformer.toYdoc(domString, "default");
			const ytitle = data.document.getText("title");
			ytitle.delete(0, ytitle.length);
			ytitle.insert(0, d.title);
			data.document.merge(transform);
			console.log("文档ID：", data.documentName); // 文档ID
		});
	},
	async onAwarenessUpdate(data) {
		const domName = data.documentName;
		const users = data.awareness.getStates();
		const docData = docWs.get(domName)!;
		if (!docData || !docData.ready) return;
		if (!docData.users) {
			docData.users = [];
		}
		docData.users = users;
	},
	async onDisconnect(data) {
		const docName = data.document.name;
		const docData = docWs.get(docName)!;
		if (!docData || !docData.ready) return;

		const users = docData.users as Map<any, any>;
		// 如果没有用户在线
		if (users?.size == 0) {
			const title = data.document.getText("title").toString();
			const content = data.document.getXmlFragment("default").toJSON();
			wsIns.send(
				MsgWrapper(
					WsCode.DocSave,
					"",
					JSON.parse(
						JSON.stringify({
							...docData,
							content,
							title,
						} as IDocProp)
					)
				)
			); // 向 master 保存文档
			// 移除文档实例
			docWs.delete(docName);
			docWsFuns.delete(docName);
			console.log("文档退出：", docName);
		}
		server.closeConnections(data.documentName);
	},
	async onDestroy(data) {
		data.instance.destroy();
	},
});

app.use(async (ctx) => {
	const ws = await ctx.ws();
	server.handleConnection(ws, ctx.request as unknown as IncomingMessage);
});

app.listen(config.port);
