const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios').default;
require('dotenv').config();
const {
  Observable,
  from,
  throttleTime,
  mergeAll,
  take,
  map,
  switchMap,
  tap,
  last,
  scan,
} = require('rxjs');
const { forEachDelay } = require('./rxjshelper/forEachDelay');
const { promisify } = require('util');
const googleIt = require('google-it');
const uniqid = require('uniqid');
const fs = require('fs');

async function getUniqueRowFromSpreadsheet() {
  const doc = new GoogleSpreadsheet(
    '15fOMVpJUEOioEviWJbuMKec4Eb6J8ErdKDWI5wOvwCY'
  );
  // Authenticate with the Google Spreadsheets API
  doc.useApiKey(process.env.GOOGLE_API_KEY);

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows({ limit: 5, offset: 0 });

  const searchEntry = rows
    .map(
      ({
        // get the required data from the sheet
        ['English name of subsidiary body 附屬團體英文名稱']: englishName,
        ['Chinese name of subsidiary body 附屬團體中文名稱']: chineseName,
        ['Duplication Check']: duplicationCheck,
      }) => [englishName, chineseName, duplicationCheck]
    )
    .flat()
    .filter(Boolean);
  return [...new Set(searchEntry)];
}
// const googleSearchUrl = (query) => `https://www.google.com/search?q=${query}`;

// const sampleRows = [
//   '「向山舉目」助學金會',
//   '八仁社',
//   '大埔泮涌社區教育中心有限公司',
//   '小西灣南海觀音廟管理委員會',
//   '中華彌勒文化慈善基金會有限公司',
// ];

// create observable of uniqueRows
const $uniqueSearchTerms = from(getUniqueRowFromSpreadsheet())
  // const $uniqueSearchTerms = from(new Promise((res) => res(sampleRows)))
  .pipe(
    mergeAll(),
    // get the first 1 rows for development purpose
    take(2),
    // space out the requests
    forEachDelay(5000),
    switchMap(async (keywords) => {
      const result = await googleIt({ query: keywords });
      return { ...result, _id: uniqid(), keywords };
    }),
    scan((acc, value) => {
      acc.push(value);
      return acc;
    }, []),
    last()
  );

$uniqueSearchTerms.subscribe((e) => {
  fs.writeFile('./test.json', JSON.stringify(e), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    //file written successfully
    console.log('file written successfully');
  });
});
