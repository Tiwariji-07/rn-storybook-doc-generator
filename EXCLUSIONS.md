# Component Exclusions

## Why Exclude Components?

Not all components in the `@wavemaker/app-rn-runtime` library are relevant for Storybook documentation. Some components are:
- Framework-level (pages, routing)
- Internal utilities (prefabs)
- Not meant for direct usage in Storybook stories

## Default Exclusions

### Categories Excluded

#### 1. **page** Category
- **Reason**: Page-level components are full-page containers used by the WaveMaker framework for routing and navigation
- **Not used in**: Storybook stories (we document individual UI components, not full pages)
- **Components excluded**: page, partial-host, etc.

#### 2. **prefab** Category
- **Reason**: Prefabs are composite components/templates used internally by the WaveMaker platform
- **Not used in**: Direct component library consumption
- **Components excluded**: Various prefab templates

## Current Stats

**Total library components**: 82
**Excluded components**: 6 (from page and prefab categories)
**Documented components**: 76

## Component Distribution

After exclusions, documentation covers:

| Category    | Count | Examples |
|-------------|-------|----------|
| advanced    | 4     | carousel, login, webview |
| basic       | 19    | button, label, icon, modal |
| chart       | 9     | line-chart, bar-chart, pie-chart |
| container   | 7     | accordion, panel, tabs |
| data        | 4     | form, list, card |
| device      | 2     | camera, barcodescanner |
| dialogs     | 5     | alertdialog, confirmdialog |
| input       | 20    | text, checkbox, select, slider |
| navigation  | 6     | navbar, menu, popover |

**Total**: 76 components

## How to Modify Exclusions

Edit `src/config.ts`:

```typescript
export const DEFAULT_CONFIG: GeneratorConfig = {
  // Add/remove categories
  excludeCategories: ['page', 'prefab'],

  // Exclude specific components (by name)
  excludeComponents: ['network-info-toaster'], // Example
};
```

After modifying, rebuild:

```bash
npm run build
```

## Why Not Exclude More?

You might wonder why we don't exclude more categories like:
- **data**: Actually contains useful components (form, list) that ARE used in Storybook
- **device**: Hardware components (camera, barcode) ARE documented for reference
- **navigation**: Navigation components (navbar, menu) ARE shown in Storybook

These are kept because they're part of the public API that developers use directly in their apps and should be documented in Storybook.

## Future Considerations

If additional components should be excluded:

1. **Add to config**: Update `excludeComponents` array in `src/config.ts`
2. **Rebuild**: Run `npm run build`
3. **Verify**: Run `npm run dev -- list` to check the new count
4. **Document**: Update this file with the reason

## Examples

### Exclude a specific component

```typescript
excludeComponents: ['skeleton', 'custom']
```

### Exclude an entire category

```typescript
excludeCategories: ['page', 'prefab', 'advanced']
```

### No exclusions (document everything)

```typescript
excludeCategories: [],
excludeComponents: []
```

## Impact on Generated Docs

Excluded components:
- ❌ Won't appear in `npm run dev -- list`
- ❌ Won't be generated with `--all` flag
- ✅ Can still be generated individually with `--component` flag (if needed for debugging)

## Related Files

- `src/config.ts` - Configuration with exclusion lists
- `src/doc-generator.ts` - Implementation of exclusion logic (lines 215-230)
- `README.md` - User-facing documentation about configuration
- `SUMMARY.md` - Project summary with current stats
