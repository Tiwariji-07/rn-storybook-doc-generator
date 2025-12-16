/**
 * LLM-powered documentation generator
 * Generates markdown documentation from ComponentDoc JSON using AI
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ComponentDoc } from "./types.js";
import { GeneratorConfig } from "./config.js";
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

  /**
   * Generate documentation content using LLM for a specific section
   */
  async generateDocSection(
    componentDoc: ComponentDoc,
    section: "overview" | "studio" | "script" | "styling"
  ): Promise<string> {
    let prompt = "";

    switch (section) {
      case "overview":
        prompt = this.buildOverviewPrompt(componentDoc);
        break;
      case "studio":
        prompt = this.buildStudioPrompt(componentDoc);
        break;
      case "script":
        prompt = this.buildScriptPrompt(componentDoc);
        break;
      case "styling":
        prompt = this.buildStylingPrompt(componentDoc);
        break;
    }

    if (!prompt) return "";

    switch (this.config.provider) {
      case "claude":
        return this.generateWithClaude(componentDoc, prompt, section);
      case "openai":
        return this.generateWithOpenAI(componentDoc, prompt, section);
      case "ollama":
        throw new Error("Ollama provider not yet implemented");
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Generate documentation using Claude
   */
  private async generateWithClaude(
    componentDoc: ComponentDoc,
    prompt: string,
    section: string
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error(
        "Claude API not initialized. Please provide ANTHROPIC_API_KEY"
      );
    }

    console.log(
      `Generating ${section} docs for ${componentDoc.componentName} with Claude...`
    );

    const message = await this.anthropic.messages.create({
      model: this.config.model || "claude-3-5-sonnet-20240620",
      max_tokens: 4000,
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
    section: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error(
        "OpenAI API not initialized. Please provide OPENAI_API_KEY"
      );
    }

    console.log(
      `Generating ${section} docs for ${componentDoc.componentName} with OpenAI...`
    );

    const completion = await this.openai.chat.completions.create({
      model: this.config.model || "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a technical documentation expert for React Native components. Generate clear, concise API reference documentation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || "";
  }

  /**
   * Build prompt for Overview
   */
  private buildOverviewPrompt(doc: ComponentDoc): string {
    const childNames = doc.children?.map(c => c.componentName).join(", ") || "";

    return `You are a technical documentation expert. Generate an Overview markdown section for the ${doc.componentName} component.
    
**Component Context**:
- Category: ${doc.category}
- Base Class: ${doc.baseClass}
- Child Components: ${childNames}

**Instructions**:
1. Write a clear, 1-2 paragraph description of what this component is and its primary use case in a mobile app.
2. If Child Components exist, briefly mention them and their relationship to the parent (e.g., "It works in conjunction with [Child Name] to...").
3. Create a "Features" section using a bulleted list highlighting likely features based on these props: ${doc.props.slice(0, 10).map(p => p.name).join(", ")}...
4. Keep it professional and concise.
5. Do NOT include code examples here.
6. Output strict Markdown starting with "# Overview".`;
  }

  /**
   * Build prompt for Studio Props & Events
   */
  private buildStudioPrompt(doc: ComponentDoc): string {
    const childProps = doc.children?.map(c => ({
      component: c.componentName,
      props: c.props.map(p => ({ name: p.name, type: p.type, default: p.defaultValue, desc: "To be filled" })),
      events: c.events
    })) || [];

    return `You are a technical documentation expert. Generate the "Studio Props & Callback Events" documentation for the ${doc.componentName} component.

**Data**:
- Props: ${JSON.stringify(doc.props.map(p => ({ name: p.name, type: p.type, default: p.defaultValue, desc: "To be filled" })))}
- Events: ${JSON.stringify(doc.events)}
- Child Components: ${JSON.stringify(childProps)}

**Instructions**:
1. Start with "# Props and Events".
2. Create a collapsible details section <details open><summary><strong>${doc.componentName} Props</strong></summary> containing a Markdown table of properties.
   - Columns: Prop, Type, Default, Description.
   - Group props logically (e.g., Accessibility, Layout, Behavior, Graphics).
3. If Child Components exist, create separate collapsible sections for each (e.g., <details><summary><strong>[Child Name] Props</strong></summary>).
4. Create a collapsible details section <details><summary><strong>Callback Events</strong></summary> containing a Markdown table of events.
   - Include events from both parent and children (specify source if ambiguous).
   - Columns: Event, Description.
5. Add a brief section "Touch Event Callback Behavior" explaining standard WaveMaker studio behavior.
6. Output strict Markdown.`;
  }

  /**
   * Build prompt for Script Props & Methods
   */
  private buildScriptPrompt(doc: ComponentDoc): string {
    const childCmp = doc.children?.map(c => c.componentName).join(", ") || "";

    return `You are a technical documentation expert. Generate the "Script Props & Methods" documentation for the ${doc.componentName} component.

**Data**:
- Methods: ${JSON.stringify(doc.methods)}
- Props: ${JSON.stringify(doc.props.slice(0, 5))} (examples)
- Child Components: ${childCmp}

**Instructions**:
1. Start with "# Script Props & Methods".
2. Explain how to access properties via script (e.g., Page.Widgets.button1.setWidgetProperty("prop", value)).
3. Provide a "Common Use Cases" section with short JavaScript code blocks showing how to toggle visibility, enable/disable, or other likely common actions for a ${doc.componentName}.
4. If Child Components exist, mention how to interact with them via script if applicable (typically accessed as children of the widget).
5. If methods exist, list them in a table or section with parameters and return types.
6. Output strict Markdown.`;
  }

  /**
   * Build prompt for Styling
   */
  private buildStylingPrompt(doc: ComponentDoc): string {
    const childStyles = doc.children?.map(c => ({
      component: c.componentName,
      styles: c.styles
    })) || [];

    return `You are a technical documentation expert. Generate the "Styling" documentation for the ${doc.componentName} component.

**Data**:
- Style Classes: ${JSON.stringify(doc.styles)}
- Child Component Styles: ${JSON.stringify(childStyles)}

**Instructions**:
1. Start with "# Styling".
2. List the available specific CSS classes for ${doc.componentName}.
3. If Child Components exist, list their style classes in separate subsections (e.g., ## [Child Name] Styling).
4. Describe what each class does visually.
5. If no specific classes, mention ability to use standard app classes.
6. Output strict Markdown.`;
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

    // 1. Overview (skip if exists)
    if (!fs.existsSync(path.join(targetDir, "overview.md"))) {
      const overviewContent = await this.generateDocSection(componentDoc, "overview");
      await this.saveFile(targetDir, "overview.md", overviewContent);
    } else {
      console.log(`ℹ Skipped: overview.md (already exists)`);
    }

    // 2. Studio Props & Events
    const studioContent = await this.generateDocSection(componentDoc, "studio");
    await this.saveFile(targetDir, "studio-props-and-events.md", studioContent);

    // 3. Script Props & Methods
    const scriptContent = await this.generateDocSection(componentDoc, "script");
    await this.saveFile(targetDir, "script-props-methods.md", scriptContent);

    // 4. Styling
    const stylingContent = await this.generateDocSection(componentDoc, "styling");
    await this.saveFile(targetDir, "styling.md", stylingContent);

    return targetDir;
  }
}
