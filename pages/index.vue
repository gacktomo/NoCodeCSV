<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <input type="file" multiple @change="onSelectFiles" />
    </v-flex>
  </v-layout>
</template>

<script lang="ts">
// const Iconv = require('iconv').Iconv
const iconv = require('iconv-lite')
const parse = require('csv-parse/lib/sync')
const base26 = require('base26')

const targetColumns = [
  {
    column: 'f',
    // action: (str: string) => str.match(/1200\d{11}/)?.[0],
  },
  {
    column: 'p',
    // action: (str: string) => `PB ${str}`,
  },
]
const actions = {
  regex: (str: string, pattern: string) => str.match(pattern)?.[0],
  replace: (str: string, pattern: string, target: string) =>
    str.replace(pattern, target),
  prefix: (str: string, addStr: string) => `${addStr}${str}`,
  suffix: (str: string, addStr: string) => `${str}${addStr}`,
}
export default {
  methods: {
    async onSelectFiles(e: any) {
      const result = await this.loadFileAsync(e?.target?.files[0])
      const converted = iconv.decode(result, 'Shift_JIS')
      const data = parse(converted)
      const output = data
        .map((row: Array<string>, i: number) => {
          if (i === 0) return []
          return targetColumns.map((target) =>
            target.action(row[base26.from(target.column) - 1])
          )
        })
        .filter((row: Array<string>) => row.length > 0)
      console.log(output)
    },
    loadFileAsync(fileObj: File) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsText(fileObj)
        reader.onload = (e) => resolve(e?.target?.result)
      })
    },
  },
}
</script>
