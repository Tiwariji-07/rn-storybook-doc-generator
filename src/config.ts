/**
 * Configuration for documentation generator
 */

import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export interface GeneratorConfig {
  /**
   * Components to include in documentation generation (whitelist)
   */
  includeComponents: string[];

  /**
   * Child components mapping: Parent -> { ChildName: RelativePath }
   */
  childComponents: {
    [parentName: string]: {
      [childName: string]: string;
    };
  };

  /**
   * Component aliases: maps a component name to use props from another component
   * Useful for components like selectlocale that reuse select's props
   */
  componentAliases: {
    [componentName: string]: string; // componentName -> uses props from this component
  };

  /**
   * Categories to exclude from documentation generation
   */
  excludeCategories: string[];

  /**
   * Specific component names to exclude (regardless of category)
   */
  excludeComponents: string[];

  /**
   * Documentation content filtering
   */
  documentation: {
    /**
     * Props to exclude from all components
     */
    excludeProps: string[];

    /**
     * Inherited props to exclude (reduces clutter)
     */
    excludeInheritedProps: string[];

    /**
     * Methods to exclude (internal/private methods)
     */
    excludeMethods: string[];

    /**
     * Style classes to exclude
     */
    excludeStyleClasses: string[];

    /**
     * Component-specific overrides
     */
    componentOverrides: {
      [componentName: string]: {
        excludeProps?: string[];
        excludeMethods?: string[];
        excludeStyleClasses?: string[];
      };
    };
  };

  /**
   * LLM generation settings
   */
  llm: {
    /**
     * AI provider to use
     */
    provider: "claude" | "openai" | "ollama";

    /**
     * Model to use (optional, uses provider default)
     */
    model?: string;

    /**
     * Base path where generated markdown will be saved
     * Files will be saved to: {storybookPath}/components/{ComponentName}/{componentName}.auto.md
     */
    storybookPath: string;

    /**
     * Number of components to process in parallel
     * Higher values = faster but may hit rate limits
     * Recommended: 5-10
     */
    batchSize: number;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: GeneratorConfig = {
  // Component discovery exclusions
  // 64 components matching ExpoStorybook10/components exactly
  includeComponents: [
    'accordion',        // WmAccordion -> container/accordion
    'alertdialog',      // WmAlertDialog -> dialogs/alertdialog
    'anchor',           // WmAnchor -> basic/anchor
    'area-chart',       // WmAreaChart -> chart/area-chart
    'bar-chart',        // WmBarChart -> chart/bar-chart
    'barcodescanner',   // WmBarcodescanner -> device/barcodescanner
    'bottomsheet',      // WmBottomSheet -> basic/bottomsheet
    'bubble-chart',     // WmBubbleChart -> chart/bubble-chart
    'button',           // WmButton -> basic/button
    'buttongroup',      // WmButtonGroup -> basic/buttongroup
    'calendar',         // WmCalendar -> input/calendar
    'camera',           // WmCamera -> device/camera
    'card',             // WmCard -> data/card
    'carousel',         // WmCarousel -> advanced/carousel
    'checkbox',         // WmCheckbox -> input/checkbox
    'checkboxset',      // WmCheckboxSet -> input/checkboxset
    'chips',            // WmChips -> input/chips
    'column-chart',     // WmColumnChart -> chart/column-chart
    'confirmdialog',    // WmConfirmDialog -> dialogs/confirmdialog
    'container',        // WmContainer -> container
    'currency',         // WmCurrency -> input/currency
    'date',             // WmDate & WmDatetime -> input/epoch/date
    'datetime',         // WmDate & WmDatetime -> input/epoch/datetime
    'dialog',           // WmDesignDialog -> dialogs/dialog
    'donut-chart',      // WmDonutChart -> chart/donut-chart
    'fileupload',       // WmFileUpload -> input/fileupload
    'form',             // WmForm -> data/form
    'icon',             // WmIcon -> basic/icon
    'label',            // WmLabel -> basic/label
    'layoutgrid',       // WmGridLayout -> container/layoutgrid
    'line-chart',       // WmLineChart -> chart/line-chart
    'linearlayout',     // WmLinearLayout -> container/linearlayout
    'list',             // WmList -> data/list
    'liveform',         // WmLiveForm -> data/liveform
    'login',            // WmLogin -> advanced/login
    'lottie',           // WmLottie -> basic/lottie
    'menu',             // WmMenu -> navigation/menu
    'message',          // WmMessage -> basic/message
    'navbar',           // WmNavbar -> navigation/navbar
    'number',           // WmNumber -> input/number
    'panel',            // WmPanel -> container/panel
    'picture',          // WmPicture -> basic/picture
    'pie-chart',        // WmPieChart -> chart/pie-chart
    'popover',          // WmPopover -> navigation/popover
    'progress-bar',     // WmProgressBar -> basic/progress-bar
    'progress-circle',  // WmProgressCircle -> basic/progress-circle
    'radioset',         // WmRadioSet -> input/radioset
    'rating',           // WmRating -> input/rating
    'search',           // WmSearch -> basic/search
    'select',           // WmSelect -> input/select
    'selectlocale',     // WmSelectLocale -> input/select
    'slider',           // WmSlider -> input/slider
    'spinner',          // WmSpinner -> basic/spinner
    'switch',           // WmSwitch -> input/switch
    'tabs',             // WmTabs -> container/tabs
    'text',             // WmText -> input/text
    'textarea',         // WmTextarea -> input/textarea
    'tile',             // WmTile -> container/tile
    'time',             // WmTime -> input/epoch/time
    'toggle',           // WmToggle -> input/toggle
    'tooltip',          // WmTooltip -> basic/tooltip
    'video',            // WmVideo -> basic/video
    'webview',          // WmWebview -> advanced/webview
    'wizard',           // WmWizard -> container/wizard
  ],

  childComponents: {
    // Container children
    'accordion': {
      'accordionpane': './accordionpane',
    },
    'layoutgrid': {
      'gridrow': './gridrow',
      'gridcolumn': './gridcolumn',
    },
    'linearlayout': {
      'linearlayoutitem': './linearlayoutitem',
    },
    'panel': {
      'panel-content': './panel-content',
      'panel-footer': './panel-footer',
    },
    'tabs': {
      'tabpane': './tabpane',
      'tabheader': './tabheader',
    },
    'wizard': {
      'wizardstep': './wizardstep',
    },
    // Data children
    'card': {
      'card-content': './card-content',
      'card-footer': './card-footer',
    },
    'list': {
      'list-template': './list-template',
      'list-action-template': './list-action-template',
    },
    'form': {
      'form-body': './form-body',
      'form-field': './form-field',
      'form-action': './form-action',
      'form-footer': './form-footer',
    },
    // Advanced children
    'carousel': {
      'carousel-content': './carousel-content',
      'carousel-template': './carousel-template',
    },
    // Dialog children (shared across all dialog types)
    'dialog': {
      'dialogcontent': '../dialogcontent',
      'dialogactions': '../dialogactions',
    },
    'alertdialog': {
      'dialogcontent': '../dialogcontent',
      'dialogactions': '../dialogactions',
    },
    'confirmdialog': {
      'dialogcontent': '../dialogcontent',
      'dialogactions': '../dialogactions',
    },
  },

  // Component aliases: use props from another component
  componentAliases: {
    'selectlocale': 'select', // selectlocale uses select's props
  },

  excludeCategories: [
    'node_modules',
    '.git',
    'dist',
    'coverage',
    'prefabs',
    'page'
  ],

  excludeComponents: [
    // Deprecated by includeComponents, keeping for reference or mixed usage if needed
  ],

  // Documentation content filtering
  documentation: {
    // Common props that clutter documentation
    excludeProps: ["children", "renderItem"],

    // Inherited props that are rarely used in stories
    excludeInheritedProps: [
      "listener", // Internal lifecycle
      "showskeletonchildren", // Advanced feature
      "deferload", // Advanced feature
      "isdefault", // Internal flag
      "key", // React internal
      "id",
      "name",
      "children",
      "renderItem"
    ],

    // Internal methods not meant for public use
    excludeMethods: [
      "renderWidget", // Internal render
      "renderSkeleton", // Internal skeleton render
      "prepareIcon", // Internal helper
      "prepareBadge", // Internal helper
      "updateState", // Internal state
      "componentDidMount", // React lifecycle
      "componentWillUnmount", // React lifecycle
      "componentDidUpdate", // React lifecycle
    ],

    // Style classes that are internal
    excludeStyleClasses: [],

    // Per-component overrides
    componentOverrides: {},
  },

  // LLM settings (read from environment variables)
  llm: {
    provider: (process.env.AI_PROVIDER || "claude") as
      | "claude"
      | "openai"
      | "ollama",
    model: process.env.AI_MODEL || "claude-sonnet-4-0",
    storybookPath: process.env.STORYBOOK_PATH || "../rn-widgets-storybook",
    batchSize: parseInt(process.env.BATCH_SIZE || "10"),
  },
};

/**
 * Get API key for the configured provider
 */
export function getApiKey(
  provider: "claude" | "openai" | "ollama"
): string | undefined {
  switch (provider) {
    case "claude":
      return process.env.ANTHROPIC_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "ollama":
      return undefined; // Ollama doesn't need API key
    default:
      return undefined;
  }
}
