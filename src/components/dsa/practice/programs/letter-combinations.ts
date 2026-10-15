import { lineOf } from "../graphs";
import { pointersAt, recorder, toneRange, type Program } from "../types";

const code = `function letterCombinations(digits) {
  if (digits === "") return [];
  const keys = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
  const result = [];
  const path = [];                            // the letters chosen so far
  const choose = (i) => {
    if (i === digits.length) {                // one letter per digit: a full combination
      result.push(path.join(""));
      return;
    }
    for (const letter of keys[digits[i]]) {
      path.push(letter);                      // choose
      choose(i + 1);                          // explore the rest
      path.pop();                             // un-choose, to try the next letter
    }
  };
  choose(0);
  return result;
}`;

const KEYS = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];

const program: Program = {
  title: "Letter combinations of a phone number (backtracking)",
  code,
  fields: [{ key: "digits", label: "digits (2 to 9)", kind: "text", maxLength: 3, hint: "digits 2-9, like 23" }],
  examples: [
    { label: "Example", input: { digits: "23" } },
    { label: "One digit", input: { digits: "7" } },
    { label: "Three digits", input: { digits: "293" } },
  ],
  check: (input) => (/^[2-9]{1,3}$/.test(input.digits as string) ? null : "digits: 1 to 3 digits from 2 to 9, like 23."),
  run(input) {
    const digits = input.digits as string;
    const result: string[] = [];
    const path: string[] = [];
    const r = recorder();

    const frame = (i: number | null) => ({
      arrays: [
        { name: "digits", values: [...digits].map((d) => `${d}: ${KEYS[Number(d)]}`), tones: i === null ? {} : toneRange(0, i - 1, "done", i < digits.length ? { [i]: "primary" } : {}), pointers: i === null || i >= digits.length ? {} : pointersAt(digits.length, { i }) },
        { name: "result", values: [...result] },
      ],
      stacks: [{ name: "path (letters chosen)", values: [...path] }],
    });

    r.step(lineOf(code, "const path = []"), `Build each combination **one digit at a time**. For the current digit, try each of its letters in turn: add it to the path, fill in the remaining digits, then take it back off and try the next letter. Every route to the bottom is one combination.`, frame(0));
    const choose = (i: number) => {
      if (i === digits.length) {
        result.push(path.join(""));
        r.step(lineOf(code, "result.push(path.join"), `A letter for every digit: **"${path.join("")}"** is complete. Record it and go back.`, frame(i));
        return;
      }
      const letters = KEYS[Number(digits[i])];
      for (const letter of letters) {
        path.push(letter);
        r.step(lineOf(code, "path.push(letter)"), `Digit '${digits[i]}' can be ${[...letters].join(", ")}. Choose **'${letter}'** and move on to ${i + 1 < digits.length ? `digit '${digits[i + 1]}'` : "the end"}.`, frame(i));
        choose(i + 1);
        path.pop();
        r.step(lineOf(code, "path.pop()"), `Back at digit '${digits[i]}': take '${letter}' off the path${letter !== letters[letters.length - 1] ? " to try the next letter" : " — all its letters are done"}.`, frame(i));
      }
    };
    choose(0);
    r.step(lineOf(code, "return result"), `All **${result.length}** combinations found. With up to 4 letters per digit, n digits give up to 4ⁿ combinations, each n letters long: **O(4ⁿ · n)**.`, { ...frame(null), done: true });
    return r.frames;
  },
};

export default program;
