const commandLineArgs = require('command-line-args');
const Async = require('crocks/Async');
const pipeK = require('crocks/helpers/pipeK');
const { init } = require('./api');
const { femLogin, femGoto, buildDirTree, downloadVideos, persistCookies } = require('./fem');
const { getPage, closeBrowser } = init();

const log = console.log.bind(console);

const flow = url => (username, password, courseSlug, fromLesson) =>
  getPage(`${url}/login/`)()
    .chain(femLogin(username, password))
    .chain(femGoto(`${url}/courses/${courseSlug}/`))
    .chain(buildDirTree(courseSlug, fromLesson))
    .chain(downloadVideos(url, courseSlug))
    .chain(closeBrowser);

const femDownload = flow('https://frontendmasters.com');

const optionDefinitions = [
  {
    name: 'username',
    alias: 'u',
    type: String
  },
  {
    name: 'password',
    alias: 'p',
    type: String
  },
  {
    name: 'course',
    alias: 'c',
    type: String,
    multiple: true
  },
  {
    name: 'from',
    alias: 'f',
    type: String
  }
];

const options = commandLineArgs(optionDefinitions);

const { username, password, course, from } = options;

course
  .map(title => femDownload(username, password, title, from))
  .reduce((pipe, fn) => pipe.chain(() => fn), Async.Resolved())
  .fork(e => log('Error: ', e), s => log('Success: ', s));
