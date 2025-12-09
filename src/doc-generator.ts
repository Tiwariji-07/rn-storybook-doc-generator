/**
 * Main documentation generator that combines extraction and parsing
 */

import * as fs from 'fs';
import * as path from 'path';
import { SourceExtractor } from './source-extractor.js';
import { TypeScriptParser } from './ts-parser.js';
import { ComponentDoc, PropInfo, EventInfo, StyleInfo, MethodInfo } from './types.js';
import { GeneratorConfig, DEFAULT_CONFIG } from './config.js';

export class DocumentationGenerator {
  private libraryPath: string;
  private basePropsCache: PropInfo[] | null = null;
  private config: GeneratorConfig;

  constructor(libraryPath: string, config: Partial<GeneratorConfig> = {}) {
    this.libraryPath = libraryPath;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get and cache BaseProps properties
   */
  private getBaseProps(): PropInfo[] {
    if (this.basePropsCache) {
      return this.basePropsCache;
    }

    try {
      const baseComponentPath = path.join(this.libraryPath, 'core', 'base.component.js.map');
      const baseSource = SourceExtractor.extractSourceContent(baseComponentPath);

      if (baseSource) {
        const propsInfo = TypeScriptParser.extractProps(baseSource);
        if (propsInfo && propsInfo.className === 'BaseProps') {
          this.basePropsCache = propsInfo.props;
          return this.basePropsCache;
        }
      }
    } catch (error) {
      console.error('Error extracting BaseProps:', error);
    }

    return [];
  }

  /**
   * Get inherited props from a base class
   */
  private getInheritedProps(baseClassName: string): PropInfo[] {
    const inheritedProps: PropInfo[] = [];

    // Handle BaseProps
    if (baseClassName === 'BaseProps') {
      return this.getBaseProps().map(prop => ({
        ...prop,
        inherited: true,
        inheritedFrom: 'BaseProps',
      }));
    }

    // Handle BaseInputProps
    if (baseClassName === 'BaseInputProps') {
      const baseInputPath = path.join(
        this.libraryPath,
        'components',
        'input',
        'baseinput',
        'baseinput.props.js.map'
      );

      try {
        const source = SourceExtractor.extractSourceContent(baseInputPath);
        if (source) {
          const propsInfo = TypeScriptParser.extractProps(source);
          if (propsInfo) {
            // Add BaseInputProps own props
            inheritedProps.push(
              ...propsInfo.props.map(prop => ({
                ...prop,
                inherited: true,
                inheritedFrom: 'BaseInputProps',
              }))
            );

            // Recursively get BaseProps
            if (propsInfo.baseClass) {
              inheritedProps.push(...this.getInheritedProps(propsInfo.baseClass));
            }
          }
        }
      } catch (error) {
        console.error(`Error extracting ${baseClassName}:`, error);
      }
    }

    return inheritedProps;
  }

  /**
   * Generate documentation for a single component
   */
  generateComponentDoc(componentPath: string, category: string): ComponentDoc | null {
    try {
      // Extract sources
      const sources = SourceExtractor.extractComponentSources(componentPath);

      if (!sources.props && !sources.component) {
        console.warn(`No source files found for ${componentPath}`);
        return null;
      }

      const componentName = path.basename(componentPath);

      // Parse props
      let allProps: PropInfo[] = [];
      let baseClass: string | undefined;

      if (sources.props) {
        const propsInfo = TypeScriptParser.extractProps(sources.props);
        if (propsInfo) {
          allProps = propsInfo.props;
          baseClass = propsInfo.baseClass;

          // Get inherited props
          if (baseClass) {
            const inheritedProps = this.getInheritedProps(baseClass);
            allProps.push(...inheritedProps);
          }
        }
      }

      // Parse methods
      let methods: MethodInfo[] = [];
      if (sources.component) {
        const methodsInfo = TypeScriptParser.extractMethods(sources.component);
        if (methodsInfo) {
          methods = methodsInfo.methods;
        }
      }

      // Extract events from props
      const events: EventInfo[] = TypeScriptParser.extractEvents(allProps).map(e => ({
        name: e.name,
        type: e.type,
        parameters: this.extractEventParameters(e.type),
      }));

      // Parse styles
      let styles: StyleInfo[] = [];
      if (sources.styles) {
        const styleInfo = TypeScriptParser.extractStyleClasses(sources.styles);
        if (styleInfo) {
          styles = [
            {
              className: styleInfo.defaultClass,
              description: 'Default style class',
            },
            ...styleInfo.styleClasses
              .filter(cls => cls !== styleInfo.defaultClass)
              .map(cls => ({
                className: cls,
              })),
          ];
        }
      }

      return {
        componentName,
        componentPath,
        category,
        props: allProps,
        methods,
        events,
        styles,
        baseClass,
      };
    } catch (error) {
      console.error(`Error generating docs for ${componentPath}:`, error);
      return null;
    }
  }

  /**
   * Extract parameter information from event type
   */
  private extractEventParameters(eventType: string): string {
    // Simple extraction for now - can be enhanced
    if (eventType === 'Function') {
      return '()';
    }

    // Try to extract parameters from function signature
    const match = eventType.match(/\((.*?)\)\s*=>/);
    if (match) {
      return `(${match[1]})`;
    }

    return eventType;
  }

  /**
   * Find all component directories in library
   */
  findAllComponents(): Array<{ path: string; category: string }> {
    const components: Array<{ path: string; category: string }> = [];
    const categoriesPath = path.join(this.libraryPath, 'components');

    if (!fs.existsSync(categoriesPath)) {
      console.error(`Components path not found: ${categoriesPath}`);
      return components;
    }

    const categories = fs.readdirSync(categoriesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => !this.config.excludeCategories.includes(name)); // Exclude configured categories

    for (const category of categories) {
      const categoryPath = path.join(categoriesPath, category);
      const items = fs.readdirSync(categoryPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const componentName = item.name;

          // Skip excluded components
          if (this.config.excludeComponents.includes(componentName)) {
            continue;
          }

          const componentPath = path.join(categoryPath, componentName);

          // Check if it has component files
          const files = fs.readdirSync(componentPath);
          const hasComponentFiles = files.some(f =>
            f.endsWith('.component.js.map') || f.endsWith('.props.js.map')
          );

          if (hasComponentFiles) {
            components.push({ path: componentPath, category });
          }
        }
      }
    }

    return components;
  }

  /**
   * Generate documentation for all components
   */
  generateAllDocs(): ComponentDoc[] {
    const components = this.findAllComponents();
    const docs: ComponentDoc[] = [];

    console.log(`Found ${components.length} components`);

    for (const { path: componentPath, category } of components) {
      const componentName = path.basename(componentPath);
      console.log(`Generating docs for ${category}/${componentName}...`);

      const doc = this.generateComponentDoc(componentPath, category);
      if (doc) {
        docs.push(doc);
      }
    }

    return docs;
  }

  /**
   * Save documentation to JSON file
   */
  saveDocsToFile(docs: ComponentDoc[], outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2), 'utf-8');
    console.log(`Documentation saved to ${outputPath}`);
  }

  /**
   * Save individual component doc to separate JSON file
   */
  saveComponentDoc(doc: ComponentDoc, outputDir: string): void {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${doc.componentName}.json`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
    console.log(`Saved ${fileName}`);
  }
}
