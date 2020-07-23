<template>
  <v-layout column justify-center align-center>
    <v-container>
      <v-card flat class="mb-2">
        <v-container>
          <h1 class="subtitle-1">入力ファイル</h1>
          <div pa-2>
            <input type="file" multiple @change="onSelectFiles" />
          </div>
        </v-container>
      </v-card>

      <v-card flat class="mb-2">
        <v-container>
          <h1 class="subtitle-1">操作</h1>
          <div
            v-for="(target, i) in operations"
            :key="`${target.actionName}${i}`"
            class="d-flex pa-2 justify-space-between"
          >
            <div style="width: 100%;">
              <v-text-field
                v-model="target.column"
                label="対象列"
                class="pa-1"
                @change="operateAction"
              />
            </div>
            <div style="width: 100%;">
              <v-select
                v-model="target.actionName"
                :items="
                  Object.keys(actions).map((key) => ({
                    text: actions[key].label,
                    value: key,
                  }))
                "
                label="操作"
                class="pa-1"
                @change="operateAction"
              ></v-select>
            </div>
            <div style="width: 100%;">
              <v-text-field
                v-model="target.args[0]"
                label="パラメータ"
                class="pa-1"
                @blur="operateAction"
              />
            </div>
            <div>
              <v-btn icon>
                <v-icon @click="() => removeOperation(i)">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
          <v-btn @click="addOperation">追加</v-btn>
        </v-container>
      </v-card>

      <v-card flat class="mb-2">
        <v-container>
          <h1 class="subtitle-1">プレビュー</h1>
          <v-simple-table>
            <template v-slot:default>
              <tbody>
                <tr v-for="(row, row_i) in preview" :key="row_i">
                  <td v-for="(col, col_i) in row" :key="col_i">{{ col }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-container>
      </v-card>

      <v-card flat class="mb-2 pa-2">
        <div class="d-flex justify-center">
          <v-btn
            color="primary"
            :disabled="original.length <= 0"
            @click="download"
          >
            出力CSVダウンロード
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </v-layout>
</template>

<script lang="ts">
import Vue from 'vue'
const util = require('util')
const csv = require('csv')
const encoding = require('encoding-japanese')
const parse = require('csv-parse/lib/sync')
const base26 = require('base26')
const FileSaver = require('file-saver')

const actions: { [key: string]: { label: string; func: Function } } = {
  regex: {
    label: '正規表現で値を取り出す',
    func: (str: string, pattern: string) => str.match(pattern)?.[0],
  },
  replace: {
    label: '正規表現で値を置換する',
    func: (str: string, pattern: string, target: string) =>
      str.replace(pattern, target),
  },
  prefix: {
    label: '接頭辞を付ける',
    func: (str: string, addStr: string) => `${addStr}${str}`,
  },
  suffix: {
    label: '接尾辞を付ける',
    func: (str: string, addStr: string) => `${str}${addStr}`,
  },
}

export default Vue.extend({
  data(): any {
    return {
      actions,
      operations: [
        {
          column: 'f',
          actionName: 'regex',
          args: [/1200\d{11}/],
        },
        {
          column: 'p',
          actionName: 'prefix',
          args: ['PB '],
        },
      ],
      original: [],
      output: [],
      preview: [[''], [''], ['']],
    }
  },
  methods: {
    addOperation() {
      this.operations.push({
        column: 'a',
        actionName: 'prefix',
        args: [''],
      })
      this.operateAction()
    },
    removeOperation(i: number) {
      this.operations.splice(i, 1)
      this.operateAction()
    },
    operateAction() {
      this.output = this.original
        .map((row: Array<string>, i: number) => {
          if (i === 0) return []
          return this.operations.map((target: any) => {
            const pos = target?.column?.match(/[a-zA-Z]/)
              ? base26.from(target.column.toLowerCase()) - 1
              : Number(target?.column)
            return actions[target.actionName].func(row[pos], ...target.args)
          })
        })
        .filter((row: Array<string>) => row.length > 0)
      this.preview = this.output.slice(0, 3)
    },

    // ファイル選択イベントハンドラ
    async onSelectFiles(e: any) {
      this.original = []
      for (const file of e?.target?.files) {
        const result = await this.loadFileAsync(file)
        const converted = encoding.codeToString(
          this.encodeString(result, 'SJIS', 'UNICODE')
        )
        this.original.push(...parse(converted))
      }
      this.operateAction()
    },
    // ファイル読み込み
    loadFileAsync(fileObj: File) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsBinaryString(fileObj)
        reader.onload = (e) => resolve(e?.target?.result)
      })
    },
    // 文字コード変換処理
    encodeString(str: string, from: string, to: string) {
      const array = []
      for (let i = 0; i < str.length; i++) array.push(str.charCodeAt(i))
      const uniArray = encoding.convert(array, { from, to })
      return uniArray
    },

    async download() {
      this.operateAction()
      const csvStr = await util.promisify(csv.stringify)(this.output)
      const output = new Uint8Array(
        this.encodeString(csvStr, 'UNICODE', 'SJIS')
      )
      const blob = new Blob([output], { type: 'text/csv' })
      FileSaver.saveAs(blob, 'result.csv')
    },
  },
})
</script>
