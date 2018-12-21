const Metalsmith = require('metalsmith')
const markdown = require('metalsmith-markdown')
const layouts = require('metalsmith-layouts')
const writemetadata = require('metalsmith-writemetadata')

Metalsmith(__dirname)
  .source('./src/content')
  .use(markdown())
  .use(layouts({
    directory: "templates"
  }))
  .use(writemetadata({
    pattern: ['**/*'],
    bufferencoding: 'utf8'
  }))
  .destination('./dist')
  .build((err) => {
    if (err) console.log(err)
  })