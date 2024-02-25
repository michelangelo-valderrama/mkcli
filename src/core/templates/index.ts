import path from "node:path"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import shell from "shelljs"
import { Logger, getPackageManager } from "../utils"

const DEFAULT_FILES_TO_IGNORE = ["template.json"]

interface TemplateData {
  name: string
  id: string
  slug: string
}

export class Template {
  projectPath!: string

  static get templates() {
    const templatesData: TemplateData[] = []

    const templatesPath = path.join(process.cwd(), "templates")
    const allTemplatesPath = fs.readdirSync(templatesPath)

    allTemplatesPath.forEach((tp) => {
      const templatePath = path.join(templatesPath, tp)

      const data = fs.readFileSync(
        path.join(templatePath, "template.json"),
        "utf-8"
      )
      const parsedData = JSON.parse(data)
      templatesData.push({
        name: parsedData.name,
        id: tp,
        slug: templatePath,
      })
    })

    return templatesData
  }

  static async copyTemplate(projectName: string, templatePath: string) {
    const projectPath = path.join(process.cwd(), projectName)

    if (fs.existsSync(projectPath)) {
      Logger.warn("Directory already exists. Choose another name")
      process.exit(1)
    }

    const filesToIgnore = await Template.getFilesFromGitignore(
      templatePath,
      true
    )

    await Template.copyFiles(templatePath, projectPath, filesToIgnore)
    return projectPath
  }

  static async getFilesFromGitignore(
    destinationPath: string,
    directory = false
  ) {
    try {
      const gitignoreFile = directory
        ? await fsPromises.readFile(
            path.join(destinationPath, ".gitignore"),
            "utf-8"
          )
        : await fsPromises.readFile(path.join(destinationPath), "utf-8")

      return [...DEFAULT_FILES_TO_IGNORE, ...gitignoreFile.trim().split("\n")]
    } catch (error) {
      return DEFAULT_FILES_TO_IGNORE
    }
  }

  static async copyFiles(
    originPath: string,
    destinationPath: string,
    filesToIgnore: string[] = DEFAULT_FILES_TO_IGNORE
  ) {
    if (!fs.existsSync(originPath)) {
      Logger.warn("Origin not exists")
      process.exit(1)
    }
    if (!fs.existsSync(destinationPath)) {
      fsPromises.mkdir(destinationPath, {
        recursive: true,
      })
    }

    const originContent = await fsPromises.readdir(originPath)
    const originContentNames = originContent.filter((c) => {
      return !filesToIgnore.includes(c)
    })

    originContentNames.forEach(async (contentName) => {
      const originContentPath = path.join(originPath, contentName)
      const destinationContentPath = path.join(destinationPath, contentName)

      const stats = await fsPromises.stat(originContentPath)

      if (stats.isFile()) {
        const content = await fsPromises.readFile(originContentPath, "utf8")
        await fsPromises.writeFile(destinationContentPath, content)
      }
      if (stats.isDirectory()) {
        await Template.copyFiles(originContentPath, destinationContentPath)
      }
    })
  }

  static async installDependencies(projectPath: string) {
    const content = await fsPromises.readdir(projectPath, "utf-8")
    if (content.includes("package.json")) {
      shell.cd(projectPath)
      const packageManager = await getPackageManager(projectPath)
      shell.exec(`${packageManager} install`)
    }
  }
}
