# WaveMaker Storybook Documentation Generator

Automated documentation generator for WaveMaker React Native components. Extracts component information from compiled JavaScript source maps and generates JSON documentation.

## Features

- **Extracts TypeScript source** from `.js.map` files
- **Parses component props** including inherited props from base classes
- **Extracts public methods** with parameters and return types
- **Identifies event handlers** (props starting with `on`)
- **Extracts style classes** from style definitions
- **Generates JSON output** for easy integration with Storybook
- **Configurable exclusions** - skip page and prefab components by default

## Installation

```bash
cd doc-generator
npm install
npm run build
```

## Usage

### Generate docs for all components

```bash
npm run dev -- generate --all --output ./output
```

Or with separate files per component:

```bash
npm run dev -- generate --all --output ./output
```

Or a single file with all components:

```bash
npm run dev -- generate --all --output ./output --single-file
```

### Generate docs for a specific component

```bash
npm run dev -- generate --component button --output ./output
```

### List all available components

```bash
npm run dev -- list
```

### Custom library path

If your library is in a different location:

```bash
npm run dev -- generate --all --library /path/to/@wavemaker/app-rn-runtime
```

## Configuration

The generator excludes certain component categories by default. See `src/config.ts`:

```typescript
export const DEFAULT_CONFIG = {
  // Categories excluded from documentation (not relevant for Storybook)
  excludeCategories: ['page', 'prefab'],

  // Specific components to exclude (add component names here)
  excludeComponents: [],
};
```

To modify exclusions, edit `src/config.ts` and rebuild:

```bash
npm run build
```

## Output Format

Each component generates a JSON file with the following structure:

```json
{
  "componentName": "button",
  "componentPath": "/path/to/component",
  "category": "basic",
  "props": [
    {
      "name": "caption",
      "type": "string",
      "optional": true,
      "defaultValue": "null",
      "inherited": false
    },
    {
      "name": "disabled",
      "type": "boolean",
      "optional": true,
      "defaultValue": "false",
      "inherited": true,
      "inheritedFrom": "BaseProps"
    }
  ],
  "methods": [
    {
      "name": "renderSkeleton",
      "visibility": "public",
      "returnType": "JSX.Element",
      "parameters": [
        {
          "name": "prop",
          "type": "WmButtonProps",
          "optional": false
        }
      ]
    }
  ],
  "events": [
    {
      "name": "onTap",
      "type": "Function",
      "parameters": "(e: Event, proxy: ComponentProxy)"
    }
  ],
  "styles": [
    {
      "className": "app-button",
      "description": "Default style class"
    },
    {
      "className": "btn-primary"
    },
    {
      "className": "btn-secondary"
    }
  ],
  "baseClass": "BaseProps"
}
```

## How It Works

1. **Source Extraction**: Reads `.js.map` files and extracts original TypeScript source code
2. **AST Parsing**: Uses TypeScript compiler API to parse the source and extract:
   - Class properties (props)
   - Method signatures
   - Style class definitions
3. **Inheritance Resolution**: Recursively resolves inherited props from base classes
4. **Event Detection**: Identifies event handlers from Function-type props starting with 'on'
5. **JSON Generation**: Outputs structured JSON documentation

## Project Structure

```
doc-generator/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── doc-generator.ts      # Main documentation generator
│   ├── source-extractor.ts   # Source map extraction
│   ├── ts-parser.ts          # TypeScript AST parser
│   └── types.ts              # Type definitions
├── output/                   # Generated documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Run without building

```bash
npm run dev -- generate --all
```

### Build for production

```bash
npm run build
node dist/index.js generate --all
```

### Watch mode

```bash
npm run watch
```

## Next Steps

After generating the JSON documentation, you can:

1. Import JSON in Storybook stories
2. Auto-generate prop tables
3. Generate markdown documentation
4. Create a documentation website
5. Validate story props against actual component props

## Troubleshooting

### "Library path not found"

Ensure `@wavemaker/app-rn-runtime` is installed in your storybook project:

```bash
cd ../rn-widgets-storybook
npm install
```

### "No source files found"

The component might not have `.js.map` files. Ensure the library was built with source maps enabled.

## License

MIT
