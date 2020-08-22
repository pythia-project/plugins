<!--
Copyright 2020 The Pythia Authors.
This file is part of Pythia.

Pythia is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License.

Pythia is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Foobar.  If not, see <https://www.gnu.org/licenses/>.
-->

<template>
  <codemirror ref="codemirror" :value="code" :options="cmOptions"></codemirror>
</template>

<script>
export default {
  name: "CodeBlock",
  props: {
    infos: Object,
    value: Object,
  },
  data: () => ({
    cmOptions: {},
  }),
  computed: {
    cm() {
      return this.$refs.codemirror.codemirror;
    },
    code(){
      return this.infos.sourceCode[0].template || ""
    }
  },
  mounted() {
    this.cmOptions = {
      editableAreas: {
        ...this.cm.options.editableAreas,
        tagsInfos: this.infos.sourceCode[0].options?.tags || {},
      },
    };

    // Emit to input the updated values of the tag
    this.cm.on("tagContentChange", (cm, tag) => {
      this.$emit("input", { ...this.value, [tag.name]: tag.content });
    });

    this.cm.on("configurationError", () => {
      this.$emit("error")
    })
  },
};
</script>
<style>
.tag,
.b-tag,
.tag-empty,
.tag-wrap {
  background: #ffffff1c;
}

.tag-empty {
  color: white !important;
}
</style>
