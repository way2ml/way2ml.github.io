---
author: "Hugo Authors and Jie Huang"
title: "Author Guidelines for Markdown Syntax and Math Typesetting"
date: "2019-03-11"
description: "Sample article showcasing basic Markdown syntax and formatting for HTML elements."
tags: [
    "Markdown", "LaTeX"
]
categories: [
    "Tools",
]
series: ["Themes Guide"]
aliases: ["migrate-from-jekyl"]
---
This guide covers essential Markdown syntax and math typesetting for authors using Hugo. It details headings, paragraphs, blockquotes, tables, code blocks, lists, and symbol usage. The document also explains how to embed rich content with Hugo’s shortcodes and create diagrams using Mermaid. Additionally, it outlines how to enable mathematical notation with KaTeX, providing both global and per-page configuration steps.
<!--more-->

### Headings

The following HTML `<h2>`—`<h6>` elements represent five levels of section headings. `<h1>` is for Title. `<h2>` is the highest section level while `<h6>` is the lowest. With `numberedSubtitles` param enabled, items will be numbered


### Paragraph

Xerum, quo qui aut unt expliquam qui dolut labo. Aque venitatiusda cum, voluptionse latur sitiae dolessi aut parist aut dollo enim qui voluptate ma dolestendit peritin re plis aut quas inctum laceat est volestemque commosa as cus endigna tectur, offic to cor sequas etum rerum idem sintibus eiur? Quianimin porecus evelectur, cum que nis nust voloribus ratem aut omnimi, sitatur? Quiatem. Nam, omnis sum am facea corem alique molestrunt et eos evelece arcillit ut aut eos eos nus, sin conecerem erum fuga. Ri oditatquam, ad quibus unda veliamenimin cusam et facea ipsamus es exerum sitate dolores editium rerore eost, temped molorro ratiae volorro te reribus dolorer sperchicium faceata tiustia prat.

Itatur? Quiatae cullecum rem ent aut odis in re eossequodi nonsequ idebis ne sapicia is sinveli squiatum, core et que aut hariosam ex eat. Aque venitatiusda cum, voluptionse latur sitiae dolessi aut parist aut dollo enim qui voluptate ma dolestendit peritin re plis aut quas inctum laceat est volestemque commosa as cus endigna tectur, offic to cor sequas etum rerum idem sintibus eiur? Quianimin porecus evelectur, cum que nis nust voloribus ratem aut omnimi, sitatur? Quiatem. Nam, omnis sum am facea corem alique molestrunt et eos evelece arcillit ut aut eos eos nus, sin conecerem erum fuga. Ri oditatquam, ad quibus unda veliamenimin cusam et facea ipsamus es exerum sitate dolores editium rerore eost, temped molorro ratiae volorro te reribus dolorer sperchicium faceata tiustia prat.

### Blockquotes

The blockquote element represents content that is quoted from another source, optionally with a citation which must be within a `footer` or `cite` element, and optionally with in-line changes such as annotations and abbreviations.

Blockquote without attribution

> Tiam, ad mint andaepu dandae nostion secatur sequo quae.
> **Note** that you can use *Markdown syntax* within a blockquote.
> > **Note** that you can put a blockquote inside a blockquote

Blockquote with attribution

> Don't communicate by sharing memory, share memory by communicating.<br>
> — Rob Pike [^1]

[^1]: The above quote is excerpted from Rob Pike's [talk](https://www.youtube.com/watch?v=PAAkCSZUG1c) during Gopherfest, November 18, 2015.

### Tables

Tables aren't part of the core Markdown spec, but Hugo supports them out-of-the-box.

   Name | Age
--------|------
    Bob | 27
  Alice | 23

Inline Markdown within tables

| Italics   | Bold     | Code   | Strikethrough     | Underline            | Highlight              |
| --------  | -------- | ------ | ----------------- | -------------------- | ---------------------- |
| *italics* | **bold** | `code` | ~~strikethrough~~ | <ins>underline</ins> | <mark>highlight</mark> |

### Code Blocks

Code block with backticks

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Example HTML5 Document</title>
</head>
<body>
  <p>Test</p>
</body>
</html>
```

Code block indented with four spaces

    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Example HTML5 Document</title>
    </head>
    <body>
      <p>Test</p>
    </body>
    </html>

Code block with Hugo's internal highlight shortcode
{{< highlight html >}}
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Example HTML5 Document</title>
</head>
<body>
  <p>Test</p>
</body>
</html>
{{< /highlight >}}

### List Types

Ordered List

1. Item 1
   1. Sub-item 1.1
   2. Sub-item 1.2
   3. Sub-item 1.3
2. Item 2
3. Item 3

Unordered List

- Fruit
  - Apple
  - Orange
  - Banana
- Dairy
  - Milk
  - Cheese

Checklist

- [x] Item 1
- [ ] Item 2
  - [x] Sub-item 2.1
  - [ ] Sub-item 2.2 
- [ ] Item 3 

Definition List

First Term
: This is the definition of the first term.

Second Term
: This is one definition of the second term.
: This is another definition of the second term.

### Symbols

You can use the HTML entity for whatever symbol you want to use. For example, if you want to display the copyright sign (©), you can copy and paste the HTML entity for copyright `(&copy;)` into your Markdown document.

```markdown
Copyright (©) — &copy;
Registered trademark (®) — &reg;
Trademark (™) — &trade;
Euro (€) — &euro;
Left arrow (←) — &larr;
Up arrow (↑) — &uarr;
Right arrow (→) — &rarr;
Down arrow (↓) — &darr;
Degree (°) — &#176;
Pi (π) — &#960;
```

For a complete list of available HTML entities, refer to Wikipedia’s page on [HTML entities](https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references).

### Other Elements — abbr, sub, sup, kbd, mark

[This is a comment that will be hidden.]: #

<abbr title="Graphics Interchange Format">GIF</abbr> is a bitmap image format. H<sub>2</sub>O X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup> Press <kbd><kbd>CTRL</kbd>+<kbd>ALT</kbd>+<kbd>Delete</kbd></kbd> to end the session. Most <mark>salamanders</mark> are nocturnal, and hunt for insects, worms, and other small creatures. The [`emojify`](https://gohugo.io/functions/emojify/) function can be called directly in templates or [Inline Shortcodes](https://gohugo.io/templates/shortcode-templates/#inline-shortcodes). To enable emoji globally, set `enableEmoji` to `true` in your site's [configuration](https://gohugo.io/getting-started/configuration/) and then you can type emoji shorthand codes directly in content files; e.g.

<p><span class="nowrap"><span class="emojify">🙈</span> <code>:see_no_evil:</code></span>  <span class="nowrap"><span class="emojify">🙉</span> <code>:hear_no_evil:</code></span>  <span class="nowrap"><span class="emojify">🙊</span> <code>:speak_no_evil:</code></span></p>
<br>

The [Emoji cheat sheet](http://www.emoji-cheat-sheet.com/) is a useful reference for emoji shorthand codes.

---

**N.B.** The above steps enable Unicode Standard emoji characters and sequences in Hugo, however the rendering of these glyphs depends on the browser and the platform. To style the emoji you can either use a third party emoji font or a font stack; e.g.

```css
.emoji {
  font-family: Apple Color Emoji, Segoe UI Emoji, NotoColorEmoji, Segoe UI Symbol, Android Emoji, EmojiSymbols;
}
```

### Math Typesetting

Mathematical notation in a Hugo project can be enabled by using third party JavaScript libraries. In this example we will be using [$\KaTeX$](https://katex.org/)

- Create a partial under `/layouts/partials/math.html`
- Within this partial reference the [Auto-render Extension](https://katex.org/docs/autorender.html) or host these scripts locally.
- Include the partial in your templates like so:

```bash
{{ if or .Params.math .Site.Params.math }}
{{ partial "math.html" . }}
{{ end }}
```

- To enable $\KaTeX$ globally set the parameter `math` to `true` in a project's configuration
- To enable $\KaTeX$ on a per page basis include the parameter `math: true` in content files

**Note:** Use the online reference of [Supported $\TeX$ Functions](https://katex.org/docs/supported.html)

<p>
Inline math: $\varphi = 1+\frac{1}{1+\frac{1}{1+\cdots}}$
</p>

$$
\mathcal L_{\mathcal T}(\vec{\lambda})
= \sum_{(\mathbf{x},\mathbf{s})\in \mathcal T}
    \log P(\mathbf{s}\mid\mathbf{x}) - \sum_{i=1}^m
    \frac{\lambda_i^2}{2\sigma^2}
$$


### Rich Content
Hugo ships with several [Built-in Shortcodes](https://gohugo.io/content-management/shortcodes/#use-hugos-built-in-shortcodes) for rich content, along with a [Privacy Config](https://gohugo.io/about/hugo-and-gdpr/) and a set of Simple Shortcodes that enable static and no-JS versions of various social media embeds.

YouTube Privacy Enhanced Shortcode

{{< youtube ZJthWmvUzzc >}}

<br>


Twitter Simple Shortcode

{{< tweet user="SanDiegoZoo" id="1453110110599868418" >}}

<br>


Vimeo Simple Shortcode

{{< vimeo_simple 48912912 >}}

<br>


Mermaid

Flowchart

```mermaid
graph LR;
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
```

Sequence Digram

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail...
    John-->Alice: Great!
    John->Bob: How about you?
    Bob-->John: Jolly good!
```

Gantt

```mermaid
gantt
dateFormat  YYYY-MM-DD
title Adding GANTT diagram to mermaid
excludes weekdays 2014-01-10

section A section
Completed task            :done,    des1, 2014-01-06,2014-01-08
Active task               :active,  des2, 2014-01-09, 3d
Future task               :         des3, after des2, 5d
Future task2              :         des4, after des3, 5d
```

Class Diagram

```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
```

State Diagram

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

Git Graph

```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit
```

Entity Relationship Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
```

User Journey

```mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

Pie Chart

```mermaid
pie
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
```

Requirement Diagram

```mermaid
requirementDiagram

requirement test_req {
id: 1
text: the test text.
risk: high
verifymethod: test
}

element test_entity {
type: simulation
}

test_entity - satisfies -> test_req
```
