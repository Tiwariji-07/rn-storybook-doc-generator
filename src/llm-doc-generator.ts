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
   * Generate markdown documentation using LLM
   */
  async generateMarkdown(componentDoc: ComponentDoc): Promise<string> {
    switch (this.config.provider) {
      case "claude":
        return this.generateWithClaude(componentDoc);
      case "openai":
        return this.generateWithOpenAI(componentDoc);
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
    componentDoc: ComponentDoc
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error(
        "Claude API not initialized. Please provide ANTHROPIC_API_KEY"
      );
    }

    const prompt = this.buildPrompt(componentDoc);

    console.log(
      `Generating docs for ${componentDoc.componentName} with Claude...`
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
    const markdown = content.type === "text" ? content.text : "";

    return this.formatMarkdown(componentDoc, markdown);
  }

  /**
   * Generate documentation using OpenAI
   */
  private async generateWithOpenAI(
    componentDoc: ComponentDoc
  ): Promise<string> {
    if (!this.openai) {
      throw new Error(
        "OpenAI API not initialized. Please provide OPENAI_API_KEY"
      );
    }

    const prompt = this.buildPrompt(componentDoc);

    console.log(
      `Generating docs for ${componentDoc.componentName} with OpenAI...`
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
      temperature: 0.3, // Lower temperature for more consistent technical docs
    });

    const markdown = completion.choices[0]?.message?.content || "";

    return this.formatMarkdown(componentDoc, markdown);
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(doc: ComponentDoc): string {
    const ownProps = doc.props.filter((p) => !p.inherited);
    const inheritedProps = doc.props.filter((p) => p.inherited);

    return `You are a technical documentation expert for React Native components.

Generate comprehensive API reference documentation for this component:

**Component**: ${doc.componentName}
**Category**: ${doc.category}
**Base Class**: ${doc.baseClass || "None"}

**Component Props** (${ownProps.length}):
${ownProps
  .map(
    (p) =>
      `- ${p.name} (${p.type}): default=${p.defaultValue || "undefined"}${
        !p.optional ? " [REQUIRED]" : ""
      }`
  )
  .join("\n")}

**Inherited Props** (${inheritedProps.length}):
${inheritedProps
  .map(
    (p) =>
      `- ${p.name} (${p.type}): default=${p.defaultValue} [from ${p.inheritedFrom}]`
  )
  .join("\n")}

**Methods** (${doc.methods.length}):
${doc.methods
  .map(
    (m) =>
      `- ${m.name}(${m.parameters
        .map((p) => `${p.name}: ${p.type}`)
        .join(", ")}): ${m.returnType}`
  )
  .join("\n")}

**Events** (${doc.events.length}):
${doc.events.map((e) => `- ${e.name}: ${e.parameters}`).join("\n")}

**Style Classes** (${doc.styles.length}):
${doc.styles
  .map((s) => `- ${s.className}${s.description ? ` (${s.description})` : ""}`)
  .join("\n")}

---

Generate professional API reference documentation in markdown format. Include:

1. **Props API Section**
   - Create a markdown table for Component Props
   - Create a separate table for Inherited Props
   - For each prop, write a clear, concise description (1-2 sentences)
   - Include the type, default value, and whether it's required
   - Make descriptions practical and user-focused

2. **Methods API Section** (if any methods exist)
   - Create a markdown table listing each method
   - Describe what the method does and when to use it
   - Document parameters clearly

3. **Events Section** (if any events exist)
   - Create a markdown table for events
   - Explain when each event fires
   - Describe the parameters passed to handlers

4. **Style Classes Section** (if any styles exist)
   - Group style classes by purpose (variants, states, sizes, etc.)
   - List each class with a brief description of its visual effect
   - Use bullet points for readability

**Important Guidelines**:
- DO NOT include example code or usage examples (that's in the manual section)
- Focus ONLY on API reference documentation
- Keep descriptions concise and technical
- Use markdown tables for props, methods, and events
- Use bullet lists for style classes
- Be consistent with formatting
- If a section is empty (e.g., no events), skip that section entirely

Format your response as clean, well-structured markdown.`;
  }

  /**
   * Format and add metadata to markdown
   */
  private formatMarkdown(doc: ComponentDoc, llmContent: string): string {
    const timestamp = new Date().toISOString().split("T")[0];

    return `
<!-- Generated by doc-generator on ${timestamp} -->

---

${llmContent}

---

*This API reference is automatically generated from the component's source code.*
*For usage examples and best practices, see the manual documentation section above.*
`;
  }

  /**
   * Get the target path for the generated markdown
   * Format: {storybookPath}/components/Wm{ComponentName}/APIReference.md
   */
  private getTargetPath(componentDoc: ComponentDoc): string {
    // Convert component name to PascalCase with 'Wm' prefix for folder name
    const folderName = this.toWmPascalCase(componentDoc.componentName);
    const fileName = "APIReference.md";

    const targetPath = path.join(
      this.config.storybookPath,
      "components",
      folderName,
      fileName
    );

    return targetPath;
  }

  /**
   * Convert kebab-case or lowercase to PascalCase with 'Wm' prefix
   * Examples: button -> WmButton, bar-chart -> WmBarChart, anchor -> WmAnchor
   */
  private toWmPascalCase(str: string): string {
    const pascalCase = str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    return `Wm${pascalCase}`;
  }

  /**
   * Save generated markdown to the target path
   */
  async saveMarkdown(
    componentDoc: ComponentDoc,
    markdown: string
  ): Promise<string> {
    const targetPath = this.getTargetPath(componentDoc);
    const targetDir = path.dirname(targetPath);

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      console.warn(`Warning: Directory does not exist: ${targetDir}`);
      console.warn(`Please ensure the component folder exists in storybook`);
      // Create directory anyway
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write markdown file
    fs.writeFileSync(targetPath, markdown, "utf-8");

    console.log(`✓ Generated: ${path.relative(process.cwd(), targetPath)}`);

    return targetPath;
  }

  /**
   * Generate and save documentation for a component
   */
  async generateAndSave(componentDoc: ComponentDoc): Promise<string> {
    const markdown = await this.generateMarkdown(componentDoc);
    return this.saveMarkdown(componentDoc, markdown);
  }
}
