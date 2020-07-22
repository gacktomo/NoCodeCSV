const fs = require('fs');
const util = require('util');
const csv = require('csv');
const parse = require('csv-parse/lib/sync');
const base26 = require('base26');
const Iconv = require('iconv').Iconv;

// const parser = csv.parse((error, data) => {

//   const targetColumns = [
//     {
//       column: "f",
//       action: str => str.match(/1200\d{11}/) ? str.match(/1200\d{11}/)[0] : ""
//     },
//     {
//       column: "p",
//       action: str => `PB ${str}`
//     }
//   ]

//   const result = data.map((row, i) => {
//     // if (i === 0) return targetColumns.map(target => row[base26.from(target.column) - 1])
//     if (i === 0) return []
//     return targetColumns.map(target => target.action(row[base26.from(target.column) - 1]))
//   })
//   console.log(result);

//   const writableStream = fs.createWriteStream('output.csv', { encoding: 'utf-8' });
//   csv.stringify(result, (err, output) => {
//     writableStream.write(output);
//   });

// })

(async () => {
  const filepath = 'test.csv'
  const csvObj = fs.readFileSync(filepath);
  if (!csvObj) { throw new Error('cannot find file'); }

  const iconv = new Iconv('sjis', 'utf-8//TRANSLIT//IGNORE');
  const converted = iconv.convert(csvObj);
  const data = parse(converted);

  const targetColumns = [
    {
      column: "f",
      action: str => str.match(/1200\d{11}/) ? str.match(/1200\d{11}/)[0] : ""
    },
    {
      column: "p",
      action: str => `PB ${str}`
    }
  ]

  const result = data.map((row, i) => {
    // if (i === 0) return targetColumns.map(target => row[base26.from(target.column) - 1])
    if (i === 0) return []
    return targetColumns.map(target => target.action(row[base26.from(target.column) - 1]))
  })
  console.log(result);

  const output = await util.promisify(csv.stringify)(result);

  const outputPath = "result.csv"
  await util.promisify(fs.writeFile)(outputPath, output);

})()