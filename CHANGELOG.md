# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.7.6] - 2016-08-25
### Added
- n/a

### Changed
- Moved packages from `devDependencies` to `dependencies` to resolve
installation issues.

### Fixed
- n/a

### Removed
- n/a

## [1.7.5] - 2016-08-17
### Added
- n/a

### Changed
- n/a

### Fixed
- Fixed `*-each` binder
- Fixed build files

### Removed
- n/a

## [1.7.3] - 2016-07-13
### Added
- n/a

### Changed
- Made `Observer.prototype.walkObjectKeypath` use `Array.prototype.reduce`

### Fixed
- n/a

### Removed
- Removed checked in built files

## [1.7.2] - 2016-06-26
### Added
- n/a

### Changed
- Upgrade to use NodeJS v5.12.0 (npm v3.8.6)

### Fixed
- n/a

### Removed
- n/a

#### [1.7.1] - 2016-06-20
##### Fixed
- Fixed an issue with the `*` binder and the scoping of `type`

### [1.7.0] - 2016-06-19
#### Added
- Added the ability to use formatter functions in tandem with template strings

### [1.6.0] - 2016-06-10
#### Changed/Fixed
- `cb-html` now creates a sub-view containing the elements added to the root by the bound value
- Added fixes for templated string value replacement

### [1.5.0] - 2016-06-02
#### Changed
- Fixed and simplified the way that formatters work. Formatters are functions that take a value and parse it before its value is set

### [1.4.0] - 2016-06-01
#### Changed/Removed
- HTML text nodes no longer attempt to bind templated string values (only binder referenced values do so)
- Removed `Rivets.TextTemplateParser`, moved all functionality into the binding

#### [1.3.3] - 2016-05-31
##### Fixed
- Fixed an issue with the `cb-each` binder not updating the view model properly when used in tandem with the value binder

#### [1.3.2] - 2016-05-31
##### Fixed
- Fixed an issue with the `cb-text` and `cb-html` binders not binding templated string values properly

#### [1.3.1] - 2016-05-23
##### Fixed
- Fixed an issue with the `cb-each` binder not updating the view model properly when used in tandem with the value binder
- Fixed an issue with reassigning deeply bound undefined model listeners

### [1.3.0] - 2016-05-18
#### Added/Fixed
- Created a system for adding new bindings and re-added checked
- Fixed an issue where checkbox inputs were not properly setting the "checked" property when used in tandem with the value binder
- Fixed an issue preventing observed arrays from consuming callbacks when mutated

#### [1.2.6] - 2016-05-16
##### Changed
- Checkboxes bound with the `cb-value` binder now bind change events as opposed to input events

#### [1.2.5] - 2016-05-15
##### Changed
- Check for Observer setter callback listeners should not depend on keypath length but on `indexOf`

#### [1.2.4] - 2016-05-14
##### Changed
- Modified the arguments to the Observer class

#### [1.2.3] - 2016-05-12
##### Fixed
- Fixed an issue preventing observance of undefined deep properties (more than two levels)
- Fixed an issue causing conflicting listener values set based on Observer targets

#### [1.2.2] - 2016-05-12
##### Fixed
- Fixed an issue preventing observance of undefined deep properties

#### [1.2.1] - 2016-05-11
##### Changed
- Upgraded to NodeJS 5.11.1 (npm 3.8.6)

#### [1.2.0] - 2016-04-20
##### Added/Fixed/Removed
- Added the `*-no-class` binder
- Fixed the way callbacks are registered to Observer
- Removed dependency and options from views and binders

#### [1.1.1] - 2016-04-02
##### Changed
- Renamed internal Observer dependency

### [1.1.0] - 2016-04-01
#### Removed
- Removed dependency on SighglassJS

#### [1.0.1] - 2016-03-30
##### Changed
- Exposed template string matching RegExp