import inquirer from "inquirer"
import { createSpinner } from "nanospinner"
import { Template } from "@/src/core/templates"
import { Logger } from "@/src/core/utils"

const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms))

export class CreateProject {
  static async prompts() {
    const templateChoices = Template.templates.map(({ name, slug }) => ({
      name,
      value: slug,
    }))

    const { projectName, templatePath } = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What is the name of your new project?",
        default: "my-project",
      },
      {
        type: "list",
        name: "templatePath",
        message: "Which template do you want to generate",
        choices: templateChoices,
      },
    ])

    try {
      const spinner01 = createSpinner("Creating project...").start()
      const projectPath = await Template.copyTemplate(projectName, templatePath)
      await sleep(1000)
      spinner01.success({ mark: "🚧", text: "Project created" })

      const spinner02 = createSpinner("Creating project...").start()
      await Template.installDependencies(projectPath)
      await sleep(1000)
      spinner02.success({
        mark: "📦",
        text: "Dependencies installed",
      })
    } catch (error) {
      Logger.error((error as any).message)
    }
  }
}
