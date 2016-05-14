# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

#### [1.2.3] - 2016-05-12
##### Fixed
- Fixed an issue preventing observance of undefined deep properties (more than
two levels)
- Fixed an issue causing conflicting listener values set based on Observer
targets

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