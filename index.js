const fs = require('fs');
const util = require('util');
const csv = require('csv');
const parse = require('csv-parse/lib/sync');
const base26 = require('base26');
const Iconv = require('iconv').Iconv;
const readdirAsync = util.promisify(fs.readdir);

(async () => {
  const targetColumnsPB = [
    {
      column: "f",
      action: str => str.match(/1200\d{11}/) ? str.match(/1200\d{11}/)[0] : ""
    },
    {
      column: "p",
      action: str => `PB ${str}`
    }
  ]
  const targetColumnsPP = [
    {
      column: "f",
      action: str => str.match(/1200\d{11}/) ? str.match(/1200\d{11}/)[0] : ""
    },
    {
      column: "p",
      action: str => `PP ${str}`
    }
  ]


  const pbFiles = (await readdirAsync("PB")).filter(file => file.match(/csv$/)).map(file => `PB/${file}`);
  const ppFiles = (await readdirAsync("PP")).filter(file => file.match(/csv$/)).map(file => `PP/${file}`);
  const tasks = [...pbFiles.map(file => loadCSV(file, targetColumnsPB)), ...ppFiles.map(file => loadCSV(file, targetColumnsPP))]
  const result = (await Promise.all(tasks)).flat()

  const csvStr = await util.promisify(csv.stringify)(result);
  const iconv = new Iconv('utf-8', 'sjis');
  const output = iconv.convert(csvStr);

  const outputPath = "result.csv"
  await util.promisify(fs.writeFile)(outputPath, output);
  console.log("Finish export!");

})()

const loadCSV = async (filepath, targetColumns) => {
  const csvObj = fs.readFileSync(filepath);
  if (!csvObj) { throw new Error('cannot find file'); }

  const iconv = new Iconv('sjis', 'utf-8//TRANSLIT//IGNORE');
  const converted = iconv.convert(csvObj);
  const data = parse(converted);

  const result = data.map((row, i) => {
    // if (i === 0) return targetColumns.map(target => row[base26.from(target.column) - 1])
    if (i === 0) return []
    return targetColumns.map(target => target.action(row[base26.from(target.column) - 1]))
  }).filter(row => row.length > 0)
  // console.log(result);
  return result
}