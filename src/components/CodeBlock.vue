<template>
    <codemirror :value="value" :options="cmOptions" @input="updateInput"></codemirror>
</template>

<script>

import Vue from 'vue'
import VueCodeMirror from 'vue-codemirror';
Vue.use(VueCodeMirror,{});
import 'codemirror/lib/codemirror.css'
import 'codemirror/keymap/sublime';
import 'codemirror/mode/python/python.js';
import 'codemirror/theme/monokai.css'

export default {
    name: "CodeBlock",
    props: {
        value: String
    },
    data : () => ({
        cmOptions: {
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          mode: 'text/x-python',
          keyMap: "sublime",
          matchBrackets: true,
          showCursorWhenSelecting: true,
          theme: "monokai",
          hintOptions:{
            completeSingle: false
          }
        }
    }),
    methods: {
        updateInput(val) {
            this.$emit('input', val)
        }
    }
}
</script>