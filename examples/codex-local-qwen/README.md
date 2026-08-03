# Codex + local Qwen on Apple Silicon

This is the public, path-neutral version of the setup described in the article
[How I ran Qwen locally inside Codex](https://rajeevg.com/blog/how-i-ran-qwen-locally-inside-codex).

It gives Codex one local provider URL:

```text
Codex -> adapter on 127.0.0.1:8080
          -> local Qwen through MLX-VLM on 127.0.0.1:8081
          -> hosted models through CLIProxyAPI on 127.0.0.1:8319
```

The example does not modify `ChatGPT.app`. The model selector is populated by
Codex's supported `model_catalog_json` setting.

## What has been tested

- Apple Silicon Mac with 48 GB unified memory
- macOS 26.5.2
- `mlx-vlm` 0.6.5 for the original proof; 0.6.8 is the current release when
  this example was published
- CLIProxyAPI 7.2.112 for the original proof; 7.2.115 is the current release
  when this example was published
- `mlx-community/Qwen3.6-35B-A3B-4bit` at revision
  `38740b847e4cb78f352aba30aa41c76e08e6eb46`

The weights occupy about 19 GB. The 163,840-token runtime setting was tested on
48 GB of unified memory. If your Mac has less memory, begin with a smaller model
or a much lower `context_length`.

## 1. Install the command-line tools

```bash
xcode-select --install

# Install Homebrew if `brew --version` fails:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install uv jq cliproxyapi
uv tool install --python 3.13 mlx-vlm
uv tool install --python 3.13 huggingface_hub
uv tool update-shell
```

Open a new Terminal window, then check:

```bash
uv --version
jq --version
mlx_vlm.server --help
hf --help
cliproxyapi --help
codex --version
```

## 2. Download the exact model

```bash
mkdir -p "$HOME/Models/Qwen3.6-35B-A3B-4bit"

hf download mlx-community/Qwen3.6-35B-A3B-4bit \
  --revision 38740b847e4cb78f352aba30aa41c76e08e6eb46 \
  --local-dir "$HOME/Models/Qwen3.6-35B-A3B-4bit"

test -f "$HOME/Models/Qwen3.6-35B-A3B-4bit/config.json"
du -sh "$HOME/Models/Qwen3.6-35B-A3B-4bit"
```

Expected result: `config.json` exists and the directory is roughly 19 GB.

## 3. Test Qwen before adding Codex

```bash
mlx_vlm.generate \
  --model "$HOME/Models/Qwen3.6-35B-A3B-4bit" \
  --prompt "Reply with exactly QWEN_DIRECT_OK" \
  --max-tokens 32 \
  --temperature 0
```

Do not continue until the response contains `QWEN_DIRECT_OK`.

## 4. Copy and edit the example configuration

Clone this repository, then work from this directory:

```bash
git clone https://github.com/Rajeev-SG/rajeevg.com.git
cd rajeevg.com/examples/codex-local-qwen

cp config/settings.example.json config/settings.json
cp config/cliproxyapi.example.yaml config/cliproxyapi.yaml
```

Edit `config/settings.json`. Replace `/Users/you` with your real home path:

```json
{
  "model_path": "/Users/your-name/Models/Qwen3.6-35B-A3B-4bit",
  "model_alias": "qwen3.6-35b-a3b-mlx",
  "context_length": 163840,
  "max_output_tokens": 4096
}
```

Check both files:

```bash
jq . config/settings.json
cliproxyapi --config "$PWD/config/cliproxyapi.yaml" --help >/dev/null
```

## 5. Sign CLIProxyAPI into the hosted Codex models

```bash
cliproxyapi \
  --config "$PWD/config/cliproxyapi.yaml" \
  --codex-login
```

Finish the browser sign-in. CLIProxyAPI stores the resulting account file in
`~/.cli-proxy-api`, as set by `auth-dir`.

This sign-in is only for the hosted-model route. Local Qwen does not need an
OpenAI API key.

## 6. Start the three local services

```bash
chmod +x scripts/*.sh
./scripts/start.sh
./scripts/status.sh
```

Expected health response:

```json
{"status":"ok","mlx_vlm":true,"cliproxyapi":true}
```

Useful log files are created under `logs/`. Stop everything with:

```bash
./scripts/stop.sh
```

## 7. Build the merged model catalog

The following command reads the model catalog bundled with your installed
Codex, keeps its hosted entries, and adds the local Qwen entry:

```bash
uv run --python 3.13 --no-project python scripts/merge_model_catalog.py
jq '.models[] | {slug, display_name}' config/merged-model-catalog.json
```

Expected result: the list includes `qwen3.6-35b-a3b-mlx` as well as the hosted
models bundled with Codex.

Run the merge command again after a Codex update so new hosted entries are not
hidden by an old copied catalog.

## 8. Configure Codex

Back up the current user configuration first:

```bash
cp "$HOME/.codex/config.toml" "$HOME/.codex/config.toml.before-local-qwen"
```

Merge the contents of `config/config.toml.example` into
`~/.codex/config.toml`. Replace both `/Users/you` and the example-kit location
with your actual absolute paths. Do not replace unrelated settings.

The important block is:

```toml
model = "qwen3.6-35b-a3b-mlx"
model_provider = "local_qwen_router"
model_catalog_json = "/absolute/path/to/codex-local-qwen/config/merged-model-catalog.json"

[model_providers.local_qwen_router]
name = "Hosted models + local Qwen"
base_url = "http://127.0.0.1:8080/v1"
wire_api = "responses"
experimental_bearer_token = "sk-local-codex"
requires_openai_auth = false
supports_websockets = false
```

The key is local-only and must match `config/cliproxyapi.yaml`. All three
listeners bind to `127.0.0.1`, so they are not exposed to other machines.

Quit and reopen Codex after changing the catalog. Qwen should now appear in the
model selector without any change to the signed application bundle.

## 9. Test one ability at a time

1. Select Qwen and ask: `Reply with exactly QWEN_CODEX_OK.`
2. Attach a small screenshot and ask Qwen to describe one visible detail.
3. Ask a current factual question and explicitly request web search.
4. Ask Codex to inspect a harmless file in a test repository.
5. Select a hosted model and confirm that it still answers through CLIProxyAPI.
6. Run `./scripts/status.sh` and inspect `logs/adapter.log` to confirm the route.

Image understanding and image generation are different. Qwen can inspect an
image. Creating a new image still uses Codex's separate image-generation tool.

## Context limits

Only the Qwen catalog entry contains these values:

```json
"context_window": 163840,
"auto_compact_token_limit": 150000,
"truncation_policy": {"mode": "tokens", "limit": 156000}
```

That means the local model compacts its history before reaching the runtime
cap, while hosted models retain their own catalog values.

## Troubleshooting

- `mlx_vlm.server: command not found`: open a new Terminal after
  `uv tool update-shell`, or add `~/.local/bin` to `PATH`.
- Model download stops: rerun the same `hf download` command. It resumes files
  already present.
- Port already in use: run `lsof -nP -iTCP:8080 -iTCP:8081 -iTCP:8319
  -sTCP:LISTEN`, then stop the process you recognise.
- CLIProxyAPI returns no hosted models: rerun `--codex-login` with the same
  config file and inspect `logs/cliproxyapi.log`.
- Qwen is missing from the selector: rebuild the merged catalog, confirm the
  absolute path in `config.toml`, then quit and reopen Codex.
- A tool-returned image causes a huge context error: keep this adapter's image
  normalisation until [MLX-VLM PR #1761](https://github.com/Blaizzy/mlx-vlm/pull/1761)
  is included in a release you have tested.

## Update or remove the setup

Update the two installed programs:

```bash
uv tool upgrade mlx-vlm
brew upgrade cliproxyapi
```

Rebuild the merged catalog after updating Codex:

```bash
uv run --python 3.13 --no-project python scripts/merge_model_catalog.py
```

To remove the integration, stop the services, restore the backed-up
`~/.codex/config.toml`, and delete this example directory. The downloaded model
is separate, so only delete `$HOME/Models/Qwen3.6-35B-A3B-4bit` if you also want
to recover its disk space.

## Sources

- [MLX](https://github.com/ml-explore/mlx)
- [MLX-VLM](https://github.com/Blaizzy/mlx-vlm)
- [CLIProxyAPI quick start](https://help.router-for.me/introduction/quick-start)
- [CLIProxyAPI Codex sign-in](https://help.router-for.me/configuration/provider/codex)
- [Qwen MLX model](https://huggingface.co/mlx-community/Qwen3.6-35B-A3B-4bit)
- [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [Codex advanced configuration](https://learn.chatgpt.com/docs/config-file/config-advanced)
- [MLX-VLM issue #1760](https://github.com/Blaizzy/mlx-vlm/issues/1760)
- [MLX-VLM pull request #1761](https://github.com/Blaizzy/mlx-vlm/pull/1761)
