# Baseman Testing Framework

**Currently under development**

Baseman is a testing framework that saves expected output as baseline and compares new output with it to determine whether there are possible bugs or issues on consistency.

The latest version of [clime](https://github.com/vilic/clime) (the command-line interface framework for TypeScript) is now using baseman for testing, check out some resources from clime project:

- [Baseman tests](https://github.com/vilic/clime/tree/master/src/test/baseman)
- [Accepted baseline](https://github.com/vilic/clime/tree/master/test/baseman/baseline)
- [Travis CI](https://travis-ci.org/vilic/clime)

And yes, baseman is using clime for command-line interface.

## Installation

```sh
npm install baseman --global
npm install baseman --save-dev
```

## Usage

```sh
USAGE

  baseman <subcommand>

SUBCOMMANDS

  run    - Run baseman tests
  accept - Accept output in reference directory as new baseline
```

```sh
USAGE

  baseman run [dir=test/baseman] [...options]

PARAMETERS

  dir - The directory that contains tests

OPTIONS

  -f, --filter <filter> - A minimatch string to filter test cases by their IDs
  -i, --interactive     - Run test cases in interactive mode
```

## License

MIT License.
