// @TODO Do not include big package.json in build
const package = require('../package');

const config = {
  version: package.version,
  mapbox: {
    accessToken: 'pk.eyJ1Ijoic296aWFsaGVsZGVuIiwiYSI6IkdUY09sSmsifQ.6vkpci46vdS7m5Jeb_YTbA',
  },
  wheelmap: {
    apiKey: '3s8GNQvBCmwm45zro_jP',
    baseUrl: 'http://176.9.63.170',
  },
  accessibilityCloud: {
    appToken: '27be4b5216aced82122d7cf8f69e4a07',
    baseUrl: {
      cached: 'https://accessibility-cloud.freetls.fastly.net',
      uncached: 'https://www.accessibility.cloud',
    },
  },
  baseUrl: 'http://localhost:3000',
  cordovaHostname: 'localhost',
};

module.exports = config;