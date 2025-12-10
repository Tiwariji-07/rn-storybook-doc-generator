# WaveMaker Storybook Documentation Generator

Automated documentation generator for WaveMaker React Native components. Extracts component information from compiled JavaScript source maps and generates both JSON metadata and AI-powered markdown documentation.

## Features

- **Extracts TypeScript source** from `.js.map` files
- **Parses component props** including inherited props from base classes
- **Extracts public methods** with parameters and return types
- **Identifies event handlers** (props starting with `on`)
- **Extracts style classes** from style definitions
- **Generates JSON output** for easy integration with Storybook
- **AI-powered markdown generation** using Claude or OpenAI
- **Configurable exclusions** - skip page and prefab components by default (76 of 82 components)
- **Environment-based configuration** via `.env` file

---

## Installation

```bash
cd doc-generator
npm install
npm run build
```

---

## Quick Start

### 1. Configure Environment

Copy the example configuration file:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```bash
# AI Provider Configuration
AI_PROVIDER=claude               # Options: 'claude' or 'openai'
AI_MODEL=claude-3-5-sonnet-20241022  # or 'gpt-4-turbo-preview'

# API Keys (add the one you're using)
ANTHROPIC_API_KEY=your-claude-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Storybook Path
STORYBOOK_PATH=../rn-widgets-storybook
```

### 2. Generate Documentation

```bash
# Single component with AI docs
npm run dev -- generate --component button --with-docs

# All components with AI docs (76 components)
npm run dev -- generate --all --with-docs

# JSON only (no AI docs)
npm run dev -- generate --all
```

---

## Environment Configuration

### Supported AI Providers

The generator supports multiple AI providers. Configure via `.env` file:

#### Option A: Claude (Anthropic) - Recommended

```bash
AI_PROVIDER=claude
AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
STORYBOOK_PATH=../rn-widgets-storybook
```

**How to get API key**:

1. Sign up at https://console.anthropic.com/
2. Navigate to API Keys
3. Create a new key
4. Copy and paste into `.env`

**Available Models**:

- `claude-3-5-sonnet-20241022` (default) - Best for technical docs
- `claude-3-opus-20240229` - Most capable, higher cost
- `claude-3-haiku-20240307` - Fastest, lower cost

#### Option B: OpenAI

```bash
AI_PROVIDER=openai
AI_MODEL=gpt-4-turbo-preview
OPENAI_API_KEY=sk-proj-xxxxx
STORYBOOK_PATH=../rn-widgets-storybook
```

**How to get API key**:

1. Sign up at https://platform.openai.com/
2. Navigate to API Keys
3. Create a new secret key
4. Copy and paste into `.env`

**Available Models**:

- `gpt-4-turbo-preview` (default) - Latest GPT-4
- `gpt-4` - Standard GPT-4
- `gpt-3.5-turbo` - Faster, cheaper, less capable

### Configuration Parameters

| Parameter           | Description               | Default                   |
| ------------------- | ------------------------- | ------------------------- |
| `AI_PROVIDER`       | Which AI service to use   | `claude`                  |
| `AI_MODEL`          | Specific model to use     | Provider default          |
| `ANTHROPIC_API_KEY` | Your Claude API key       | -                         |
| `OPENAI_API_KEY`    | Your OpenAI API key       | -                         |
| `STORYBOOK_PATH`    | Path to storybook project | `../rn-widgets-storybook` |

### Switching Providers

You can easily switch between providers by editing `.env`:

```bash
# Switch to OpenAI
sed -i '' 's/AI_PROVIDER=claude/AI_PROVIDER=openai/' .env

# Switch back to Claude
sed -i '' 's/AI_PROVIDER=openai/AI_PROVIDER=claude/' .env
```

Then rebuild:

```bash
npm run build
```

---

## Usage

### List All Components

```bash
npm run dev -- list
```

Shows all 76 components grouped by category (excludes page/prefab categories).

### Generate Documentation

#### Single Component

```bash
# JSON only
npm run dev -- generate --component button

# JSON + AI-powered markdown
npm run dev -- generate --component button --with-docs
```

#### All Components

```bash
# JSON only
npm run dev -- generate --all --output ./output

# JSON + AI markdown (all 76 components)
npm run dev -- generate --all --with-docs

# Single JSON file with all components
npm run dev -- generate --all --single-file
```

#### Custom Library Path

If your library is in a different location:

```bash
npm run dev -- generate --all --library /path/to/@wavemaker/app-rn-runtime
```

---

## Output Structure

### Generated Files

```
rn-widgets-storybook/
└── components/
    ├── WmButton/
    │   ├── WMButton.stories.tsx    # Your story file
    │   └── button.auto.md          # AUTO-GENERATED API docs
    ├── WmAccordion/
    │   ├── WmAccordion.stories.tsx
    │   └── accordion.auto.md       # AUTO-GENERATED API docs
    └── ...

doc-generator/
└── output/
    ├── button.json                 # Component metadata
    ├── accordion.json
    └── ...
```

### JSON Format

Each component generates a JSON file with the following structure:

```json
{
  "componentName": "button",
  "category": "basic",
  "baseClass": "BaseProps",
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
      "name": "focus",
      "visibility": "public",
      "returnType": "void",
      "parameters": []
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
    }
  ]
}
```

### Markdown Format

Example: `button.auto.md`

```markdown
<!-- AUTO-GENERATED DOCUMENTATION -->
<!-- DO NOT EDIT THIS FILE MANUALLY -->
<!-- Generated by doc-generator on 2025-12-10 -->

# button API Reference

**Category**: basic
**Base Class**: BaseProps

---

## Props API

### Component Props

| Prop     | Type    | Default | Required | Description                  |
| -------- | ------- | ------- | -------- | ---------------------------- |
| caption  | string  | null    | No       | Text displayed on the button |
| disabled | boolean | false   | No       | Disables button interaction  |

### Inherited Props

| Prop | Type   | Default | Inherited From | Description                         |
| ---- | ------ | ------- | -------------- | ----------------------------------- |
| name | string | null    | BaseProps      | Unique identifier for the component |

## Events

| Event | Parameters                        | Description                 |
| ----- | --------------------------------- | --------------------------- |
| onTap | (e: Event, proxy: ComponentProxy) | Fired when button is tapped |

## Style Classes

- **app-button** - Default button style
- **btn-primary** - Primary action button (blue)
- **btn-secondary** - Secondary action (gray)

---

_This API reference is automatically generated from the component's source code._
```

---

## Two-Section Documentation Strategy

Each component's documentation is designed to have two sections:

### 1. Manual Section (Human-Written)

- Component overview and description
- When to use / use cases
- Usage examples and code snippets
- Best practices and common patterns
- Migration notes

**Location**: Maintained manually by developers in story files or separate docs

### 2. Auto-Generated Section (AI-Powered)

- Props API tables (with AI descriptions)
- Methods API reference
- Events documentation
- Style classes and variants
- Type definitions

**Location**: `rn-widgets-storybook/components/{ComponentName}/{componentName}.auto.md`

**Important**: The `.auto.md` files contain ONLY API reference documentation. They do NOT include usage examples or best practices (that's in the manual section).

---

## Component Exclusions

### Default Exclusions

The generator excludes 6 components from 2 categories:

| Category   | Reason                                       | Impact                        |
| ---------- | -------------------------------------------- | ----------------------------- |
| **page**   | Page-level containers for routing/navigation | Not used in Storybook stories |
| **prefab** | Internal composite components/templates      | Not part of public API        |

**Result**: 76 of 82 components are documented

### Component Distribution

After exclusions, documentation covers:

| Category   | Count | Examples                         |
| ---------- | ----- | -------------------------------- |
| advanced   | 4     | carousel, login, webview         |
| basic      | 19    | button, label, icon, modal       |
| chart      | 9     | line-chart, bar-chart, pie-chart |
| container  | 7     | accordion, panel, tabs           |
| data       | 4     | form, list, card                 |
| device     | 2     | camera, barcodescanner           |
| dialogs    | 5     | alertdialog, confirmdialog       |
| input      | 20    | text, checkbox, select, slider   |
| navigation | 6     | navbar, menu, popover            |

**Total**: 76 components

### Customizing Exclusions

Edit `src/config.ts`:

```typescript
export const DEFAULT_CONFIG: GeneratorConfig = {
  // Exclude entire categories
  excludeCategories: ["page", "prefab"],

  // Exclude specific components by name
  excludeComponents: ["skeleton", "custom"],

  // Content filtering
  documentation: {
    // Props to exclude from all components
    excludeProps: [],

    // Inherited props to hide (reduces clutter)
    excludeInheritedProps: [
      "listener",
      "showskeletonchildren",
      "deferload",
      "isdefault",
      "key",
    ],

    // Methods to exclude (internal methods)
    excludeMethods: [
      "renderWidget",
      "renderSkeleton",
      "prepareIcon",
      "prepareBadge",
      "updateState",
    ],

    // Component-specific overrides
    componentOverrides: {
      button: {
        excludeProps: ["internalProp"],
        excludeMethods: ["internalMethod"],
      },
    },
  },
};
```

After modifying, rebuild:

```bash
npm run build
```

---

## Integration with Storybook

### Import Auto-Generated Docs in Story Files

```tsx
import buttonAuto from "./button.auto.md";

const meta = {
  title: "Form/Button",
  component: WmButton,
  parameters: {
    docs: {
      description: {
        component: buttonAuto,
      },
    },
  },
} satisfies Meta<typeof WmButton>;
```

### Combine Manual + Auto Documentation

```tsx
// Manual documentation (your examples and best practices)
const manualDocs = `
## Overview
The Button component is a versatile UI element...

## Usage Examples
\`\`\`tsx
<WmButton caption="Click me" onTap={handleTap} />
\`\`\`
`;

// Auto-generated API reference
import buttonAuto from "./button.auto.md";

const meta = {
  parameters: {
    docs: {
      description: {
        component: `
${manualDocs}

---

${buttonAuto}
        `,
      },
    },
  },
};
```

## Workflow

### Initial Setup

1. Configure your `.env` file with API key
2. Build the project: `npm run build`
3. Generate all docs: `npm run dev -- generate --all --with-docs`
4. Review generated markdown files
5. Commit to git

### When Library Updates

1. Regenerate docs for changed components:
   ```bash
   npm run dev -- generate --component button --with-docs
   ```
2. Review changes
3. Commit updates

### When Adding New Component

1. Add story to storybook
2. Generate docs:
   ```bash
   npm run dev -- generate --component new-component --with-docs
   ```

---

## How It Works

1. **Source Extraction**: Reads `.js.map` files and extracts original TypeScript source code from the `sourcesContent` field
2. **AST Parsing**: Uses TypeScript compiler API to parse the source and extract:
   - Class properties (props)
   - Method signatures
   - Style class definitions from `addStyle()` calls
3. **Inheritance Resolution**: Recursively resolves inherited props from base classes (e.g., BaseProps, BaseInputProps)
4. **Content Filtering**: Applies exclusion rules to remove internal props/methods based on configuration
5. **JSON Generation**: Outputs structured JSON documentation to `output/` directory
6. **LLM Generation**: Sends component metadata to AI provider (Claude or OpenAI) with a specialized prompt
7. **Markdown Formatting**: Formats AI response into structured markdown with metadata headers
8. **File Saving**: Saves to `{storybookPath}/components/{ComponentName}/{componentName}.auto.md`

---

## Project Structure

```
doc-generator/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── doc-generator.ts      # Main documentation generator
│   ├── source-extractor.ts   # Source map extraction
│   ├── ts-parser.ts          # TypeScript AST parser
│   ├── llm-doc-generator.ts  # AI-powered markdown generation
│   ├── config.ts             # Configuration and env loading
│   └── types.ts              # Type definitions
├── output/                   # Generated JSON documentation
├── .env                      # Your environment configuration
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

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

---

## Troubleshooting

### Error: API key not set

```
Error: API key not set for provider 'claude'
Please set ANTHROPIC_API_KEY in .env file
```

**Solution**:

1. Ensure `.env` file exists in project root
2. Add the API key for your configured provider
3. No quotes needed around the key value
4. Rebuild: `npm run build`

### Error: Invalid API key

**Solution**:

1. Verify the API key is correct (copy-paste from provider dashboard)
2. Check for extra spaces or newlines
3. Ensure the key is active (not revoked)

### Error: Library path not found

```
Error: Library path not found: /path/to/@wavemaker/app-rn-runtime
```

**Solution**: Ensure `@wavemaker/app-rn-runtime` is installed in your storybook project:

```bash
cd ../rn-widgets-storybook
npm install
```

### Error: Directory does not exist

```
Warning: Directory does not exist: ../rn-widgets-storybook/components/WmButton
```

**Solution**: The generator will create the directory automatically, but verify:

1. Check `STORYBOOK_PATH` in `.env` is correct
2. Ensure the component folder structure exists in storybook

### Wrong provider being used

**Solution**:

1. Check `AI_PROVIDER` in `.env`
2. Rebuild: `npm run build`
3. The provider is loaded when the script starts

### Rate limiting errors

If generating all components fails with rate limit errors, generate in smaller batches:

```bash
# Generate a few at a time
npm run dev -- generate --component button --with-docs
npm run dev -- generate --component anchor --with-docs
```

---

## Security Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use different keys** for dev/prod if needed
3. **Rotate keys periodically**
4. **Set usage limits** in provider dashboard
5. **Monitor costs** regularly

---

## License

MIT
