// Git actions keep their popup alive until commands complete so failures remain visible.
import { div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { exec, theme, props, closeOverlay, openOverlay } from "herdr";
import { t } from "../lib/i18n.js";
import { readChanges, stageFiles, pull, push } from "../lib/changes.js";
import { icon, button } from "../lib/ui.js";

const ACTIONS = {
  root: [["fetch", "gitFetch"], ["pull", "pull"], ["push", "push"], ["commit", "gitCommitMenu"], ["changes", "gitChanges"], ["branch", "gitBranch"]],
  commit: [["commitAll", "gitCommitAll"], ["amend", "gitAmend"], ["undoCommit", "gitUndoCommit"]],
  changes: [["stageAll", "stageAll"], ["unstageAll", "unstageAll"]],
  branch: [["switch", "switchBranch"], ["create", "gitCreateBranch"], ["merge", "gitMergeBranch"], ["rebase", "gitRebaseBranch"], ["rename", "gitRenameBranch"], ["delete", "gitDeleteBranch"]],
};
const INPUT = new Set(["create", "merge", "rebase", "rename", "delete"]);
const CONFIRM = new Set(["commitAll", "amend", "undoCommit"]);

export class GitActions {
  init(p) {
    this.p = p; this.page = "root"; this.busy = false; this.result = null; this.error = null;
    this.input = InputState.new({ placeholder: t("gitBranchName") });
    this.input.on("submit", (_e, cx) => this.execute(cx));
  }

  choose(action, cx) {
    if (this.busy) return;
    this.result = null; this.error = null;
    if (action === "changes" || action === "branch" || action === "commit") this.page = action;
    else if (action === "switch") {
      closeOverlay(props().overlay);
      openOverlay({ mod: "2code", kind: "dialog", width: 520, height: 0.7, props: { part: "branches", root: this.p.root, on: this.p.on } });
    } else if (INPUT.has(action)) { this.page = action; this.input.set_value(""); this.input.focus(); }
    else if (CONFIRM.has(action)) this.page = action;
    else this.execute(cx, action);
    cx.notify();
  }

  execute(cx, action = this.page) {
    if (this.busy || this.result) return;
    const name = this.input.value().trim(), { root, on } = this.p;
    if (INPUT.has(action) && !name) return;
    this.busy = true; this.error = null; this.result = null; cx.notify();
    cx.spawn(async (cx) => {
      try {
        if (action === "commitAll" || action === "amend" || action === "undoCommit") {
          const summary = (this.p.summary ?? "").trim(), body = (this.p.body ?? "").trim();
          if (action !== "undoCommit" && !summary) throw new Error(t("gitNeedSummary"));
          if (action === "commitAll") {
            const { files, hasHead, limited } = await readChanges(root, on);
            if (limited) throw new Error(t("changesLimited"));
            await stageFiles(root, on, files.filter((f) => f.unstaged), true, hasHead);
          }
          const args = action === "undoCommit" ? ["reset", "--soft", "HEAD^"]
            : ["commit", ...(action === "amend" ? ["--amend"] : []), "-m", summary, ...(body ? ["-m", body] : [])];
          const r = await exec("git", args, { cwd: root, on, timeout: 300000 });
          if (r.code !== 0) throw new Error((r.stderr || r.stdout || t("gitFailed")).trim());
          this.result = (r.stdout || r.stderr || t("gitSuccess")).trim();
        } else if (action === "stageAll" || action === "unstageAll") {
          const { files, hasHead, limited } = await readChanges(root, on);
          if (limited) throw new Error(t("changesLimited"));
          await stageFiles(root, on, files.filter((f) => action === "stageAll" ? f.unstaged : f.staged), action === "stageAll", hasHead);
        } else if (action === "pull") await pull(root, on);
        else if (action === "push") await push(root, on, this.p.upstream);
        else {
          if (INPUT.has(action)) {
            const valid = await exec("git", ["check-ref-format", "--branch", name], { cwd: root, on });
            if (valid.code !== 0) throw new Error(t("gitInvalidBranch"));
          }
          const args = action === "fetch" ? ["fetch"]
            : action === "create" ? ["switch", "-c", name]
            : action === "merge" ? ["merge", "--no-edit", "--", name]
            : action === "rebase" ? ["rebase", "--", name]
            : action === "rename" ? ["branch", "-m", "--", name]
            : action === "delete" ? ["branch", "-d", "--", name] : null;
          if (!args) throw new Error(t("gitFailed"));
          const r = await exec("git", args, { cwd: root, on, timeout: 300000 });
          if (r.code !== 0) throw new Error((r.stderr || r.stdout || t("gitFailed")).trim());
          this.result = (r.stdout || r.stderr || t("gitSuccess")).trim();
        }
        if (!this.result) this.result = t("gitSuccess");
      } catch (e) { this.error = String(e?.message ?? e); }
      finally { this.busy = false; cx.notify(); }
    });
  }

  render() {
    const th = theme(), input = INPUT.has(this.page), confirm = CONFIRM.has(this.page);
    const labels = Object.fromEntries(Object.values(ACTIONS).flat().map(([key, label]) => [key, label]));
    return v_flex().id("git-actions").size_full().p(8).gap(5).bg(th.popover).text_color(th.foreground).text_size(13)
      .when(this.page !== "root", (el) => el.child(h_flex().h(28).gap(6).items_center().cursor_pointer().text_color(th.muted)
        .on_click((_e, cx) => { if (!this.busy) { this.page = input ? "branch" : confirm ? "commit" : "root"; this.error = null; this.result = null; cx.notify(); } })
        .child(icon("chevron-left", 13)).child(t(input || confirm ? labels[this.page] : "gitMenu"))))
      .when(!input && !confirm, (el) => el.children((ACTIONS[this.page] ?? []).map(([action, label]) => h_flex().id(`git-${action}`).h(30).px(8).gap(8).items_center().rounded(5)
        .when(!this.busy, (e) => e.cursor_pointer().hover((s) => s.bg(th.hover)).on_click((_e, cx) => this.choose(action, cx)))
        .child(div().flex_1().child(t(label)))
        .when(action === "branch" || action === "changes" || action === "commit", (e) => e.child(icon("chevron-right", 12).text_color(th.dim))))))
      .when(input, (el) => el.child(div().px(8).text_size(12).text_color(th.dim).child(t("gitBranchName")))
        .child(div().px(8).rounded(5).border_1().border_color(th.input).bg(th.background)
          .child(Input.new(this.input).h(32).text_size(13).text_color(th.foreground)))
        .child(div().text_size(11).text_color(th.dim).child(t(this.page === "delete" ? "gitDeleteHint" : this.page === "rebase" ? "gitRebaseHint" : "gitActionHint")))
        .child(h_flex().justify_end().child(button("git-execute", th, this.busy ? t("gitWorking") : t(labels[this.page]), (_e, cx) => this.execute(cx), { primary: true, disabled: this.busy || Boolean(this.result) }))))
      .when(confirm, (el) => el.child(div().px(8).py(8).text_size(12).text_color(th.muted).child(t(this.page === "commitAll" ? "gitCommitAllHint" : this.page === "amend" ? "gitAmendHint" : "gitUndoHint")))
        .child(h_flex().justify_end().child(button("git-confirm", th, this.busy ? t("gitWorking") : t(labels[this.page]), (_e, cx) => this.execute(cx), { primary: true, disabled: this.busy || Boolean(this.result) }))))
      .when(this.busy && !input, (el) => el.child(div().px(8).text_color(th.dim).child(t("gitWorking"))))
      .when(Boolean(this.error || this.result), (el) => el.child(div().flex_1().min_h(0).overflow_y_scrollbar().px(8).py(4).text_size(11)
        .text_color(this.error ? th.ansi1 : th.ansi2).child(this.error || this.result)));
  }
}
