# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2019-12-08
### Added
- Support for more than just Hue lights
- Support [FastLED](https://github.com/jasoncoon/esp8266-fastled-webserver), include multiple palettes & patterns
- Ability to setup the Hue bridge within the app itself
- Ability to delete lights that are no longer discoverable by the app
- Ability to set a default brightness, per bulb
- A CHANGELOG file

### Changed
- Moved from callbacks to async & awaits
- Switched from [semistandard](https://www.npmjs.com/package/semistandard) to [standard](https://www.npmjs.com/package/standard) for linting
- All Hue lights are not included by default, must be opted-in from the setup page
- Changed database from [lowdb](https://www.npmjs.com/package/lowdb) to [LokiJS](https://www.npmjs.com/package/lokijs) (system will automigrate your settings)
- All the big adjustments that came from bumping [Hue API](https://github.com/peter-murray/node-hue-api) from v2 to v3
- No longer presumes you want you app called Caron Nightlights (although you're still welcomed to)
- Upgraded the following libraries: jQuery, express-session, node-hue-api & timepicker

### Removed
- Semicolons
- The following libraries: async, jsonfile, lodash, lowdb and sprintf-js

## [0.0.2] - 2019-07-15
### Changed
- Minor version bump for all updated packages
- Brightness range now goes from 0 to 100 in steps of 5, rather than steps of 10
