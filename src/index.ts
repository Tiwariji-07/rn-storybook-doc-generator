#!/usr/bin/env node

/**
 * CLI entry point for documentation generator
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { DocumentationGenerator } from './doc-generator.js';

const program = new Command();

program
  .name('wm-doc-generator')
  .description('Generate documentation for WaveMaker React Native components')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate documentation for all components or a specific component')
  .option('-a, --all', 'Generate docs for all components')
  .option('-c, --component <name>', 'Generate docs for a specific component')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-l, --library <path>', 'Path to @wavemaker/app-rn-runtime', '../rn-widgets-storybook/node_modules/@wavemaker/app-rn-runtime')
  .option('--single-file', 'Generate a single JSON file with all components')
  .action((options) => {
    const libraryPath = path.resolve(process.cwd(), options.library);
    const outputPath = path.resolve(process.cwd(), options.output);

    console.log('WaveMaker Component Documentation Generator');
    console.log('==========================================\n');
    console.log(`Library path: ${libraryPath}`);
    console.log(`Output path: ${outputPath}\n`);

    // Check if library path exists
    if (!fs.existsSync(libraryPath)) {
      console.error(`Error: Library path not found: ${libraryPath}`);
      console.error('Please ensure the @wavemaker/app-rn-runtime package is installed');
      process.exit(1);
    }

    const generator = new DocumentationGenerator(libraryPath);

    if (options.all) {
      console.log('Generating documentation for all components...\n');
      const docs = generator.generateAllDocs();

      if (options.singleFile) {
        const outputFile = path.join(outputPath, 'all-components.json');
        generator.saveDocsToFile(docs, outputFile);
      } else {
        // Save individual files
        for (const doc of docs) {
          generator.saveComponentDoc(doc, outputPath);
        }
      }

      console.log(`\nGenerated documentation for ${docs.length} components`);
    } else if (options.component) {
      console.log(`Generating documentation for ${options.component}...\n`);

      // Find the component
      const components = generator.findAllComponents();
      const component = components.find(c =>
        path.basename(c.path).toLowerCase() === options.component.toLowerCase()
      );

      if (!component) {
        console.error(`Error: Component '${options.component}' not found`);
        console.error('\nAvailable components:');
        components.forEach(c => {
          console.error(`  - ${path.basename(c.path)} (${c.category})`);
        });
        process.exit(1);
      }

      const doc = generator.generateComponentDoc(component.path, component.category);
      if (doc) {
        generator.saveComponentDoc(doc, outputPath);
        console.log('\nDocumentation generated successfully!');
      } else {
        console.error('Error: Failed to generate documentation');
        process.exit(1);
      }
    } else {
      console.error('Error: Please specify --all or --component <name>');
      program.help();
    }
  });

program
  .command('list')
  .description('List all available components')
  .option('-l, --library <path>', 'Path to @wavemaker/app-rn-runtime', '../rn-widgets-storybook/node_modules/@wavemaker/app-rn-runtime')
  .action((options) => {
    const libraryPath = path.resolve(process.cwd(), options.library);

    if (!fs.existsSync(libraryPath)) {
      console.error(`Error: Library path not found: ${libraryPath}`);
      process.exit(1);
    }

    const generator = new DocumentationGenerator(libraryPath);
    const components = generator.findAllComponents();

    console.log(`\nFound ${components.length} components:\n`);

    // Group by category
    const byCategory: Record<string, string[]> = {};
    components.forEach(c => {
      if (!byCategory[c.category]) {
        byCategory[c.category] = [];
      }
      byCategory[c.category].push(path.basename(c.path));
    });

    // Display grouped
    Object.entries(byCategory).forEach(([category, componentNames]) => {
      console.log(`${category}/ (${componentNames.length})`);
      componentNames.forEach(name => {
        console.log(`  - ${name}`);
      });
      console.log('');
    });
  });

// Default command
if (process.argv.length === 2) {
  program.help();
}

program.parse();
