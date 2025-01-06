import { WsCode } from "./type";

export function MsgWrapper(code: WsCode, msg: string, da: any) {
	return JSON.stringify({
		type: code,
		message: msg,
		data: da,
	});
}

import { Parser } from "htmlparser2";

interface ProseMirrorNode {
	type: string;
	attrs?: { [key: string]: any };
	content?: ProseMirrorNode[];
	text?: string;
}

const TagMap: { [key: string]: any } = {
	p: "paragraph",
};

export function domStringToProseMirrorJson(
	htmlString: string
): ProseMirrorNode {
	const root: ProseMirrorNode = {
		type: "doc",
		content: [],
	};

	let current: ProseMirrorNode | null = null;

	const parser = new Parser(
		{
			onopentag(name: any, attribs: { [key: string]: string }): void {
				const node: ProseMirrorNode = {
					type: TagMap[name] ?? name,
					attrs: attribs,
					content: [],
				};

				if (!current) {
					if (!root.content) root.content = [];
					root.content.push(node);
				} else {
					if (!current.content) current.content = [];
					current.content.push(node);
				}

				current = node;
			},
			ontext(text: string): void {
				if (current) {
					current.content!.push({
						type: "text",
						text: text.trim(),
					});
				}
			},
			onclosetag(): void {
				current = current
					? current.content![current.content!.length - 1]
					: null;
			},
		},
		{ decodeEntities: true }
	);

	parser.write(htmlString);
	parser.end();

	return root;
}
