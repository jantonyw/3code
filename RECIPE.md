# 2code

2code's coding workstation inside Herdr: projects on the left with their git
worktrees nested under them, a quiet top bar with the project, branch,
pull request and a Files / Git switch, flat Files and Changes panels, a large
diff dialog with history and review comments, and line-style terminal tabs
with a terminal-template menu. Neutral grays (shadcn style), light and dark,
English or 简体中文.

Optional `vitesse-light` and `vitesse-dark` themes adapt the colors of
https://github.com/antfu/vscode-theme-vitesse for Herdr's theme picker.

![2code](preview.png)

## What you see

Left to right:

- **Sidebar**, 250px (min 44, max 420), `chrome` background.
  - Below the header, Herdr's native `spaces` and `agents` mods share the
    sidebar. The former 2code saved-project list is not displayed.
    The first launch sets the native Agents list to group by space; its sort
    menu can still change the order. Only live agents appear there.
  - 52px header: Herdr's mark (`frame/welcome/herdr.png`, 20px) and "Herdr"
    (15px semibold) in a 110×24 clipped slot, and a sidebar-toggle icon. Drags
    the window. On macOS (not fullscreen) it starts at 76px, clear of the
    window buttons (`traffic_lights: [16, 19]`: their 14px row is centered on
    the 52px header and top bar); on the macOS rail the row is left to them.
- **Work column**:
  - The columns button beside the Files / Changes switch moves that panel
    between the left and right of the terminal area using `layout.set`.
  - 52px top bar (`background`, bottom border; on macOS, when the sidebar is
    hidden or narrower than the window buttons, it pads left to
    `traffic_lights.x + 64` like Herdr's tab bar): a segmented switch (folder =
    Files, branch icon with green `+N` / red `-N` = Changes); centered, the
    project name (14px semibold; hover shows the path) and the branch; then a
    pull request chip (`#12 Open|Draft|Merged|Closed`, colored green / dim /
    `ansi5` / red), an "Open in…" button and a gear (project settings).
  - A row: a 260px side panel (stack of the `files` and `changes` parts,
    hidden until picked), then the terminal area.
    - Files: 24px rows, 12px indent, a 15px material file icon, names in
      `muted`; new files green `ansi2`, modified blue `ansi4`, deleted red
      `ansi1`, a blue dot on folders with changes, a letter at the right;
      gitignored entries at 50% opacity.
    - Changes: 40px header (select-all checkbox, "N changed file(s)", `+a -d`,
      expand icon), 30px rows (checkbox, name, folder in `dim` or `← old` for
      a rename, an undo icon on hover, a 16px square status badge), the picked
      file's diff, and a commit box ("COMMIT", Summary, Description, "x of y
      files included", Push N when ahead, Commit).
  - Terminal area: a 34px tab strip of terminals and files together (2px
    underline on the active tab, program or file icon, title, agent dot, an
    unsaved dot on files, ×), "+ New Terminal" and a chevron for templates;
    then the active tab's panes with 1px borders, no gaps, no rounding.
  - A file tab: a 36px header (file icon, path from the checkout, unsaved dot,
    Edit / Split / Preview for markdown, "Read-only" for other machines, Save),
    a banner when needed, then Herdr's Editor (13px, theme syntax colors), a
    split with the rendered markdown, or a centered image with its size.
- **Diff dialog** (92% × 88%): header with branch, Changes / History segments,
  "Review (N)", Unified / Split, close. Left 360px: the changes (as in the
  panel) or the commits (subject, short hash, author · age) → a commit's files.
  Right: file header (badge, path, `+a -d`), then the diff (20px rows; unified
  shows old and new numbers, split pairs removals with additions), or images
  before / after, and a comment bar when lines are selected.
- Themes `2code-light` (white, `#fafafa` chrome, `#e5e5e5` borders, GitHub
  Light terminal colors) and `2code-dark` (`#161616` terminals, `#0a0a0a`
  chrome), picked by the system appearance.

## How it behaves

- Brand: hovering the header flips the slot like a slot machine: Herdr's row
  rolls up to `top -26` and fades (260ms / 180ms, ease-in), 2code's row
  (`mods/2code/icons/2code.png`, "2Code") rises from `top 26` a beat later
  (380ms / 260ms, ease-out, 70ms delay). Leaving rolls them back the same way.
  Native `transition` on `top` and `opacity`; `spring` on `top` didn't move.
- Agent dots: `working` pulses green (`#34d399`, opacity loop 1.2s), `blocked`
  yellow (`#facc15`), `done` green (`#22c55e`), `idle` nothing. A folded
  project (and a rail tile) shows its most urgent worktree's status; an open
  one shows none, since its worktrees show theirs.
- Projects are the shared list `2code.projects` (`[{path, machine, name?}]`).
  Every 4s the sidebar adds the repo of each open space (its main checkout:
  `git rev-parse --git-common-dir`) and reads each project's
  `git worktree list --porcelain`. Names come from the folder ("app.git" →
  "app", "bare.git" → its parent) unless renamed.
- Click a project: its shown, else first open, else main worktree. Click a
  worktree: select its space, or `space.new {folder}` on its checkout. Caret
  folds. Hover a project: `+` opens Herdr's `worktree` dialog (action `new`,
  folder = main checkout); if `2code.json` has `setup_script`, the new space's
  first tab ("setup" / "安装") runs it. Hover a non-main worktree: `×` opens
  Delete worktree.
- Right-click a project: New Worktree, Rename, Project Settings, Reveal in File
  Manager (local), Remove Project (closes its spaces, drops it from the list).
  Right-click a worktree: Open, Reveal, Delete Worktree.
- Delete worktree: shows uncommitted file count and commits on no remote, the
  teardown lines; Run teardown and delete / Skip teardown / Cancel; closes the
  space, `git worktree remove [--force]`. The branch stays.
- Project settings: tabs Scripts (setup / teardown / init, one per line),
  Project Templates (name, folder, commands) and Global Templates; Save writes
  `<main>/2code.json` and `~/2code/2code.json` keeping unknown fields, and
  never creates an empty file.
- Files: click a folder folds it; click a file opens it in a tab (or shows its
  open tab); right-click: Open, Open in Default App, Reveal, New File, New
  Folder, Rename (name dialogs), Copy Relative / Absolute Path, Refresh, Delete
  (to the trash with `/usr/bin/trash` or `gio trash`; when the trash refuses,
  the dialog shows why and offers Delete Permanently).
- File tabs: each file is a Herdr tab whose only pane is the `editor` part
  (`tab.new {mod, props: {part, path, on, root}}`); shared `2code.editors`
  maps tab ids to files, `2code.dirty` marks unsaved ones. `cmd-s` /
  `ctrl-s` (section `mod:2code`) saves with `writeTextFile(path, text,
  savedSnapshot)`; a rejected snapshot offers Reload / Overwrite. Every 3s the
  file is reread: taken silently when nothing is unsaved, else "changed on
  disk" offers Keep Mine / Reload. While unsaved a copy sits in
  `mods/2code/.cache/recovery/`; reopening offers Restore / Discard. × on an
  unsaved tab selects it and asks Save / Don't Save / Cancel (answered by the
  editor through shared `2code.editorRequest`). Markdown remembers its mode.
- Finder (`cmd-k` / `ctrl-shift-k`): a dialog over `git ls-files --cached
  --others --exclude-standard` (else `find`), fuzzy-ranked (in order, runs,
  word starts and the file name score; shorter paths win ties), ↑↓ Enter.
- Changes: staged and unstaged files appear in separate groups; the same file
  may appear in both. The + / − controls stage or unstage a file or group.
  Clicking a file opens its diff in the large dialog, comparing the index or
  working tree for its group.
  Commit (or Enter in Summary) commits the entire index as it stands, without
  changing partially staged files. The undo icon arms
  ("Discard?"), a second click discards (`git restore --source=HEAD
  --staged --worktree`, or `git clean -f` for new files). Push runs `git push`
  (or `-u origin HEAD` without an upstream).
- Diff dialog: clicking a line selects it; clicking another makes a range
  (shift-click too); a comment there goes into shared `2code.review[root]`.
  Review (N) lists them; Copy for Agent writes "Please address these review
  comments:" with each `file:range`, the selected diff and the comment.
  Up and Down move through the file list and reveal the selected file; text
  inputs keep their own arrow-key behavior.
  Added, removed and hunk rows use distinct dark/light diff colors rather than
  inheriting the terminal's ANSI colors.
- Branch (top bar): searchable list (current, trunk from `origin/HEAD`,
  "used" when another worktree has it, ↑/↓ counts, remote-only branches);
  Enter or click runs `git switch` (`--track` for remote ones).
- Tabs: click selects, right-click opens Herdr's tab menu, × closes. New
  Terminal opens a tab in the focused folder and types `init_script`. The
  chevron lists project templates and global ones; picking one opens a tab
  named after it in its `cwd` and types `init_script` then its `commands`.
  The top bar's play button runs the first project template, falling back to
  the first global template; its adjacent arrow opens the same template menu.
- Keys (section `layout:2code`): `cmd-t`/`ctrl-shift-t` new terminal,
  `cmd-g`/`ctrl-shift-g` diff dialog, `cmd-e`/`ctrl-shift-e` panel,
  `cmd-k`/`ctrl-shift-k` find a file, `cmd-s`/`ctrl-s` save (in a file tab),
  `cmd-shift-f` searches saved file contents with ripgrep (case-insensitive
  literal text, respecting ignore rules; first 200 matches, files up to 1 MB).
  Selecting a match opens the file; the editor does not yet jump to its line.
  Matches in each result are highlighted using ripgrep's UTF-8 byte ranges.
  `shift-enter`
  newline, `alt-left/right` word.
- AI commit drafting reads staged changes and sends up to 30,000 characters
  of diff to the configured OpenAI-compatible chat-completions endpoint. The
  global URL, model and plaintext key are stored under Herdr's local
  `data/2code-ai` directory (owner-only directory on Unix); the user reviews the
  generated fields before committing.
  The AI settings include editable commit-message instructions, defaulting to
  the team's Chinese Conventional Commits convention; the JSON response
  format remains required.
- The Changes panel stages or unstages files and groups with + / − controls,
  and pulls with `git pull --ff-only`. Errors are displayed in the panel.
  Its `…` menu provides fetch/pull/push, stage/unstage all, commit all, amend,
  undo the last commit (soft reset), and branch switch,
  create, merge, rebase, rename and safe deletion; long-running commands stay
  in the popup until completion, and errors remain visible there.
- Language: `sh -c 'printf %s "${LC_ALL:-${LC_MESSAGES:-$LANG}}"'` (PowerShell's
  `$env:` on Windows); `zh*` shows 简体中文, anything else English; shared
  `2code.locale` redraws every part.

## Built from

- Layout `layouts/2code.json`: root `row` (`titlebar: none`, traffic lights
  `[16, 19]`, theme `{light: 2code-light, dark: 2code-dark}`, JetBrains Mono
  13, terminal padding `[8, 10]`) → `sidebar` column (`brand`, native `spaces` and `agents`
  blocks) and `work` column (`topbar` block, `work-body` row → `panel` stack
  [`files`, `changes`] and `terminal-area` column [`tabs` block, `main` tab block]).
- One mod, `mods/2code`, every block `{mod: "2code", props: {part}}`. Parts:
  `header`, `sidebar`, `topbar`, `tabs`, `files`, `changes`, `editor` (a tab),
  and overlays `menu`, `templates`, `openIn`, `fileMenu` (popups), `rename`,
  `removeProject`, `deleteProfile`, `projectSettings`, `diff`, `review`,
  `branches`, `finder`, `filePrompt`, `fileDelete`, `unsaved` (dialogs).
  File icons: a 209-icon slice of material-icon-theme (MIT) built by
  `scripts/build-file-icons.mjs` into `lib/fileIcons.js` + `icons/files/`.
  `lib/`: `i18n`, `git`, `config` (2code.json), `projects`, `changes` (git
  work), `terminal`, `os` (reveal, avatars), `ui`.
- Shipped mods used: `worktree` (New worktree), `menu` (tab menu). `files` and
  `changes` start from Herdr's shipped mods (Apache-2.0, `mods/2code/NOTICE`).
- `herdr` calls: `spaces`, `panes`, `focused`, `layout`, `theme`, `settings`,
  `shared` / `setShared`, `exec`, `hc` (`send`), `readTextFile`,
  `writeTextFile`, `watchFolder`, `pickFolder`, `openOverlay` /
  `closeOverlay`, `notify`, `nextCommand`, `appHome`, `run` (`space.*`,
  `tab.*`, `pane.focus`, `layout.*`, `app.settings`); `cx.open_url`,
  `cx.write_to_clipboard`.
- Programs: `git`, `gh`, `sh`, `curl` (avatars), `open` / `xdg-open` /
  `explorer.exe`.

## Watch out

- Herdr refuses imports from another mod's folder: everything shared lives in
  one mod, picked by `props.part`.
- `tab.new {task}` only types into agents, so templates find the new tab's
  terminal in `panes()` (`cx.sleep(100)`, up to 6s) and type each line with
  `hc send`.
- A popup's tasks end when it closes: menus draw nothing while their action
  runs and close after.
- Herdr's own Remove worktree needs an open space (without one it closes the
  focused space), so Delete worktree removes the worktree itself.
- Virtual list rows can't register `on_click`: use the list's
  `on_item_click(key)`; it carries no modifiers, hence click-then-click ranges.
- Deeply nested flex leaves `size_full()` children with no height: pin the
  diff list with `absolute().inset_0()` in a `relative()` box.
- `image()` reads only the app's folder and has no fit option: images are
  copied into `mods/2code/.cache/` and sized from their headers.
- `h_flex` centers its children vertically: a box holding only absolute
  children needs `h_full()` there (the markdown split collapsed without it).
- Inputs keep the placeholder they were made with: the Changes panel remakes
  its inputs (keeping the text) when `2code.locale` resolves.
- Herdr closes tabs without asking a mod: only 2code's own × can prompt, hence
  the recovery copy.
- `gio trash` refuses some mounts (e.g. `/tmp`): never fall back to deleting
  silently.
- `fetch()` reads text only; avatars download with `curl`.
- No locale API (no `Intl`, no `navigator`). Herdr's own dialogs stay English.
- Plain `ctrl-` letters belong to terminal programs on Linux and Windows.

## Done when

- `herdr-app check mods/2code` passes and `layout.switch {name: "2code"}` shows
  no `herdr-app status` errors.
- Closing a project's last tab leaves it in the sidebar; clicking its worktree
  opens a space there.
- Two worktrees of one repo appear as worktrees under one project row.
- `+` with a `setup_script` gives a worktree whose first tab ran it; `×` runs
  `teardown_script` and removes the worktree.
- Project Settings saves templates into `2code.json` and they show in the
  template menu; picking one opens a named tab that ran its commands.
- Unchecking a file in Changes and committing leaves it uncommitted.
- Two lines clicked in the diff dialog and a comment give "Review (1)", and
  Copy for Agent puts the formatted text on the clipboard.
- `cmd-g` / `ctrl-shift-g` opens the dialog; `cmd-t` / `ctrl-shift-t` opens a
  terminal that ran `init_script`.
- Clicking a file opens a tab with its icon; typing shows the unsaved dot;
  `ctrl-s` writes the file; an outside change appears within 3s; × on an
  unsaved tab asks Save / Don't Save / Cancel.
- `cmd-k` / `ctrl-shift-k`, typing part of a path and Enter opens that file.
- With `LANG=zh_CN.UTF-8` every 2code label is Chinese; unset, English.
