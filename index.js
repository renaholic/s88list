const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios');
require('dotenv').config();
const {
  Observable,
  from,
  of,
  throttleTime,
  mergeAll,
  concatMap,
  delay,
} = require('rxjs');

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
const googleSearchUrl = (query) => `https://www.google.com/search?q=${query}`;

// create observable of uniqueRows
const $uniqueSearchTerms = from(getUniqueRowFromSpreadsheet())
  .pipe(mergeAll(), forEachDelay(1000))
  .subscribe(console.log);
