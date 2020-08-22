// Copyright 2020 The Pythia Authors.
// This file is part of Pythia.
//
// Pythia is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, version 3 of the License.
//
// Pythia is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Foobar.  If not, see <https://www.gnu.org/licenses/>.

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
