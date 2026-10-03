import { pointersAt, recorder, type CellTone, type Program } from "../types";

const code = `function asteroidCollision(asteroids) {
  let top = -1;                      // asteroids[0..top] are the survivors (a stack)
  for (const a of asteroids) {
    let alive = true;
    while (alive && a < 0 && top >= 0 && asteroids[top] > 0) {
      if (asteroids[top] < -a) {
        top--;                         // the right-mover explodes
      } else {
        if (asteroids[top] === -a) top--;   // same size: both explode
        alive = false;                      // a explodes
      }
    }
    if (alive) asteroids[++top] = a;
  }
  return asteroids.slice(0, top + 1);
}`;

const arrow = (a: number) => (a > 0 ? `${a} →` : `← ${-a}`);

const program: Program = {
  title: "Asteroid collision (survivors stack in place)",
  code,
  fields: [{ key: "asteroids", label: "asteroids", kind: "array", maxLength: 8, min: -99, max: 99 }],
  examples: [
    { label: "Example 1", input: { asteroids: [5, 10, -5] } },
    { label: "Chain reaction", input: { asteroids: [10, 2, -5] } },
    { label: "Equal sizes", input: { asteroids: [8, -8] } },
    { label: "Big left-mover", input: { asteroids: [1, 4, -6, 3, -2] } },
  ],
  check(input) {
    return (input.asteroids as number[]).includes(0) ? "asteroids: 0 isn't allowed — the sign is the direction, so every asteroid needs one." : null;
  },
  run(input) {
    const original = input.asteroids as number[];
    const arr = [...original];
    const n = arr.length;
    const r = recorder();
    let top = -1;

    const view = (i: number | undefined, tones: Record<number, CellTone> = {}) => {
      const base: Record<number, CellTone> = {};
      for (let k = 0; k <= top; k++) base[k] = "done";
      if (i !== undefined) for (let k = top + 1; k < i; k++) base[k] = "muted";
      return {
        arrays: [
          {
            name: "asteroids",
            values: arr.map(arrow),
            tones: { ...base, ...tones },
            pointers: pointersAt(n, { top: top >= 0 ? top : undefined, a: i }, { top: "tertiary" }),
          },
        ],
        stacks: [{ name: "survivors (asteroids[0..top])", values: arr.slice(0, top + 1).map(arrow) }],
      };
    };

    r.step(2, `Positive asteroids move **right →**, negative ones move **left ←**. Only a right-mover followed by a left-mover can meet. The survivors so far sit at the front of the array, used as a stack: \`asteroids[0..top]\`.`, {
      ...view(undefined),
      vars: { top },
    });

    for (let i = 0; i < n; i++) {
      const a = original[i];
      let alive = true;
      while (alive && a < 0 && top >= 0 && arr[top] > 0) {
        const t = arr[top];
        if (t < -a) {
          r.step(7, `${arrow(a)} meets ${arrow(t)}. ${-a} is bigger, so the right-mover **${t} explodes** (top--). ${arrow(a)} keeps flying.`, {
            ...view(i, { [top]: "write", [i]: "primary" }),
            vars: { a, top: top - 1 },
          });
          top--;
        } else if (t === -a) {
          r.step(9, `${arrow(a)} meets ${arrow(t)}: the **same size**, so **both explode**.`, {
            ...view(i, { [top]: "write", [i]: "write" }),
            vars: { a, top: top - 1 },
          });
          top--;
          alive = false;
        } else {
          r.step(10, `${arrow(a)} meets ${arrow(t)}. ${t} is bigger, so **${arrow(a)} explodes** and the survivors are unchanged.`, {
            ...view(i, { [top]: "success", [i]: "write" }),
            vars: { a, top },
          });
          alive = false;
        }
      }
      if (alive) {
        const reason =
          a > 0
            ? "It moves right, so nothing already in the list can catch it (yet)"
            : top < 0
              ? "No survivors to its left, so it flies away freely"
              : "Every survivor to its left also moves left — they never meet";
        top++;
        arr[top] = a;
        r.step(13, `${arrow(a)} survives. ${reason}. Push it: write it at index ${top}.`, {
          ...view(i, { [top]: "primary" }),
          vars: { a, top },
        });
      }
    }

    const result = arr.slice(0, top + 1);
    r.step(15, `Answer: **[${result.join(", ")}]**. Each asteroid is pushed once and destroyed at most once — **O(n) time** — and the survivors reuse the input array: **O(1) extra space**.`, {
      ...view(n, Object.fromEntries(result.map((_, k) => [k, "success" as CellTone]))),
      vars: { top },
      done: true,
    });
    return r.frames;
  },
};

export default program;
