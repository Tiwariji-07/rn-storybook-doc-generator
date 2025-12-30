/**
 * LLM-powered documentation generator
 * Generates markdown documentation from ComponentDoc JSON using AI
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ComponentDoc } from "./types.js";
import { GeneratorConfig } from "./config.js";
import { fetchDocContent } from "./docs-fetcher.js";
import * as fs from "fs";
import * as path from "path";

export class LLMDocGenerator {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private config: GeneratorConfig["llm"];

  constructor(config: GeneratorConfig["llm"], apiKey?: string) {
    this.config = config;

    if (config.provider === "claude" && apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    } else if (config.provider === "openai" && apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateAllDocs(componentDoc: ComponentDoc, retryCount: number = 0): Promise<Record<string, string>> {
    const MAX_RETRIES = 2;

    // Fetch existing documentation from WaveMaker docs repo
    const existingDocs = await fetchDocContent(componentDoc.componentName);
    // console.log("Existing docs:", existingDocs);
    const isRetry = retryCount > 0;
    const prompt = isRetry
      ? this.buildStrictPrompt(componentDoc, existingDocs)
      : this.buildPrompt(componentDoc, existingDocs);
    // console.log("Prompt:", prompt);
    let jsonResponse: string = "";

    switch (this.config.provider) {
      case "claude":
        jsonResponse = await this.generateWithClaude(componentDoc, prompt, isRetry);
        break;
      case "openai":
        jsonResponse = await this.generateWithOpenAI(componentDoc, prompt, isRetry);
        break;
      case "ollama":
        throw new Error("Ollama provider not yet implemented");
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }

    try {
      // Clean up markdown formatting - only strip surrounding code blocks
      let cleanJson = jsonResponse.trim();

      // Remove starting ```json or ```
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(json)?\n?/, '');
      }

      // Remove ending ```
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.replace(/\n?```$/, '');
      }

      return JSON.parse(cleanJson);
    } catch (e) {
      if (retryCount < MAX_RETRIES) {
        console.warn(`⚠ JSON parse failed for ${componentDoc.componentName}, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        return this.generateAllDocs(componentDoc, retryCount + 1);
      }

      console.error("Failed to parse LLM JSON response:", e);
      console.error("Raw response:", jsonResponse);
      // Return empty objects or fallback to avoid crash, but logging error is crucial
      return {
        overview: "Error generating content",
        props: "Error generating content",
        events: "Error generating content",
        methods: "Error generating content",
        styling: "Error generating content"
      };
    }
  }

  /**
   * Build a stricter prompt for retries - shorter content, explicit JSON requirements
   */
  private buildStrictPrompt(doc: ComponentDoc, existingDocs?: string | null): string {
    const childNames = doc.children?.map(c => c.componentName).join(", ") || "";

    return `You are a technical documentation expert. Generate documentation for the ${doc.componentName} component.

**CRITICAL**: Your response MUST be valid, complete JSON. Do not truncate. Keep content concise to fit within limits.
    
**Component Data**:
- Category: ${doc.category}
- Child Components: ${childNames}
- Props: ${JSON.stringify(doc.props.slice(0, 30).map(p => ({ name: p.name, type: p.type, default: p.defaultValue })))}
- Events: ${JSON.stringify(doc.events.slice(0, 10))}
- Methods: ${JSON.stringify(doc.methods.slice(0, 10))}
- Styles: ${JSON.stringify(doc.styles.slice(0, 10))}

${existingDocs ? `**Existing Docs Reference**:\n${existingDocs.substring(0, 3000)}\n` : ''}

**Output Format** - Return ONLY this JSON structure (no markdown wrapper):
{
  "overview": "# Overview\\n\\nBrief description.\\n\\n## Features\\n\\n- Feature 1\\n- Feature 2",
  "props": "# Props\\n\\n| Name | Type | Default | Description |\\n|------|------|---------|-------------|\\n| prop1 | type | default | desc |",
  "events": "# Callback Events\\n\\n| Event | Description |\\n|-------|-------------|\\n| event1 | desc |",
  "methods": "# Methods\\n\\n| Method | Parameters | Return | Description |\\n|--------|------------|--------|-------------|\\n| method1 | params | return | desc |",
  "styling": "# Styling\\n\\n| Class | Description |\\n|-------|-------------|\\n| class1 | desc |"
}

**Rules**:
1. Keep each section CONCISE (max 3000 chars per section)
2. Return raw JSON only - no \`\`\`json wrapper
3. Escape newlines as \\n in strings
4. Ensure the JSON is complete and valid`;
  }

  /**
   * Generate documentation using Claude
   */
  private async generateWithClaude(
    componentDoc: ComponentDoc,
    prompt: string,
    isRetry: boolean = false
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error(
        "Claude API not initialized. Please provide ANTHROPIC_API_KEY"
      );
    }

    const retryLabel = isRetry ? " (retry with strict prompt)" : "";
    console.log(
      `Generating complete docs for ${componentDoc.componentName} with Claude${retryLabel}...`
    );

    // Increase max_tokens on retry to prevent truncation
    const maxTokens = isRetry ? 8000 : 5000;

    const message = await this.anthropic.messages.create({
      model: this.config.model || "claude-3-5-sonnet-20240620",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    return content.type === "text" ? content.text : "";
  }

  /**
   * Generate documentation using OpenAI
   */
  private async generateWithOpenAI(
    componentDoc: ComponentDoc,
    prompt: string,
    isRetry: boolean = false
  ): Promise<string> {
    if (!this.openai) {
      throw new Error(
        "OpenAI API not initialized. Please provide OPENAI_API_KEY"
      );
    }

    const retryLabel = isRetry ? " (retry with strict prompt)" : "";
    console.log(
      `Generating complete docs for ${componentDoc.componentName} with OpenAI${retryLabel}...`
    );

    // Increase max_tokens on retry to prevent truncation
    const maxTokens = isRetry ? 8000 : 4000;

    const completion = await this.openai.chat.completions.create({
      model: this.config.model || "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a technical documentation expert. Respond ONLY with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || "";
  }

  /**
   * Build complete prompt for all sections
   * @param doc - Component documentation from source code
   * @param existingDocs - Optional existing documentation from WaveMaker docs repo
   */
  private buildPrompt(doc: ComponentDoc, existingDocs?: string | null): string {
    const childNames = doc.children?.map(c => c.componentName).join(", ") || "";

    const childProps = doc.children?.map(c => ({
      component: c.componentName,
      props: c.props.map(p => ({
        name: p.name,
        type: p.type,
        default: p.defaultValue,
        desc: "To be filled"
      })),
      events: c.events,
      styles: c.styles
    })) || [];

    return `You are a technical documentation expert. Generate comprehensive documentation for the ${doc.componentName} component.
    
**Component Data**:
- Category: ${doc.category}
- Base Class: ${doc.baseClass}
- Child Components: ${childNames}
- Props: ${JSON.stringify(doc.props.slice(0, 50).map(p => ({ name: p.name, type: p.type, default: p.defaultValue })))}
- Events: ${JSON.stringify(doc.events)}
- Methods: ${JSON.stringify(doc.methods)}
- Styles: ${JSON.stringify(doc.styles)}
- Children Details: ${JSON.stringify(childProps)}

${existingDocs ? `**Existing Documentation** (from WaveMaker docs - combined web/mobile):
---
${existingDocs}
---
` : ''}

**Instructions**:
Generate a SINGLE JSON object containing Markdown content for 5 specific sections.
The JSON structure must be exactly:
{
  "overview": "Markdown string...",
  "props": "Markdown string...",
  "events": "Markdown string...",
  "methods": "Markdown string...",
  "styling": "Markdown string..."
}

**Section Requirements**:

${existingDocs ? `**IMPORTANT - Using Existing Docs**:
- The "Existing Documentation" above contains content for both web and mobile platforms.
- Extract and use ONLY mobile/React Native relevant content.
- Remove any web-specific CSS, HTML, Angular, or web-only features.
- Use the rich descriptions, use cases, and examples from existing docs.
- The **Extracted Props/Events** below are the source of truth for the mobile API.

` : ''}
1. **overview**:
   - Start with "# Overview".
   - 1-2 paragraph description of the component.
   - Bulleted "Features" list.
   - Any other data that is neccessary to be included

2. **props**:
   - Start with "# Props".
   - Create a table of properties (Name, Type, Default, Description).
   - Group logically.
   - Include child component props if applicable.
   - Common Use Cases code snippets. like (### Configure Accordion Behavior
'javascript
// Allow multiple panes to be open
Page.Widgets.myAccordion.closeothers= false;

// Change animation style
Page.Widgets.myAccordion.animation= "slideDown";

// Set default expanded pane
Page.Widgets.myAccordion.defaultpaneindex= 2;
') etc

3. **events**:
   - Start with "# Callback Events".
   - Create a table of events (Event, Description).
   - Include child component events.

4. **methods**:
   - Start with "# Methods".
   - Explain script access (e.g., Page.Widgets.widgetName).
   - Create a table of methods (Method, Parameters, Return Type, Description).
   - Common method Use Cases code snippets if available.

5. **styling**:
   - Start with "# Styling".
   - List specific CSS classes and what they do.
   - Mention child component styling if applicable.

**IMPORTANT**: 
- Output ONLY valid JSON.
- **Code Blocks**: When writing code blocks (javascript, css, etc.) inside the markdown strings, you MUST properly escape the backticks. 
- Code Blocks: Markdown code blocks (e.g. javascript) are allowed in the JSON string values. No special escaping for backticks is needed, but newlines must be escaped as \\n.
- Do NOT wrap the entire JSON output in markdown code blocks. Just return the raw JSON object.
- all the props, events, methods etc names, name inside the tables, should be highlighted in backticks`;
  }

  /**
   * Get target directory for component docs
   */
  private getTargetDir(componentDoc: ComponentDoc): string {
    const folderName = this.toWmPascalCase(componentDoc.componentName);

    // Manual overrides for specific components
    let storybookComponentFolder = folderName;
    if (componentDoc.componentName === 'dialog') {
      storybookComponentFolder = 'WmDesignDialog';
    } else if (componentDoc.componentName === 'layoutgrid') {
      storybookComponentFolder = 'WmGridLayout';
    } else if (componentDoc.componentName === 'selectlocale') {
      storybookComponentFolder = 'WmSelectLocale';
    }

    return path.join(
      this.config.storybookPath,
      "components",
      storybookComponentFolder,
      "docs"
    );
  }

  private toWmPascalCase(str: string): string {
    const pascalCase = str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    return `Wm${pascalCase}`;
  }

  /**
   * Save a single markdown file
   */
  async saveFile(
    targetDir: string,
    fileName: string,
    content: string
  ): Promise<string> {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path.join(targetDir, fileName);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✓ Saved: ${path.relative(process.cwd(), filePath)}`);
    return filePath;
  }

  /**
   * Generate and save all documentation files
   */
  async generateAndSave(componentDoc: ComponentDoc): Promise<string> {
    const targetDir = this.getTargetDir(componentDoc);

    // Generate all content in one go
    const docs = await this.generateAllDocs(componentDoc);

    // 1. Overview
    // if (!fs.existsSync(path.join(targetDir, "overview.md"))) {
    await this.saveFile(targetDir, "overview.md", docs.overview);
    // } else {
    //   console.log(`ℹ Skipped: overview.md (already exists)`);
    // }

    // 2. Props
    await this.saveFile(targetDir, "props.md", docs.props);

    // 3. Callback Events
    await this.saveFile(targetDir, "events.md", docs.events);

    // 4. Methods
    await this.saveFile(targetDir, "methods.md", docs.methods);

    // 5. Styling
    await this.saveFile(targetDir, "styling.md", docs.styling);

    return targetDir;
  }
}
