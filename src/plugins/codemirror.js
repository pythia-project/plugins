import Vue from "vue";
import VueCodeMirror from "vue-codemirror";

Vue.use(VueCodeMirror, {
  options: {
    tabSize: 4,
    styleActiveLine: true,
    lineNumbers: true,
    matchBrackets: true,
    theme: "monokai",
    editableAreas: { regex: /@[^@]*@([\w-]+)@[^@]*@/ },
  },
});
import "codemirror/lib/codemirror.css";
import "codemirror/keymap/sublime";
import "codemirror/mode/python/python.js";
import "codemirror/theme/monokai.css";
import "./editable-area.js";
