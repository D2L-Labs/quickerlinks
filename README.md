# quickerlinks

## Description ##
QuickerLinks was a quick "garage" style project to see whether a browser extension (targeting Chrome) could provide easier or quicker access to your information in Brightspace.

This is an experimental chrome extension built by D2L Labs. This extension is **not supported** and is provided **as-is**, and **without any guarantee or warranty**.

This extension is licensed under the Apache 2.0 license.

## Installing ##

Clone or download the repository to your local computer. If you download as a zip, unzip the files before continuing.

### Chrome ###

1. Open up the Extension page for Chrome
2. Enable Developer Mode (if not already enabled)
3. Click on 'Load Unpacked' and navigate to the folder with the extension and

## Reporting Issues ##

You can report issues in the GitHub repo, but you should have no expectation that they will be reviewed or addressed.

## Contributing ##

You can submit a pull request, but you should have not expectation that it will be reviewed or accepted.

### Check Agent Skills ###

Run `npm install` to install the development dependencies. The browser extension does not load these packages.

- Run `npm run check:skills` to check all repository skills.
- Run `npm run check:skills -- verify-ui` to check one skill by name.
- Pass a skill directory or a path to a `SKILL.md` file to check a specific location.
- Run `npm test` to test the validator.

The validator checks YAML syntax, required metadata, optional field types, the directory name, and body content. It returns exit code 1 if any check fails. It does not assess the quality of the skill instructions.
