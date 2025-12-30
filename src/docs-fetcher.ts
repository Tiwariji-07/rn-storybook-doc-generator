/**
 * Fetches documentation content from the WaveMaker docs GitHub repository
 */

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/wavemaker/docs/master/learn/app-development/widgets';

/**
 * Mapping of component names to their documentation paths in the WaveMaker docs repo
 * This is needed because the folder structure is not consistent
 */
/**
 * Documentation path mapping for all 64 Storybook components
 * Maps component names to their documentation file paths in the docs-master repo
 * Some components may have multiple related docs (listed as arrays would require code changes)
 */
export const DOC_PATH_MAPPING: Record<string, string | string[]> = {
    // ============ Container Widgets ============
    'accordion': 'container/accordion.md',
    'container': 'container/container.md',
    'layoutgrid': 'container/grid-layout.md',
    'linearlayout': 'container/layout.md',
    'panel': 'container/panel.md',
    'tabs': 'container/tabs.md',
    'tile': 'container/tile.md',
    'wizard': 'container/wizard.md',

    // ============ Basic Widgets ============
    'anchor': 'basic/anchor.md',
    'icon': 'basic/icon.md',
    'label': 'basic/label.md',
    'lottie': 'basic/lottie.md',
    'message': 'basic/message.md',
    'picture': 'basic/picture.md',
    'progress-bar': 'basic/progress-bar.md',
    'progress-circle': 'basic/progress-circle.md',
    'search': 'basic/search.md',
    'spinner': 'basic/spinner.md',
    'video': 'basic/video.md',
    'tooltip': 'navigation/popover.md', // Tooltip docs are in popover

    // ============ Form Input Widgets ============
    'button': 'form-widgets/button.md',
    'buttongroup': 'form-widgets/button-group.md',
    'calendar': 'form-widgets/calendar.md',
    'checkbox': 'form-widgets/checkbox.md',
    'checkboxset': 'form-widgets/checkboxset.md',
    'chips': 'form-widgets/chips.md',
    'currency': 'form-widgets/currency.md',
    'date': 'form-widgets/date-time-datetime.md',
    'datetime': 'form-widgets/date-time-datetime.md',
    'time': 'form-widgets/date-time-datetime.md',
    'fileupload': 'form-widgets/file-upload.md',
    'number': 'form-widgets/number.md',
    'radioset': 'form-widgets/radioset.md',
    'rating': 'form-widgets/rating-widget.md',
    'select': 'form-widgets/select.md',
    'selectlocale': 'form-widgets/select-locale.md',
    'slider': 'form-widgets/slider.md',
    'switch': 'form-widgets/switch.md',
    'text': 'form-widgets/text.md',
    'textarea': 'form-widgets/textarea.md',
    'toggle': 'form-widgets/toggle.md',

    // ============ Chart Widgets ============
    'area-chart': 'chart/chart-widget.md',
    'bar-chart': 'chart/chart-widget.md',
    'bubble-chart': 'chart/chart-widget.md',
    'column-chart': 'chart/chart-widget.md',
    'donut-chart': 'chart/chart-widget.md',
    'line-chart': 'chart/chart-widget.md',
    'pie-chart': 'chart/chart-widget.md',

    // ============ Data Widgets ============
    'card': [
        'datalive/cards.md',
        'datalive/cards/cards-properties-events-methods.md',
    ],
    'list': [
        'datalive/list.md',
        'datalive/list/list-properties-events-methods.md',
    ],
    'form': [
        'datalive/form.md',
        'datalive/form/form-events-methods.md',
    ],
    'liveform': [
        'datalive/live-form.md',
        'datalive/live-form/events-methods.md',
    ],

    // ============ Navigation Widgets ============
    'menu': 'navigation/dropdown-menu.md',
    'navbar': 'navigation/nav-bar.md',
    'popover': 'navigation/popover.md',

    // ============ Dialog Widgets ============
    'dialog': 'design-dialog.md',
    'alertdialog': 'alert-dialog.md',
    'confirmdialog': 'confirm-dialog.md',

    // ============ Advanced Widgets ============
    'carousel': 'advanced/carousel.md',
    'login': 'advanced/login.md',
    'webview': 'mobile-widgets/media-list.md', // No specific webview doc

    // ============ Mobile/Device Widgets ============
    'barcodescanner': 'mobile-widgets/barcode-scanner.md',
    'bottomsheet': 'mobile-widgets/bottom-sheet.md',
    'camera': 'mobile-widgets/camera.md',
};

/**
 * Fetch documentation content from GitHub for a given component
 * @param componentName - The component name (e.g., 'accordion', 'button')
 * @returns The markdown content or null if not found
 */
export async function fetchDocContent(componentName: string): Promise<string | null> {
    const docPath = DOC_PATH_MAPPING[componentName.toLowerCase()];

    if (!docPath) {
        console.log(`ℹ No documentation mapping found for: ${componentName}`);
        return null;
    }

    // Handle single path or array of paths
    const paths = Array.isArray(docPath) ? docPath : [docPath];
    const contents: string[] = [];

    for (const path of paths) {
        const url = `${GITHUB_RAW_BASE}/${path}`;

        try {
            console.log(`📥 Fetching docs from: ${path}...`);
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`⚠ Failed to fetch docs from ${path}: ${response.status}`);
                continue;
            }

            const content = await response.text();
            console.log(`✓ Fetched ${content.length} bytes from ${path}`);
            contents.push(content);
        } catch (error) {
            console.error(`✗ Error fetching docs from ${path}:`, error);
        }
    }

    if (contents.length === 0) {
        return null;
    }

    // Concatenate multiple docs with separator
    const result = contents.join('\n\n---\n\n');
    console.log(`✓ Total: ${result.length} bytes of documentation for ${componentName}`);
    return result;
}
