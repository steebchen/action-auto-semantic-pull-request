# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that validates pull request titles against the Conventional Commits specification. The action is written in JavaScript and runs on Node.js 20.

## Development Commands

- `npm run lint` - Run ESLint on the src/ directory
- `npm run test` - Run Jest tests on the src/ directory  
- `npm run build` - Clean dist/ and build the action using ncc

## Architecture

The action follows a modular structure:

### Core Files
- `src/index.js` - Main entry point that orchestrates the validation flow
- `src/validatePrTitle.js` - Core validation logic using conventional-commits-parser
- `src/parseConfig.js` - Parses and validates action inputs from action.yml
- `src/formatMessage.js` - Formats error messages for users
- `src/ConfigParser.js` - Helper class for parsing configuration options

### Key Dependencies
- `@actions/core` and `@actions/github` - GitHub Actions SDK
- `conventional-commits-parser` - Parses commit messages according to conventional commits spec
- `conventional-commit-types` - Standard commit types (feat, fix, etc.)

### Action Flow
1. Parse configuration from action inputs (`parseConfig.js`)
2. Fetch current PR data via GitHub API
3. Check for ignore labels and WIP status
4. Validate PR title using conventional commits parser (`validatePrTitle.js`)
5. Optionally validate single commit messages
6. Set GitHub status checks for WIP functionality
7. Output validation results or error messages

### Build Process
The action uses `@vercel/ncc` to bundle all dependencies into `dist/index.js` for distribution. The `dist/` directory contains the compiled action that GitHub runs.

### Testing
Jest is used for unit testing. Test files are co-located with source files using `.test.js` extension.

## Configuration Options

The action supports extensive configuration through `action.yml` inputs including custom types, scopes, subject patterns, WIP support, single commit validation, and ignore labels. See the README.md for complete configuration documentation.