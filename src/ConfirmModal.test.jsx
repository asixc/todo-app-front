import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import ConfirmModal from "./ConfirmModal";

const __dirname = dirname(fileURLToPath(import.meta.url));
const loginCss = readFileSync(join(__dirname, "Login.css"), "utf-8");
const appCss = readFileSync(join(__dirname, "App.css"), "utf-8");

describe("CSS overflow fixes for mobile horizontal scroll", () => {
  it("h1 mobile tiene overflow-wrap y word-break", () => {
    expect(appCss).toMatch(/\.todoapp h1\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(appCss).toMatch(/\.todoapp h1\s*\{[^}]*word-break:\s*break-word/);
  });

  it("h1 mobile tiene font-size reducido (7vw en vez de 9vw)", () => {
    expect(appCss).toMatch(/clamp\(24px,\s*7vw,\s*40px\)/);
    expect(appCss).not.toMatch(/clamp\(28px,\s*9vw,\s*48px\)/);
  });

  it(".hint tiene overflow-wrap y word-break", () => {
    expect(loginCss).toMatch(/\.hint\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(loginCss).toMatch(/\.hint\s*\{[^}]*word-break:\s*break-word/);
  });

  it("ConfirmModal renderiza con itemName largo", () => {
    const longName = "a".repeat(80);
    const { container } = render(
      <ConfirmModal itemName={longName} onConfirm={() => {}} onCancel={() => {}} />
    );
    const hint = container.querySelector(".hint");
    expect(hint).toBeTruthy();
    expect(hint.textContent).toContain(longName);
  });

  it("App.css mobile tiene overflow-x: hidden como safety net", () => {
    expect(appCss).toMatch(/@media\s*\(max-width:\s*550px\)\s*\{[^}]*html,\s*body\s*\{[^}]*overflow-x:\s*hidden/);
  });

  it("el item-pending no usa cursor: not-allowed (ya no se muestra el cursor prohibido)", () => {
    expect(appCss).not.toMatch(/\.todo-list li\.item-pending \.toggle\s*\{[^}]*cursor:\s*not-allowed/);
  });

  it("App.css tiene regla para .version (subtitulo de versión centrado)", () => {
    expect(appCss).toMatch(/\.todoapp \.version\s*\{[^}]*display:\s*block/);
    expect(appCss).toMatch(/\.todoapp \.version\s*\{[^}]*text-align:\s*center/);
  });
});
