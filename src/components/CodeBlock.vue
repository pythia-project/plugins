<template>
  <codemirror
    ref="codemirror"
    :value="code"
    :options="cmOptions"
  ></codemirror>
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
    code: vm.infos.sourceCode[0].template
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
