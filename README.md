# Shreg web

The visual hub for Shreg — upload an Obsidian vault folder and get an interactive, force-directed graph of its notes and `[[wikilinks]]` right in the browser.

## Status

First working version: folder upload, client-side parsing, force-directed graph rendering, click-to-inspect node details, and click-through navigation along links. Not yet built: publishing a graph to a shared community feed (the next milestone) or generating a downloadable "Knowledge Lego" package.

## How it works

Everything runs in the browser — **your notes are never uploaded anywhere.** Selecting a folder reads each `.md` file locally (via the browser's folder-picker input), and the same parsing logic used by the [compiler](https://github.com/Shreg-ai/compiler) package (frontmatter + `[[wikilink]]` extraction, degree/cluster computation) runs client-side in `src/lib/graph/`. [`@xyflow/react`](https://reactflow.dev) renders the result, laid out with a `d3-force` simulation for the classic node-link "knowledge graph" look.

## Development

```sh
npm install
npm run dev         # http://localhost:3000
npm test            # unit tests for the parsing/layout logic
npm run typecheck
npm run build
```

## License

[Functional Source License, Version 1.1, ALv2 Future License](./LICENSE.md). Free for internal use, education, and research; converts to Apache 2.0 two years after each release. See [fsl.software](https://fsl.software) for a plain-language explanation.
