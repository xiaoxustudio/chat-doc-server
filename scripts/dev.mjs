import { execa } from "execa";

function run() {
	let res = [];

	res.push(
		execa("yarn", ["r"], {
			stdio: "inherit",
		})
	);
	res.push(
		execa("yarn", ["n"], {
			stdio: "inherit",
		})
	);
	return Promise.all(res);
}
run().then(() => {
	console.log("success");
});
