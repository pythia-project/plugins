import Vue from 'vue'
import VueCodeMirror from 'vue-codemirror';
import CodeMirror from 'codemirror';
Vue.use(VueCodeMirror, {});
import 'codemirror/lib/codemirror.css';
import 'codemirror/keymap/sublime';
import 'codemirror/mode/python/python.js';
import 'codemirror/theme/monokai.css';


CodeMirror.defaults.tabSize = 4;
CodeMirror.defaults.styleActiveLine = true;
CodeMirror.defaults.lineNumbers = true;
CodeMirror.defaults.matchBrackets = true;
CodeMirror.defaults.theme = "monokai";