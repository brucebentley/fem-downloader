const fs = require('fs');
const https = require('https');
const Async = require('crocks/Async');
const Either = require('crocks/Either');
const identity = require('crocks/combinators/identity');
const partial = require('crocks/helpers/partial');
const constant = require('crocks/combinators/constant');
const prop = require('ramda/src/prop');
const log = require('single-line-log').stdout;
const slugify = require('slugify');
const spinner = require('./spinner').spinner;
const Persist = require('./persist').Persist;
const { restore, persist } = Persist;
const { Left, Right } = Either;

const stringToEither = s => (s.length ? Right(s) : Left(s));

const femGoto = url => page =>
  Async((rej, res) => {
    page.goto(url).then(a => res(page));
  });

const femLogin = (username, password) => page => {
  return Async((rej, res) => {
    (async function() {
      await page.type('#username', username);
      await page.type('#password', password);
      await page.type('#password', String.fromCharCode(13));
      await page.waitForSelector('header.CourseHeader', { timeout: 0 });
      res(page);
    })();
  });
};

const allLessonsFrom = (fromLesson, found = false) => lesson => {
  if (found) return true;
  if (lesson.includes(fromLesson)) {
    found = true;
    return true;
  }
  return false;
};

const buildDirTree = (courseSlug, fromLesson = '') => page =>
  Async((rej, res) => {
    (async function() {
      const lessons = await page.evaluate(function getLessons() {
        const titles = Array.from(document.querySelectorAll('h2.lessongroup'));
        const lessons = Array.from(document.querySelectorAll('ul.LessonList'));

        const titleSlugs = titles.map(title => title.textContent);

        const result = lessons
          .map((list, index) => ({
            [index]: Array.from(list.querySelectorAll('li a'))
          }))
          .map((lessons, index) => lessons[index].map(a => a.getAttribute('href')))
          .map((lessons, index) => ({ [titleSlugs[index]]: lessons }));

        return Promise.resolve(result);
      });

      const newKeys = lessons.map(o => slugify(Object.keys(o)[0].toLowerCase()));
      {
        let slugLessons = lessons
          .map((l, index) => ({
            title: `${index}-${newKeys[index]}`,
            index: index,
            lessons: l[Object.keys(l)[0]]
          }))
          .map(lessonGroup =>
            stringToEither(fromLesson)
              .map(fromLesson => allLessonsFrom(fromLesson))
              .map(onlyFromLesson => lessonGroup.lessons.filter(onlyFromLesson))
              .either(constant(lessonGroup), ll => Object.assign({}, lessonGroup, { lessons: ll }))
          );

        if (!fs.existsSync(courseSlug)) fs.mkdirSync(courseSlug);

        slugLessons
          .map(lesson => lesson.title)
          .map(title => `./${courseSlug}/${title}`)
          .map(dir => (!fs.existsSync(dir) ? fs.mkdirSync(dir) : null));

        res({ page, slugLessons });
      }
    })();
  });

const downloadVideoLesson = page => async (lessonGroup, index, courseSlug, baseUrl, lessonUrl) => {
  await page.goto(`${baseUrl}${lessonUrl}`, {
    waitUnil: ['load', 'domcontentloaded', 'networkidle0']
  });

  await page.waitForSelector('div.vjs-has-started');

  const src = await page.evaluate(() => {
    const video = document.querySelector('video.vjs-tech');
    return Promise.resolve(video.getAttribute('src'));
  });

  await page.click('div.vjs-has-started');
  const lessonTitles = lessonUrl.split('/');

  const lessonTitle = lessonTitles[lessonTitles.length - 2];
  const file = fs.createWriteStream(`./${courseSlug}/${lessonGroup}/${index}-${lessonTitle}.webm`);

  return new Promise((resolve, reject) =>
    https.get(src, function(resp) {
      console.log(`${new Date().toLocaleTimeString()}: Downloading video: ${index}-${lessonTitle}`);
      resp.on('data', function(chunk) {
        file.write(chunk);
        log(spinner());
      });
      resp.on('end', function() {
        log('');
        console.log(`${new Date().toLocaleTimeString()}: Download finished`);
        file.end();
        resolve(true);
      });
    })
  );
};

const downloadVideos = (url, courseSlug) => ({ page, slugLessons }) => {
  return Async(async (rej, res) => {
    const downloadLesson = downloadVideoLesson(page);

    for (const lessonGroup of slugLessons) {
      let lessons = lessonGroup.lessons;
      let group = lessonGroup.title;
      let index = 1;
      for (const lesson of lessons) {
        await downloadLesson(group, index, courseSlug, url, lesson);
        index = index + 1;
      }
    }
    res('YEEEEEAH!');
  });
};

module.exports = {
  femLogin,
  buildDirTree,
  downloadVideos,
  femGoto
};
