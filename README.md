# Frontend Masters Downloader

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Quick Start

```sh
$ git clone git@github.com:brucebentley/fem-downloader.git
$ cd fem-downloader
$ npm install
```

### `npm install` or `yarn`

Install all the dependencies listed within `package.json` in the local `node_modules` folder.

> *nbsp;  
> **Please Note:**  
> The `Puppeteer` installation will download a version of Chromium that is compatible with your OS.  
> &nbsp;  

## Usage

```node
node fem-downloader.js --username <your-username> --password <your-password> --course <course1-slug> [course2-slug] [course3-slug]
```

### How It Works

1. `Puppeteer` will open a browser window and will log in to [Frontend Masters](https://frontendmasters.com/) using the provided credentials.
2. After logging in, it will go to the main page of the course you selected and begin downloading its lessons, one by one.
3. The course will be downloaded into the project root, in its own folder, and each lesson will have its slug name.
4. Each lesson group will have its separate folder and each lesson will be prepended with a number reflecting its order.
5. You can download more than one course by appending their slug after the first one you provide

## Copyright & License

Copyright &copy; 2019 [Bruce Bentley](https://brucebentley/.io) under the [MIT License](https://github.com/brucebentley/slack-utilities/blob/master/LICENSE).
