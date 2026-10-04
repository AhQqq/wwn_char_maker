import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildFocusFamilies, dependentFocusIds, focusLockReasons, normalizeFocusSelection, toggleFocusSelection,
} from "../../frontend/src/focusSelection.js";
import type { FocusClass, FocusOption } from "../../frontend/src/focusSelection.js";
import { eligibleSelectedFoci } from "./focusBonuses.js";

function data<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`../../frontend/data/${name}.json`, import.meta.url), "utf8")) as T;
}
const foci = data<FocusOption[]>("foci");
const classes = data<FocusClass[]>("classes");
const warrior = classes.filter((option) => option.id === "warrior");
const mage = classes.filter((option) => option.id === "high");
const focus = (id: string) => foci.find((item) => item.id === id)!;

test("all 153 options remain in 102 stable families, including locked levels and classes", () => {
  const families = buildFocusFamilies(foci);
  assert.equal(families.length, 102);
  assert.equal(families.filter((family) => family.levels.length === 2).length, 51);
  assert.deepEqual(families.flatMap((family) => family.levels.map((item) => item.id)).sort(), foci.map((item) => item.id).sort());
  assert.equal(new Set(families.map((family) => family.category)).size, 9);
  assert.ok(families.some((family) => family.id === "divination1"));
  const selected = toggleFocusSelection("alert1", [], foci, warrior, 3);
  assert.deepEqual(selected, ["alert1"]);
  assert.deepEqual(buildFocusFamilies(foci), families);
});

test("same-name foci remain separate; only explicit prerequisite links join levels", () => {
  const families = buildFocusFamilies(foci);
  assert.equal(families.find((family) => family.id === "dwarves1")?.levels.length, 1);
  assert.deepEqual(families.find((family) => family.id === "dwarves_21")?.levels.map((item) => item.id), ["dwarves_21", "dwarves_22"]);
  assert.deepEqual(buildFocusFamilies([focus("alert2"), focus("alert1")])[0]?.levels.map((item) => item.id), ["alert1", "alert2"]);
  const unlinked = { ...focus("alert2"), requirements: [] };
  assert.equal(buildFocusFamilies([focus("alert1"), unlinked]).length, 2);
  const ambiguous = { ...focus("alert2"), requirements: [{ condition: "has_focus", id: "alert1" }, { condition: "has_focus", id: "dwarves1" }] };
  assert.equal(buildFocusFamilies([focus("alert1"), ambiguous]).length, 2);
});

test("higher levels stay readable but locked even with their parents and spare picks", () => {
  for (const option of foci.filter((item) => item.level > 1)) {
    const parents = option.requirements.filter((rule) => rule.condition === 'has_focus').map((rule) => rule.id);
    for (const selected of [[], parents]) {
      assert.ok(focusLockReasons(option, selected, foci, warrior, classes, 100).some((reason) => reason.includes('only level-1')), option.id);
      assert.deepEqual(toggleFocusSelection(option.id, selected, foci, warrior, 100), selected);
    }
    assert.ok(buildFocusFamilies(foci).some((family) => family.levels.includes(option)));
  }
});

test("class locks explain the restriction and follow class archetypes", () => {
  assert.ok(focusLockReasons(focus("divination1"), [], foci, warrior, classes, 3).includes('필요 클래스: 마법사'));
  assert.deepEqual(toggleFocusSelection("divination1", [], foci, warrior, 3), []);
  assert.deepEqual(focusLockReasons(focus("divination1"), [], foci, mage, classes, 3), []);
  assert.deepEqual(toggleFocusSelection("divination1", [], foci, mage, 3), ["divination1"]);
});

test("blocked upgrades do not spend picks and saved upgrades can still be removed", () => {
  let selected = toggleFocusSelection("alert1", [], foci, warrior, 2);
  selected = toggleFocusSelection("alert2", selected, foci, warrior, 2);
  assert.deepEqual(selected, ["alert1"]);
  selected = toggleFocusSelection("dwarves1", selected, foci, warrior, 2);
  assert.deepEqual(selected, ["alert1", "dwarves1"]);
  assert.ok(focusLockReasons(focus("lucky1"), selected, foci, warrior, classes, 2).some((reason) => reason.includes("No focus picks")));
  assert.deepEqual(toggleFocusSelection("lucky1", selected, foci, warrior, 2), selected);
  assert.deepEqual(toggleFocusSelection("alert2", ["alert1", "alert2"], foci, warrior, 2), ["alert1"]);
});

test("removing level 1 removes its upgrades, but keeps unrelated selections", () => {
  const selected = ["dwarves1", "alert1", "alert2"];
  assert.deepEqual(dependentFocusIds("alert1", selected, foci), ["alert2"]);
  assert.deepEqual(toggleFocusSelection("alert1", selected, foci, warrior, 3), ["dwarves1"]);
});

test("dependent removal is transitive and unknown or cyclic requirements fail closed", () => {
  const third = { ...focus("alert2"), id: "third", level: 3, requirements: [{ condition: "has_focus", id: "alert2" }] };
  const catalog = [...foci, third];
  assert.deepEqual(dependentFocusIds("alert1", ["alert1", "alert2", "third"], catalog), ["alert2", "third"]);
  const unsupported = { ...focus("alert1"), requirements: [{ condition: "unknown", id: "test" }] };
  assert.deepEqual(toggleFocusSelection("alert1", [], [unsupported], warrior, 3), []);
  const cycle = { ...focus("alert1"), requirements: [{ condition: "has_focus", id: "alert2" }] };
  assert.deepEqual(normalizeFocusSelection(["alert1", "alert2"], [cycle, focus("alert2")], warrior, 3), []);
});

test("restoration and class changes discard invalid or orphaned levels atomically", () => {
  const ids = ["all_directions_edge_style1", "all_directions_edge_style2", "alert1"];
  assert.deepEqual(normalizeFocusSelection(ids, foci, mage, 3), ["alert1"]);
  assert.deepEqual(normalizeFocusSelection(["alert2", "alert1"], foci, warrior, 1), ["alert1"]);
  assert.deepEqual(normalizeFocusSelection(["missing", "alert2", "alert1", "alert1"], foci, warrior, 3), ["alert1"]);
  assert.deepEqual(normalizeFocusSelection(["alert1"], foci, warrior, 0), []);
});

test("frontend prerequisite eligibility agrees with backend across every class", () => {
  const allIds = foci.map((item) => item.id);
  for (const option of classes) {
    const expected = eligibleSelectedFoci(allIds, foci, [option]).map((item) => item.id).sort();
    assert.deepEqual(normalizeFocusSelection(allIds, foci, [option], allIds.length).sort(), expected);
  }
});
