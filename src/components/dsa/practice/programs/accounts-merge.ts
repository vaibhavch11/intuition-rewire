import { lineOf } from "../graphs";
import { recorder, type CellTone, type Program } from "../types";

const code = `function accountsMerge(accounts) {
  const parent = accounts.map((_, i) => i);   // one group per account to start
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];          // path halving
      x = parent[x];
    }
    return x;
  };
  const owner = new Map();                    // email -> first account that listed it
  accounts.forEach((account, i) => {
    for (const email of account.slice(1)) {
      if (owner.has(email)) parent[find(i)] = find(owner.get(email));   // shared email: same person
      else owner.set(email, i);
    }
  });
  const groups = new Map();                   // root account -> all of its emails
  for (const [email, i] of owner) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(email);
  }
  return [...groups].map(([root, emails]) => [accounts[root][0], ...emails.sort()]);
}`;

const parseAccounts = (text: string) =>
  text
    .split(";")
    .map((part) => part.trim().split(/\s+/).filter(Boolean))
    .filter((parts) => parts.length > 0);

const program: Program = {
  title: "Accounts merge (Union-Find)",
  code,
  fields: [{ key: "accounts", label: "accounts (name then emails; ; between accounts)", kind: "text", maxLength: 120, hint: "John a@x b@x; John b@x c@x; Mary m@x" }],
  examples: [
    { label: "Example", input: { accounts: "John js@m jny@m; John js@m j00@m; Mary mary@m; John jb@m" } },
    { label: "Chain of links", input: { accounts: "Ann a@x b@x; Ann c@x d@x; Ann b@x c@x; Bo e@x" } },
    { label: "Same name, two people", input: { accounts: "Sam s1@x; Sam s2@x; Sam s1@x s3@x" } },
  ],
  check: (input) => {
    const accounts = parseAccounts(input.accounts as string);
    if (accounts.length < 1 || accounts.length > 6) return "Give between 1 and 6 accounts, separated by ;";
    for (const account of accounts) {
      if (account.length < 2) return `"${account.join(" ")}" needs a name and at least one email.`;
      if (!/^[A-Za-z]+$/.test(account[0])) return `"${account[0]}" should be a name made of letters.`;
      if (account.slice(1).some((email) => !email.includes("@"))) return `Every email needs an @, like a@x.`;
    }
    return null;
  },
  run(input) {
    const accounts = parseAccounts(input.accounts as string);
    const parent = accounts.map((_, i) => i);
    const owner = new Map<string, number>();
    const r = recorder();
    const find = (x: number) => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };

    const frame = (current: number | null, email: string | null, vars: Record<string, unknown> = {}) => {
      const tones: Record<number, CellTone> = {};
      if (current !== null) tones[current] = "primary";
      const ownerEntries = [...owner].map(([e, i]) => [e, i] as [string, number]);
      return {
        arrays: [{ name: "accounts", values: accounts.map((a) => a.join(" ")), tones }],
        maps: [
          {
            name: "owner (email → first account)",
            entries: ownerEntries,
            keyLabel: "email",
            valueLabel: "account",
            tones: Object.fromEntries(ownerEntries.flatMap(([e], k) => (e === email ? [[k, "write" as const]] : []))),
          },
          {
            name: "parent (account → parent)",
            entries: parent.map((p, i) => [i, p] as [number, number]),
            keyLabel: "account",
            valueLabel: "parent",
            tones: Object.fromEntries(parent.flatMap((p, i) => (p === i ? [] : [[i, "done" as const]]))),
          },
        ],
        vars,
      };
    };

    r.step(
      lineOf(code, "const parent = "),
      `Each account starts as its own person. Two accounts belong to the same person exactly when they **share an email** — directly or through a chain of other accounts. Union-Find merges them as the shared emails turn up.`,
      frame(null, null)
    );
    accounts.forEach((account, i) => {
      for (const email of account.slice(1)) {
        if (owner.has(email)) {
          const k = owner.get(email)!;
          const a = find(i);
          const b = find(k);
          parent[a] = b;
          r.step(
            lineOf(code, "if (owner.has(email))"),
            a === b
              ? `Account ${i} lists **${email}**, already seen in account ${k} — they're already in one group.`
              : `Account ${i} lists **${email}**, which account ${k} listed first: same person. Merge the groups — root ${a} now points at root ${b}.`,
            frame(i, email, { i, email })
          );
        } else {
          owner.set(email, i);
          r.step(lineOf(code, "else owner.set(email, i)"), `**${email}** is new: account ${i} is its first owner.`, frame(i, email, { i, email }));
        }
      }
    });

    const groups = new Map<number, string[]>();
    for (const [email, i] of owner) {
      const root = find(i);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(email);
    }
    const groupView = { name: "groups (root account → its emails)", values: [...groups].map(([root, emails]) => `${root} → ${emails.join(" ")}`) };
    const { maps } = frame(null, null);
    r.step(
      lineOf(code, "groups.get(root).push(email)"),
      `Every email goes to the group of its owner's root. ${groups.size} group${groups.size === 1 ? "" : "s"}, so ${groups.size} real ${groups.size === 1 ? "person" : "people"}.`,
      { arrays: [groupView], maps: [maps[1]] }
    );
    const result = [...groups].map(([root, emails]) => [accounts[root][0], ...[...emails].sort()].join(" "));
    r.step(
      lineOf(code, "return [...groups]"),
      `Each merged account is the name followed by its emails in sorted order. Sorting is the slowest part: **O(E log E)** for E emails.`,
      { arrays: [groupView, { name: "merged accounts", values: result }], done: true }
    );
    return r.frames;
  },
};

export default program;
