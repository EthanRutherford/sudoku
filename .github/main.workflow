workflow "Build and Publish" {
  on = "push"
  resolves = ["Publish"]
}

action "Filter to master branch" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "NPM Install" {
  uses = "actions/npm@4633da3702a5366129dca9d8cc3191476fc3433c"
  needs = ["Filter to master branch"]
  args = "install"
}

action "NPM Build" {
  uses = "actions/npm@4633da3702a5366129dca9d8cc3191476fc3433c"
  needs = ["NPM Install"]
  args = "run build"
}

action "Publish" {
  uses = "./.github/publish"
  needs = ["NPM Build"]
  secrets = ["GH_PAT"]
}
