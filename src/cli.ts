import { CreateProject } from "@/src/commands/create"

//
;(async () => {
  console.log("[cli] started")

  await CreateProject.prompts()
})()
