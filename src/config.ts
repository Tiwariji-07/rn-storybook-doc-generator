/**
 * Configuration for documentation generator
 */

export interface GeneratorConfig {
  /**
   * Categories to exclude from documentation generation
   */
  excludeCategories: string[];

  /**
   * Specific component names to exclude (regardless of category)
   */
  excludeComponents: string[];
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: GeneratorConfig = {
  // Exclude page and prefab categories as they are not relevant for Storybook
  excludeCategories: ['page', 'prefab'],

  // Add specific components to exclude if needed
  excludeComponents: [],
};
