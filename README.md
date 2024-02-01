# Prerender-memo

Prerender-memo is a node server that uses Headless Chrome to render HTML of any web page. The Prerender server listens for an http request, takes the URL and loads it in Headless Chrome, waits for the page to finish loading by waiting for the network to be idle, and then returns your content.
Each render results are cached.
For the second and subsequent requests, the results are returned from the cache without rendering delays.

##### The quickest way to run your own prerender server:

```bash
$ npm install prerender
```

##### server.js

```js
const prerender = require("prerender");
const server = prerender();
server.start();
```

##### test it:

```bash
curl http://localhost:3000/render?url=https://www.example.com/
```

Before running the pre-render in windows, run chrome on the command line:

```bash
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless --remote-debugging-port=9222
```

"C:/Program Files/Google/Chrome/Application/chrome.exe" - is path to your brouser Chrome

You can see an example of usage and nginx configuration in the [repository](https://github.com/Igor21v/prerender).

You can also perform initial caching or cache refresh using a page crawling simple [script](https://github.com/Igor21v/autovisit-site.git) for browser.

# Customization

You can clone this repo and run `server.js` OR include prerender in your project with `npm install prerender --save` to create an express-like server with custom plugins.

## Options

### chromeLocation

```
var prerender = require('./lib');

var server = prerender({
    chromeLocation: '/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary'
});

server.start();
```

Uses a chrome install at a certain location. Prerender does not download Chrome so you will want to make sure Chrome is installed on your server already. The Prerender server checks a few known locations for Chrome but this lets you override that.

`Default: null`

### TTL

```
var prerender = require('./lib');

var server = prerender({
    ttl: 3600000
});

server.start();
```

Time to live for items in the cache.
If a page is deleted from your website, the page will be deleted from the cache after a specified time since the last rendering

`Default: 2592000000 (6 month)`

### sitemap

```
const server = prerender({
  sitemap: `https://webitem.ru/static/sitemapImit.xml`,
  sitemapUpdatePreriod: 86400000,
});
```

Set the path to your sitemap.xml to render and cache only the pages specified in it. The rest of the pages will not be rendered and cached, the pre-render will return an empty page with the 404 code.
The sitemap will be requested when the pre-render starts, and updated 1 time per day by default. You can set your period in sitemapUpdatePreriod, ms.

### logRequests

```

var prerender = require('./lib');

var server = prerender({
logRequests: true
});

server.start();

```

Causes the Prerender server to print out every request made represented by a `+` and every response received represented by a `-`. Lets you analyze page load times.

`Default: false`

### captureConsoleLog

```

var prerender = require('./lib');

var server = prerender({
captureConsoleLog: true
});

server.start();

```

Prerender server will store all console logs into `pageLoadInfo.logEntries` for further analytics.

`Default: false`

### pageDoneCheckInterval

```

var prerender = require('./lib');

var server = prerender({
pageDoneCheckInterval: 1000
});

server.start();

```

Number of milliseconds between the interval of checking whether the page is done loading or not. You can also set the environment variable of `PAGE_DONE_CHECK_INTERVAL` instead of passing in the `pageDoneCheckInterval` parameter.

`Default: 500`

### pageLoadTimeout

```

var prerender = require('./lib');

var server = prerender({
pageLoadTimeout: 20 \* 1000
});

server.start();

```

Maximum number of milliseconds to wait while downloading the page, waiting for all pending requests/ajax calls to complete before timing out and continuing on. Time out condition does not cause an error, it just returns the HTML on the page at that moment. You can also set the environment variable of `PAGE_LOAD_TIMEOUT` instead of passing in the `pageLoadTimeout` parameter.

`Default: 20000`

### waitAfterLastRequest

```

var prerender = require('./lib');

var server = prerender({
waitAfterLastRequest: 500
});

server.start();

```

Number of milliseconds to wait after the number of requests/ajax calls in flight reaches zero. HTML is pulled off of the page at this point. You can also set the environment variable of `WAIT_AFTER_LAST_REQUEST` instead of passing in the `waitAfterLastRequest` parameter.

`Default: 500`

### followRedirects

```

var prerender = require('./lib');

var server = prerender({
followRedirects: false
});

server.start();

```

Whether Chrome follows a redirect on the first request if a redirect is encountered. Normally, for SEO purposes, you do not want to follow redirects. Instead, you want the Prerender server to return the redirect to the crawlers so they can update their index. Don't set this to `true` unless you know what you are doing. You can also set the environment variable of `FOLLOW_REDIRECTS` instead of passing in the `followRedirects` parameter.

`Default: false`

## Plugins

Plugins are in the `lib/plugins` directory, and add functionality to the prerender service.

Each plugin can implement any of the plugin methods:

#### `init()`

#### `requestReceived(req, res, next)`

#### `tabCreated(req, res, next)`

#### `pageLoaded(req, res, next)`

#### `beforeSend(req, res, next)`

## Available plugins

You can use any of these plugins by modifying the `server.js` file

### basicAuth

If you want to only allow access to your Prerender server from authorized parties, enable the basic auth plugin.

You will need to add the `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` environment variables.

```

export BASIC_AUTH_USERNAME=prerender
export BASIC_AUTH_PASSWORD=test

```

Then make sure to pass the basic authentication headers (password base64 encoded).

```

curl -u prerender:wrong http://localhost:3000/http://example.com -> 401
curl -u prerender:test http://localhost:3000/http://example.com -> 200

```

### removeScriptTags

We remove script tags because we don't want any framework specific routing/rendering to happen on the rendered HTML once it's executed by the crawler. The crawlers may not execute javascript, but we'd rather be safe than have something get screwed up.

For example, if you rendered the HTML of an angular page but left the angular scripts in there, your browser would try to execute the angular routing and possibly end up clearing out the HTML of the page.

This plugin implements the `pageLoaded` function, so make sure any caching plugins run after this plugin is run to ensure you are caching pages with javascript removed.

### httpHeaders

If your Javascript routing has a catch-all for things like 404's, you can tell the prerender service to serve a 404 to google instead of a 200. This way, google won't index your 404's.

Add these tags in the `<head>` of your page if you want to serve soft http headers. Note: Prerender will still send the HTML of the page. This just modifies the status code and headers being sent.

Example: telling prerender to server this page as a 404

```html
<meta name="prerender-status-code" content="404" />
```

Example: telling prerender to serve this page as a 302 redirect

```html
<meta name="prerender-status-code" content="302" />
<meta name="prerender-header" content="Location: https://www.google.com" />
```

### whitelist

If you only want to allow requests to a certain domain, use this plugin to cause a 404 for any other domains.

You can add the whitelisted domains to the plugin itself, or use the `ALLOWED_DOMAINS` environment variable.

`export ALLOWED_DOMAINS=www.prerender.io,prerender.io`

### blacklist

If you want to disallow requests to a certain domain, use this plugin to cause a 404 for the domains.

You can add the blacklisted domains to the plugin itself, or use the `BLACKLISTED_DOMAINS` environment variable.

`export BLACKLISTED_DOMAINS=yahoo.com,www.google.com`
