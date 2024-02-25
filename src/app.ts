import { Cli } from "./view/cli"

//
;(() => {
  main()
})()

function main() {
  const cli = new Cli()
  cli.start()
}
