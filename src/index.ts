import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createWorkingStatusController } from "./timers";
import { loadWorkingPhraseConfig } from "./user-config";

export default function piWorkingPhraseExtension(pi: ExtensionAPI) {
	const controller = createWorkingStatusController();

	pi.on("agent_start", async (_event, ctx) => {
		controller.start(ctx, loadWorkingPhraseConfig(ctx.cwd));
	});

	pi.on("agent_end", async (_event, ctx) => {
		controller.stop(ctx);
	});

	pi.on("session_shutdown", async () => {
		controller.stop();
	});
}
