// Search saved file contents in the current checkout with ripgrep.
import { div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { props, theme, exec, closeOverlay } from "herdr";
import { git } from "../lib/git.js";
import { openFile } from "../lib/editor.js";
import { t } from "../lib/i18n.js";
import { icon } from "../lib/ui.js";

const LIMIT = 200;

// ripgrep reports UTF-8 byte offsets; JS slices use UTF-16 code units.
function byteOffset(text, offset) {
  let bytes = 0, index = 0;
  for (const ch of text) {
    if (bytes >= offset) break;
    const code = ch.codePointAt(0);
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    index += ch.length;
  }
  return index;
}

function segments(text, matches) {
  const result = []; let at = 0;
  for (const match of matches ?? []) {
    const start = byteOffset(text, match.start), end = byteOffset(text, match.end);
    if (start < at || end <= start || end > text.length) continue;
    if (start > at) result.push({ text: text.slice(at, start), match: false });
    result.push({ text: text.slice(start, end), match: true });
    at = end;
  }
  if (at < text.length) result.push({ text: text.slice(at), match: false });
  return result;
}

export class TextSearch {
  init(p, cx) {
    this.p = p; this.root = null; this.results = []; this.at = 0;
    this.sequence = 0; this.loading = false; this.error = false; this.limited = false;
    this.input = InputState.new({ placeholder: t("textSearchPlaceholder") });
    this.input.on("change", (_e, cx) => this.schedule(cx));
    this.input.on("submit", (_e, cx) => this.pick(this.results[this.at], cx));
    this.input.focus();
    cx.timer.after(200, () => this.input.focus());
    cx.spawn(async (cx) => {
      const top = await git(p.cwd, ["rev-parse", "--show-toplevel"], p.on);
      this.root = top.ok ? top.out : p.cwd;
      this.schedule(cx);
    });
  }

  schedule(cx) {
    const query = this.input.value(), seq = ++this.sequence;
    this.results = []; this.at = 0; this.error = false; this.limited = false;
    this.loading = Boolean(query && this.root); cx.notify();
    if (!query || !this.root) return;
    cx.spawn(async (cx) => {
      await cx.sleep(300);
      if (seq !== this.sequence) return;
      try {
        const r = await exec("rg", ["--json", "--fixed-strings", "--ignore-case", "--max-filesize", "1M", "--max-columns", "400", "--max-columns-preview", "--", query, "."], { cwd: this.root, on: this.p.on, timeout: 15000 });
        if (seq !== this.sequence) return;
        if (r.code !== 0 && r.code !== 1) { this.error = true; return; }
        const rows = [];
        for (const line of r.stdout.split("\n")) {
          if (!line) continue;
          let item; try { item = JSON.parse(line); } catch { continue; }
          if (item.type !== "match" || !item.data.path.text || !item.data.lines.text) continue;
          const text = item.data.lines.text.replace(/[\r\n]+$/, "");
          rows.push({ path: item.data.path.text.replace(/^\.\//, ""), line: item.data.line_number, segments: segments(text, item.data.submatches) });
          if (rows.length > LIMIT) break;
        }
        this.limited = rows.length > LIMIT; this.results = rows.slice(0, LIMIT);
      } catch { if (seq === this.sequence) this.error = true; }
      finally { if (seq === this.sequence) { this.loading = false; cx.notify(); } }
    });
  }

  pick(row, cx) {
    if (!row || this.busy) return;
    this.busy = true; cx.notify();
    cx.spawn(async (cx) => {
      try { await openFile(cx, { space: this.p.space, path: `${this.root}/${row.path}`, on: this.p.on, root: this.root }); }
      finally { closeOverlay(props().overlay); }
    });
  }

  key(e, cx) {
    if (e.key === "escape") return closeOverlay(props().overlay);
    if ((e.key === "down" || e.key === "up") && this.results.length) {
      this.at = (this.at + (e.key === "down" ? 1 : this.results.length - 1)) % this.results.length;
      cx.stop_propagation(); cx.notify();
    }
  }

  render() {
    const th = theme();
    if (this.busy) return div();
    return v_flex().id("text-search").size_full().bg(th.popover).text_color(th.foreground).text_size(13)
      .on_key_down((e, cx) => this.key(e, cx))
      .child(h_flex().h(44).px(14).gap(8).items_center().border_b(1).border_color(th.border)
        .child(icon("search", 15).text_color(th.dim))
        .child(div().flex_1().child(Input.new(this.input).h(32).text_size(14).text_color(th.foreground))))
      .child(v_flex().id("text-search-results").flex_1().min_h(0).p(6).gap(1).overflow_y_scrollbar()
        .children(this.results.map((row, i) => v_flex().id(`match-${i}`).flex_none().p(8).gap(3).rounded(5).cursor_pointer()
          .bg(i === this.at ? th.selected : th.popover).hover((s) => s.bg(th.hover))
          .on_click((_e, cx) => this.pick(row, cx))
          .child(div().text_size(11.5).text_color(th.dim).truncate().child(`${row.path}:${row.line}`))
          .child(h_flex().min_w(0).overflow_hidden().children(row.segments.map((part) => div().flex_none().whitespace_nowrap()
            .when(part.match, (el) => el.bg(th.ansi3).text_color(th.background).rounded(2))
            .child(part.text))))))
        .when(this.loading, (el) => el.child(div().p(10).text_color(th.dim).child("…")))
        .when(this.error, (el) => el.child(div().p(10).text_color(th.dim).child(t("textSearchError"))))
        .when(!this.loading && !this.error && !this.results.length, (el) => el.child(div().p(10).text_color(th.dim).child(t(this.input.value() ? "textSearchEmpty" : "textSearchHint"))))
        .when(this.limited, (el) => el.child(div().p(10).text_color(th.dim).child(t("textSearchLimited")))));
  }
}
