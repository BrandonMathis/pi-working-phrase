#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="${1:-$ROOT_DIR/docs/media/working-status.gif}"
TMP_DIR="$(mktemp -d)"
SESSION_NAME="pi-working-phrase-preview-$$"

cleanup() {
	tmux kill-session -t "$SESSION_NAME" >/dev/null 2>&1 || true
	rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# Keep these defaults fixed so the README asset is reproducible. Override any of
# them in the environment if Pi's terminal layout changes in a future release.
RECORD_COLS="${PI_WORKING_PHRASE_RECORD_COLS:-90}"
RECORD_ROWS="${PI_WORKING_PHRASE_RECORD_ROWS:-18}"
FONT_SIZE="${PI_WORKING_PHRASE_FONT_SIZE:-18}"
FPS_CAP="${PI_WORKING_PHRASE_FPS_CAP:-20}"
STARTUP_WAIT="${PI_WORKING_PHRASE_STARTUP_WAIT:-4}"
SEND_AFTER="${PI_WORKING_PHRASE_SEND_AFTER:-1}"
RECORD_AFTER_PROMPT="${PI_WORKING_PHRASE_RECORD_AFTER_PROMPT:-9}"
GIF_START="${PI_WORKING_PHRASE_GIF_START:-1.8}"
GIF_DURATION="${PI_WORKING_PHRASE_GIF_DURATION:-5.2}"
PREVIEW_HOLD_MS="${PI_WORKING_PHRASE_PREVIEW_HOLD_MS:-6500}"

OUTPUT_WIDTH="${PI_WORKING_PHRASE_OUTPUT_WIDTH:-554}"
OUTPUT_HEIGHT="${PI_WORKING_PHRASE_OUTPUT_HEIGHT:-58}"
CONTENT_X="${PI_WORKING_PHRASE_CONTENT_X:-20}"
CONTENT_Y="${PI_WORKING_PHRASE_CONTENT_Y:-290}"
CONTENT_WIDTH="${PI_WORKING_PHRASE_CONTENT_WIDTH:-514}"
CONTENT_HEIGHT="${PI_WORKING_PHRASE_CONTENT_HEIGHT:-18}"
PADDING="${PI_WORKING_PHRASE_PADDING:-20}"
BACKGROUND="${PI_WORKING_PHRASE_BACKGROUND:-0x282a36}"
PROMPT="${PI_WORKING_PHRASE_PREVIEW_PROMPT:-Preview the working status.}"
PI_BIN="${PI_BIN:-$ROOT_DIR/node_modules/.bin/pi}"

need() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

need asciinema
need agg
need ffmpeg
need ffprobe
need node
need tmux

if [[ ! -x "$PI_BIN" ]]; then
	echo "Missing Pi CLI at $PI_BIN. Run npm install first or set PI_BIN=/path/to/pi." >&2
	exit 1
fi

PREVIEW_PROVIDER="$TMP_DIR/preview-provider.ts"
PI_RUNNER="$TMP_DIR/run-pi-preview.sh"
CAST="$TMP_DIR/working-status.cast"
FULL_GIF="$TMP_DIR/working-status-full.gif"

cat > "$PREVIEW_PROVIDER" <<'EOF_PROVIDER'
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createAssistantMessageEventStream, type AssistantMessage, type Usage } from "@mariozechner/pi-ai";

const usage: Usage = {
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	totalTokens: 0,
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

const delay = (ms: number, signal?: AbortSignal) =>
	new Promise<void>((resolve) => {
		if (signal?.aborted) {
			resolve();
			return;
		}

		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				resolve();
			},
			{ once: true },
		);
	});

export default function (pi: ExtensionAPI) {
	pi.registerProvider("pi-working-phrase-preview", {
		name: "pi-working-phrase preview",
		baseUrl: "http://localhost:0",
		apiKey: "preview",
		api: "pi-working-phrase-preview",
		models: [
			{
				id: "preview",
				name: "Preview",
				reasoning: false,
				input: ["text"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 8192,
				maxTokens: 128,
			},
		],
		streamSimple(model, _context, options) {
			const stream = createAssistantMessageEventStream();
			const text = "Preview complete.";
			const message: AssistantMessage = {
				role: "assistant",
				content: [{ type: "text", text }],
				api: model.api,
				provider: model.provider,
				model: model.id,
				usage,
				stopReason: "stop",
				timestamp: Date.now(),
			};

			queueMicrotask(async () => {
				const signal = options?.signal;
				stream.push({ type: "start", partial: { ...message, content: [] } });
				await delay(Number(process.env.PI_WORKING_PHRASE_PREVIEW_HOLD_MS ?? 6500), signal);

				if (signal?.aborted) {
					stream.end({ ...message, stopReason: "aborted", errorMessage: "Preview aborted" });
					return;
				}

				stream.push({ type: "text_start", contentIndex: 0, partial: { ...message, content: [{ type: "text", text: "" }] } });
				stream.push({ type: "text_delta", contentIndex: 0, delta: text, partial: message });
				stream.push({ type: "text_end", contentIndex: 0, content: text, partial: message });
				stream.push({ type: "done", reason: "stop", message });
				stream.end(message);
			});

			return stream;
		},
	});
}
EOF_PROVIDER

mkdir -p "$(dirname "$OUTPUT")"

cat > "$PI_RUNNER" <<EOF_RUNNER
#!/usr/bin/env bash
set -euo pipefail
cd $(printf '%q' "$ROOT_DIR")
export PI_OFFLINE=1
export PI_WORKING_PHRASE_PREVIEW_HOLD_MS=$(printf '%q' "$PREVIEW_HOLD_MS")
exec $(printf '%q' "$PI_BIN") --offline --no-extensions --no-skills --no-prompt-templates --no-context-files --no-themes --extension $(printf '%q' "$ROOT_DIR/src/index.ts") --extension $(printf '%q' "$PREVIEW_PROVIDER") --provider pi-working-phrase-preview --model preview --no-session
EOF_RUNNER
chmod +x "$PI_RUNNER"

cd "$ROOT_DIR"
tmux -f /dev/null new-session \
	-d \
	-s "$SESSION_NAME" \
	-x "$RECORD_COLS" \
	-y "$RECORD_ROWS" \
	"$PI_RUNNER"

tmux set-option -t "$SESSION_NAME" status off >/dev/null
tmux set-option -t "$SESSION_NAME" pane-border-status off >/dev/null
tmux set-option -t "$SESSION_NAME" remain-on-exit off >/dev/null

sleep "$STARTUP_WAIT"

(
	sleep "$SEND_AFTER"
	tmux send-keys -t "$SESSION_NAME" -l "$PROMPT"
	tmux send-keys -t "$SESSION_NAME" Enter
	sleep "$RECORD_AFTER_PROMPT"
	tmux send-keys -t "$SESSION_NAME" C-c >/dev/null 2>&1 || true
	sleep 0.5
	tmux kill-session -t "$SESSION_NAME" >/dev/null 2>&1 || true
) &

TERM=xterm-256color asciinema rec \
	--overwrite \
	--quiet \
	--cols "$RECORD_COLS" \
	--rows "$RECORD_ROWS" \
	--idle-time-limit 1 \
	--command "tmux attach-session -t $SESSION_NAME" \
	"$CAST"

agg --quiet "$CAST" "$FULL_GIF" \
	--theme dracula \
	--font-size "$FONT_SIZE" \
	--cols "$RECORD_COLS" \
	--rows "$RECORD_ROWS" \
	--idle-time-limit 1 \
	--fps-cap "$FPS_CAP" \
	--last-frame-duration 1

ffmpeg -y -hide_banner -loglevel error \
	-i "$FULL_GIF" \
	-filter_complex "[0:v]trim=start=${GIF_START}:duration=${GIF_DURATION},setpts=PTS-STARTPTS,crop=${CONTENT_WIDTH}:${CONTENT_HEIGHT}:${CONTENT_X}:${CONTENT_Y},pad=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:${PADDING}:${PADDING}:color=${BACKGROUND},split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
	"$OUTPUT"

actual_size="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames -of csv=p=0:s=x "$OUTPUT")"
expected_size="${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}x"
case "$actual_size" in
	${expected_size}*) ;;
	*)
		echo "Unexpected GIF dimensions/frames: $actual_size" >&2
		exit 1
		;;
esac

printf 'Wrote %s (%s)\n' "$OUTPUT" "$actual_size"
