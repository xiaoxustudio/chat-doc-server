export enum WsCode {
	HeartBeat = 801,
	HeartBeatServer,
	HeartBeatClient,
	Receive,
	Send,
	WithDraw,
	CreateChannel,
	DisConnectChannel,
	UpdateMsgList,
	DocInit,
	DocSave,
	ChangeContent,
	ChangeTitle,
}

export interface ReceiveData {
	type: WsCode;
	message: string;
	data: any;
}
