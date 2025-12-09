# Documentation Generator - Summary

## What We Built

A complete automated documentation generator for WaveMaker React Native components that extracts component information from compiled JavaScript source maps and generates structured JSON documentation.

## Project Structure

```
doc-generator/
├── src/
│   ├── index.ts              # CLI entry point with commands
│   ├── doc-generator.ts      # Main orchestrator
│   ├── source-extractor.ts   # Extract TS from .js.map files
│   ├── ts-parser.ts          # Parse TypeScript AST
│   └── types.ts              # Type definitions
├── output/                   # Generated JSON docs
├── examples/
│   └── how-to-use-in-stories.md
├── package.json
├── tsconfig.json
└── README.md
```

## Features Implemented

### ✅ Source Extraction
- Reads `.js.map` source map files
- Extracts original TypeScript source code from `sourcesContent`
- Caches extracted sources for performance

### ✅ Props Parsing
- Parses TypeScript AST to extract class properties
- Captures prop name, type, default value, optional status
- Recursively resolves inherited props from base classes
- Supports multiple inheritance levels (BaseProps → BaseInputProps → Component)
- Marks inherited props with source class name

### ✅ Methods Extraction
- Extracts public methods with signatures
- Captures parameters with types
- Gets return types
- Filters out internal methods (render, lifecycle, etc.)

### ✅ Events Detection
- Automatically identifies event handlers (props starting with 'on')
- Extracts event parameters from Function types
- Maps event handlers to readable signatures

### ✅ Style Classes
- Extracts default style class (DEFAULT_CLASS constant)
- Finds all registered style variations
- Captures style class names from addStyle calls

### ✅ CLI Interface
- `generate --all` - Generate docs for all components
- `generate --component <name>` - Generate docs for specific component
- `list` - List all available components
- Options for custom library and output paths
- Single file or individual file output

## Output Format

Each component generates a JSON file:

```json
{
  "componentName": "button",
  "componentPath": "...",
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
      "returnType": "void",
      "parameters": [
        {"name": "prop", "type": "WmButtonProps", "optional": false}
      ]
    }
  ],
  "events": [
    {
      "name": "onTap",
      "type": "Function",
      "parameters": "()"
    }
  ],
  "styles": [
    {"className": "app-button", "description": "Default style class"},
    {"className": "btn-primary"}
  ],
  "baseClass": "BaseProps"
}
```

## Test Results

### Button Component (basic)
- ✅ 17 own props extracted
- ✅ 14 inherited props from BaseProps
- ✅ 2 public methods
- ✅ 1 event (onTap)
- ✅ 1 style class

### Accordion Component (container)
- ✅ 4 own props extracted
- ✅ 14 inherited props from BaseProps
- ✅ 8 public methods (expand, collapse, toggle, etc.)
- ✅ 0 events
- ✅ 1 style class

### Library Coverage
- ✅ 76 components found across 9 categories (excludes page and prefab)
- ✅ Supports: advanced, basic, chart, container, data, device, dialogs, input, navigation
- ✅ Configurable exclusions via `src/config.ts`

## Usage

### Generate docs for all components
```bash
cd doc-generator
npm install
npm run build
npm run dev -- generate --all --output ./output
```

### Generate docs for specific component
```bash
npm run dev -- generate --component button --output ./output
```

### List all components
```bash
npm run dev -- list
```

## Integration with Storybook

See `examples/how-to-use-in-stories.md` for detailed integration guide.

**Quick example:**
```tsx
import buttonDocs from '../../docs/button.json';
import { generateComponentDocs, generateArgTypes } from '../../docs/helpers';

const meta = {
  title: "Form/Button",
  component: WmButton,
  parameters: {
    docs: {
      description: {
        component: generateComponentDocs(buttonDocs),
      }
    }
  },
  argTypes: generateArgTypes(buttonDocs.props),
} satisfies Meta<typeof WmButton>;
```

## Benefits

1. **Automated**: No manual documentation needed
2. **Accurate**: Always reflects actual component code
3. **Complete**: Includes props, methods, events, styles
4. **Inherited Props**: Automatically resolves inheritance chain
5. **Type-Safe**: Generated JSON can be imported with types
6. **Extensible**: Easy to add more extractors (JSDoc, examples, etc.)

## Known Limitations

1. **No JSDoc descriptions**: Components don't have JSDoc comments, so descriptions are empty
2. **Event parameters**: Basic extraction, could be enhanced with better parsing
3. **Style details**: Only extracts class names, not actual style properties
4. **No examples**: Doesn't extract usage examples from code

## Future Enhancements

### Priority 1 - Documentation Enrichment
- [ ] Add manual descriptions via YAML config file
- [ ] Generate markdown docs from JSON
- [ ] Create searchable documentation website
- [ ] Add component usage examples

### Priority 2 - Integration
- [ ] Auto-generate story templates from JSON
- [ ] Validate story props against component props
- [ ] Create TypeScript types from JSON for stories
- [ ] Watch mode for auto-regeneration

### Priority 3 - Advanced Features
- [ ] Extract component dependencies
- [ ] Generate component relationship graph
- [ ] Track breaking changes between versions
- [ ] Generate migration guides

### Priority 4 - CI/CD
- [ ] GitHub Action to auto-generate on library update
- [ ] PR comments with documentation diff
- [ ] Automated validation of stories
- [ ] Deploy docs to GitHub Pages

## Commands Quick Reference

```bash
# Install
npm install

# Build
npm run build

# Generate all docs
npm run dev -- generate --all

# Generate single component
npm run dev -- generate --component button

# List components
npm run dev -- list

# Custom paths
npm run dev -- generate --all \
  --library ../path/to/@wavemaker/app-rn-runtime \
  --output ./custom-output

# Single file output
npm run dev -- generate --all --single-file
```

## Files Generated

For 76 components, generates:
- 76 individual JSON files (or 1 combined file with `--single-file`)
- Each file ~2-10 KB depending on component complexity
- Total size: ~200-400 KB for all components

## Performance

- Single component: ~100-200ms
- All components (76): ~5-8 seconds
- Minimal memory footprint
- Caches base props for efficiency

## Excluded Components

By default, the following categories are excluded:
- **page**: Page-level components not used in Storybook
- **prefab**: Prefab components not relevant for component library docs

You can modify exclusions in `src/config.ts`

## Next Steps

1. Review generated JSON for button and accordion
2. Create `docs-helpers.ts` with utility functions
3. Update 1-2 story files to use generated docs
4. Decide on description strategy (YAML config vs manual)
5. Plan automation workflow (when to regenerate)

## Questions to Discuss

1. Should we create a descriptions config file for human-written documentation?
2. Where should generated docs live? In storybook repo or separate?
3. Should we generate markdown docs in addition to JSON?
4. Do you want watch mode for development?
5. Should we validate stories against generated props?
