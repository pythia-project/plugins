<template>
  <codemirror ref="codemirror" :value="value.codeBase" @input="updateInput"></codemirror>
</template>

<script>
  export default {
    name: "CodeBlock",
    props: {
      value: Object
    },
    data: () => ({}),
    methods: {
      updateInput(val) {
        // replace by tags value
        this.value.input = val;
        this.$emit("input", this.value);
      }
    },
    mounted() {
      const regex = /@[^@]*@([\w-]+)@[^@]*@/;
      const emptyTag = "\u22c5\u22c5\u22c5";

      this.$refs.codemirror.codemirror.addOverlay(
        {
          token: function(stream) {
            if (stream.match(emptyTag)) {
              return "empty-tag";
            }
            while (stream.next() != null && !stream.match(emptyTag, false)) {
              continue;
            }
            return null;
          }
        },
        { opaque: true } // opaque will remove any spelling overlay etc
      );

      this.$refs.codemirror.codemirror.doc.eachLine(line => {
        let lineInfo = this.$refs.codemirror.codemirror.lineInfo(line);

        let lastEnd = 0;
        for (let res of lineInfo.text.matchAll(new RegExp(regex, "g"))) {
          let matchStartPos = this.$refs.codemirror.codemirror
            .lineInfo(line)
            .text.indexOf(res[0]);
          let matchEndPos = matchStartPos + res[0].length;

          // Put codeBase in readOnly
          this.$refs.codemirror.codemirror.doc.markText(
            { line: lineInfo.line, ch: lastEnd },
            { line: lineInfo.line, ch: matchStartPos },
            { className: "code-base", readOnly: true }
          );

          this.$refs.codemirror.codemirror.doc.replaceRange(
            emptyTag,
            { line: lineInfo.line, ch: matchStartPos },
            { line: lineInfo.line, ch: matchEndPos }
          );

          // Place holder as editable
          this.$refs.codemirror.codemirror.doc.markText(
            { line: lineInfo.line, ch: matchStartPos },
            { line: lineInfo.line, ch: matchStartPos + emptyTag.length },
            {
              className: "tag-empty",
              attributes: { "data-name": res[1] },
              readOnly: false
            }
          );
          lastEnd = matchStartPos + emptyTag.length;
        }

        // ReadOnly from last match to the end of the line
        this.$refs.codemirror.codemirror.doc.markText(
          { line: lineInfo.line, ch: lastEnd },
          { line: lineInfo.line, ch: lineInfo.text.length },
          { className: "code-base", readOnly: true }
        );
      });

      this.$refs.codemirror.codemirror.on("cursorActivity", cm => {
        let cursorPos = cm.doc.getCursor();
        let markers = cm.doc.findMarksAt(cursorPos);

        for (let mark of cm.doc.getAllMarks().filter(m => m.className == "tag")) {
          let tagAtCursor = markers
            .filter(m => m.className == "tag")
            .map(m => m.id);
            let pos = mark.find();
          if (!tagAtCursor.find(x => x == mark.id) && cm.doc.getRange(pos.from, pos.to).trim() == "") {

            cm.doc
              .findMarks(pos.from, pos.to)
              .filter(m => m.className == "start-tag" || m.className == "end-tag")
              .forEach(m => (m.readOnly = false));

            cm.doc.replaceRange(emptyTag, pos.from, pos.to);


            this.$refs.codemirror.codemirror.doc.markText(
              pos.from,
              { line: pos.from.line, ch: pos.from.ch + 3 },
              {
                className: "tag-empty",
                attributes: { "data-name": mark.attributes["data-name"] },
                readOnly: false
              }
            );
          }
        }

        for (let marker of markers) {
          let markerPos = marker.find();
          if (marker.className == "tag-empty") {
            cm.doc.replaceRange("  ", markerPos.from, markerPos.to);

            cm.doc.markText(
              {
                line: markerPos.from.line,
                ch: markerPos.from.ch - 1
              },
              {
                line: markerPos.from.line,
                ch: markerPos.from.ch + 1
              },
              { readOnly: true, className: "start-tag" }
            );

            cm.doc.markText(
              {
                line: markerPos.from.line,
                ch: markerPos.from.ch + 1
              },
              {
                line: markerPos.from.line,
                ch: markerPos.from.ch + 3
              },
              { readOnly: true, className: "end-tag" }
            );

            cm.doc.setCursor({
              line: markerPos.from.line,
              ch: markerPos.from.ch + 1
            });

            // Place holder as editable
            this.$refs.codemirror.codemirror.doc.markText(
              markerPos.from,
              { line: markerPos.from.line, ch: markerPos.from.ch + 2 },
              {
                className: "tag",
                attributes: { "data-name": marker.attributes["data-name"] }
              }
            );
          }
        }
      });
    }
  };
</script>
<style>
  .tag,
  .tag-empty {
    background: #ffffff1c;
  }
</style>