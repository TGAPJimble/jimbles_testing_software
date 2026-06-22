# Test File Format Specification

A test file is a plain-text file with a `.md` extension. It defines a set of **topics**, each containing one or more **questions**. Questions may include **hints** and **variant substitutions**.

---

## File Structure

```
# Optional comment

Topic Name:

1. Question text [choice A, choice B]
Hint: {Button label, Revealed content}
Hint: {Only for choice 1, Specific hint} [1]
2. Another question
```

A file contains any number of topics. Topics contain any number of questions.

---

## Syntax Rules

### Comments
Any line whose first non-whitespace character is `#` is ignored entirely.

```md
# This line is ignored
```

---

### Topics
A line that ends with `:` (after trimming whitespace) declares a new topic. Everything before the colon is the topic name. All questions that follow belong to this topic until the next topic header.

```md
Verb Conjugation (Group 1 - Godan):
```

> **Note:** A topic header ending in `:` cannot itself be a question. Do not use `:` at the end of a question line.

---

### Questions
A line beginning with `<integer>.` (e.g. `1.`, `2.`, `42.`) starts a new question. The number prefix is stripped; only the text matters. Numbers do not need to be sequential or unique.

```md
1. Write a sentence using the particle **で**.
2. Translate the following sentence into English.
```

---

### Continuation Lines
Any non-blank, non-comment line inside a topic that is **not** a topic header and **not** a numbered question is appended to the current question. This is how hints and multi-line questions are written.

---

### Hints
A continuation line in the form `Hint: {label, content}` attaches a collapsible hint to the question above it. A question may have any number of hints.

```
Hint: {Button label, Full revealed content}
Hint: {Variant-specific hint, Content} [selector; selector; ...]
```

| Part | Description |
|---|---|
| `label` | Text shown on the collapsed button (before the first `,`) |
| `content` | Text revealed when the user expands the hint (after the first `,`) |

If no comma is present, the same text is used for both label and content.

Both `label` and `content` support **bold** formatting with `**text**`.

```md
1. Conjugate the verb to its polite past form.
Hint: {Polite past ending, **〜ました**}
Hint: {Example verb, 食べる → 食べました}
```

#### Variant Filter Identifier

A hint may optionally be followed by a **variant filter** — a `[…]` block appended after the closing `}`. The filter determines which expanded variants will display this hint. A hint with no filter is shown on **all** variants.

```
Hint: {label, content} [selector; selector; ...]
```

The filter contains one **selector** per choice bracket in the question, separated by `;`. Each selector targets that bracket's options by **1-based index**:

| Selector syntax | Meaning |
|---|---|
| `*` | Any option (wildcard) |
| `1` | Exactly option 1 |
| `2-4` | Options 2, 3, or 4 (inclusive range) |
| `1-2, 5` | Options 1, 2, or 5 (mixed list) |

Whitespace inside the filter is ignored.

**Short-circuit rules:**
- A missing filter is equivalent to `[*]`.
- If the filter has **fewer selectors than choice brackets**, the missing trailing selectors default to `*`.
- A filter with a single `*` matches all variants regardless of how many brackets the question has.

```md
1. Conjugate [食べる, 飲む, 見る] into the [past tense, negative form, potential form].
Hint: {General rule, Remove the stem and add the suffix}
Hint: {Past tense only, Ends in **〜た**} [*; 1]
Hint: {食べる past only, 食べた} [1; 1]
Hint: {飲む or 見る, not past, 飲まない / 見ない etc.} [2-3; 2-3]
Hint: {Options 1 or 3 of verb, any form, Example hint} [1, 3]
```

In this example:
- The first hint (no filter) shows on all 9 variants.
- `[*; 1]` shows on every verb, but only the past-tense variant.
- `[1; 1]` shows only on 食べる + past.
- `[2-3; 2-3]` shows on 飲む or 見る, combined with negative or potential.
- `[1, 3]` shows on variants where the first bracket chose option 1 or 3 (食べる or 見る), regardless of the second bracket (missing selector → `*`).

---

### Variants (Choice Expansion)
A `[option1, option2, ...]` bracket anywhere in a question text will expand the question into **multiple questions**, one for each option. Multiple bracket groups in a single question produce the **cartesian product** of all combinations.

```md
1. Conjugate [食べる, 飲む] into the [past tense, negative form].
```

This expands to **4** questions:
1. Conjugate 食べる into the past tense.
2. Conjugate 食べる into the negative form.
3. Conjugate 飲む into the past tense.
4. Conjugate 飲む into the negative form.

Variant expansion applies to question text only. Square brackets in hint `{label, content}` text are treated as literal characters, not as choice brackets.

The **variant filter** `[…]` that follows a hint line (outside the `{}`) is separate from the question's choice brackets — it is a filter condition, not an expansion.

---

### Bold Text
Surround text with `**` to render it bold in both question text and hint content.

```md
1. Describe a subject using a **な-adjective** in the **past tense**.
Hint: {Past tense suffix, **〜でした**}
```

---

## Complete Example

```md
# Japanese Particles

Basic Particles Location:

1. Construct a sentence using a [transitive verb, intransitive verb] at a [specific place, familiar place].
Hint: {Particle needed, **で**}
Hint: {Transitive verb tip, The verb acts on an object} [1]
Hint: {Intransitive verb tip, The verb describes a state} [2]
Hint: {Specific place example, コンビニ、図書館} [*; 1]
2. Write a sentence about a daily activity done at a [school, library].
Hint: {Particle needed, **で**}

Basic Particles Direction:

1. Write a sentence describing movement [to, from] a destination.
Hint: {Direction particle, **に**} [1]
Hint: {Source particle, **から**} [2]
Hint: {Both particles tip, に marks destination · から marks origin}
```

---

## Parser Behaviour Notes

- Line order is significant. Topics and questions are processed top-to-bottom.
- Blank lines are ignored anywhere in the file.
- A line that ends in `:` **always** starts a new topic, even if a question is in progress. Avoid using `:` as the last character of a question.
- Variant expansion happens at test-generation time, not at parse time. The raw template (including hint lines with their filters) is stored and expanded when the test is built.
- Variant filter matching is performed per-variant after expansion. For each generated variant, the index of the chosen option for each bracket (1-based) is compared against the corresponding selector in the filter.
- Hint filter indices align with the **left-to-right order of `[…]` brackets** as they appear in the question text.
