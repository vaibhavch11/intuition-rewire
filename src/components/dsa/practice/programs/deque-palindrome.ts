import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function isPalindrome(s) {
  const dq = [...s];               // the letters, front to back
  let head = 0;                    // JavaScript has no deque: an index marks the front
  while (dq.length - head > 1) {
    const first = dq[head++];      // remove from the front
    const last = dq.pop();         // remove from the back
    if (first !== last) return false;
  }
  return true;
}`;

const program: Program = {
  title: "Palindrome check with a deque (both ends)",
  code,
  fields: [{ key: "s", label: "word", kind: "text", maxLength: 12, hint: "racecar" }],
  examples: [
    { label: "racecar", input: { s: "racecar" } },
    { label: "noon", input: { s: "noon" } },
    { label: "rocket", input: { s: "rocket" } },
  ],
  check(input) {
    const s = String(input.s ?? "").trim();
    if (!s) return "Enter a word, like racecar.";
    if (s.length > 12) return "Use at most 12 letters so every step stays readable.";
    if (!/^[a-z]+$/i.test(s)) return "Use letters only, like level or rotor.";
    return null;
  },
  run(input) {
    const s = String(input.s).trim().toLowerCase();
    const r = recorder();
    let dq = [...s];

    const view = (tones: Record<number, CellTone> = {}) => ({
      arrays: [
        {
          name: "deque",
          values: dq,
          tones,
          pointers: pointersAt(dq.length, dq.length > 1 ? { front: 0, back: dq.length - 1 } : { "front = back": 0 }, { back: "tertiary" }),
        },
      ],
    });

    r.step(2, `Put the letters of **"${s}"** into a deque. A deque can remove from **both** ends in O(1): the front *and* the back.`, {
      ...view(),
      vars: { s, size: dq.length },
    });

    let round = 0;
    while (dq.length > 1) {
      round++;
      const first = dq[0];
      const last = dq[dq.length - 1];
      r.step(5, `Round ${round}: take **${first}** off the **front** and **${last}** off the **back**.`, {
        ...view({ 0: "write", [dq.length - 1]: "write" }),
        vars: { first, last, size: dq.length },
      });
      dq = dq.slice(1, -1);
      if (first !== last) {
        r.step(7, `**${first}** ≠ **${last}** — the two ends don't match, so "${s}" is **not** a palindrome. Return false.`, {
          ...view(),
          vars: { first, last, returned: "false" },
          done: true,
        });
        return r.frames;
      }
      r.step(7, `**${first}** = **${last}** — the ends match. ${dq.length > 1 ? "Carry on with the letters in between." : dq.length === 1 ? `Only **${dq[0]}** is left: a middle letter always matches itself.` : "Nothing is left."}`, {
        ...view(dq.length === 1 ? { 0: "success" } : {}),
        vars: { first, last, size: dq.length },
      });
    }

    r.step(9, `Every pair matched, so **"${s}"** reads the same forwards and backwards — it **is** a palindrome. Each letter left the deque once: **O(n)**.`, {
      ...view(),
      vars: { returned: "true" },
      done: true,
    });
    return r.frames;
  },
};

export default program;
