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
    computed: {
      cm() {
        return this.$refs.codemirror.codemirror;
      }
    },
    mounted() {
      const regex = /@[^@]*@([\w-]+)@[^@]*@/;

      let setEmptyTag = (from, to, name) => {
        const emptyTag = "\u22c5\u22c5\u22c5";
        // Replace the tag with the ...
        this.cm.doc.replaceRange(emptyTag, from, to);

        let endOfEmptyTag = { line: from.line, ch: from.ch + emptyTag.length };

        // Place holder as editable
        this.cm.doc.markText(from, endOfEmptyTag, {
          className: "tag-empty",
          attributes: { "data-name": name }
        });
        return endOfEmptyTag;
      };

      let getDocBoundaries = doc => {
        let lastLineNumber = doc.lastLine();
        return {
          start: {
            line: doc.firstLine(),
            ch: 0
          },
          end: {
            line: lastLineNumber,
            ch: doc.getLine(lastLineNumber).length
          }
        };
      };

      let endOfLastMatch = getDocBoundaries(this.cm.doc).start;
      this.cm.doc.eachLine(line => {
        for (let res of this.cm
          .lineInfo(line)
          .text.matchAll(new RegExp(regex, "g"))) {
          let lineInfo = this.cm.lineInfo(line);
          let startOfMatch = {
            line: lineInfo.line,
            ch: lineInfo.text.indexOf(res[0])
          };
          let endOfMatch = {
            ...startOfMatch,
            ch: startOfMatch.ch + res[0].length
          };

          // Put codeBase in readOnly
          this.cm.doc.markText(endOfLastMatch, startOfMatch, {
            className: "code-base"
          });

          endOfLastMatch = setEmptyTag(startOfMatch, endOfMatch, res[1]);
        }
      });
      // ReadOnly from last match to the end of the doc
      this.cm.doc.markText(endOfLastMatch, getDocBoundaries(this.cm.doc).end, {
        className: "code-base"
      });

      // Return the marker of the tag that is left by the currsor.
      // It doesn't return anything if the cursor is still on the tag or was not on a tag
      let leftTag = doc => {
        let cursorPos = doc.getCursor();

        let tagsMarkersOfDoc = doc
          .getAllMarks()
          .filter(m => m.className == "tag");

        for (let marker of tagsMarkersOfDoc) {
          let tagsMarkersIdAtCursor = doc
            .findMarksAt(cursorPos)
            .filter(m => m.className == "tag")
            .map(m => m.id);

          let tagPos = marker.find();

          if (
            !tagsMarkersIdAtCursor.find(x => x == marker.id) &&
            doc.getRange(tagPos.from, tagPos.to).trim() == ""
          ) {
            return marker;
          }
        }
      };

      // Reset to empty tag when leaving the tag empty
      this.cm.on("cursorActivity", cm => {
        let tagMarker = leftTag(cm.doc);

        if (tagMarker) {
          let tagPos = tagMarker.find();
          cm.doc
            .findMarks(tagPos.from, tagPos.to)
            .filter(m => m.className == "b-tag")
            .forEach(m => (m.readOnly = false));

          setEmptyTag(tagPos.from, tagPos.to, tagMarker.attributes["data-name"]);
        }
      });

      // Remove the empty tag when cursor on it
      this.cm.on("cursorActivity", cm => {
        let cursorPos = cm.doc.getCursor();
        let markersAtCursor = cm.doc.findMarksAt(cursorPos);
        const emptyTagReplacement = "  ";

        for (let marker of markersAtCursor) {
          if (marker.className == "tag-empty") {
            let markerPos = marker.find();

            cm.doc.replaceRange(
              emptyTagReplacement,
              markerPos.from,
              markerPos.to
            );

            let newTagMiddlePos = {
              line: markerPos.from.line,
              ch: markerPos.from.ch + Math.floor(emptyTagReplacement.length / 2)
            };

            cm.doc.markText(
              { ...markerPos.from, ch: markerPos.from.ch },
              newTagMiddlePos,
              {
                className: "b-tag"
              }
            );

            cm.doc.markText(
              newTagMiddlePos,
              {
                ...newTagMiddlePos,
                ch: markerPos.from.ch + emptyTagReplacement.length
              },
              { className: "b-tag" }
            );

            cm.doc.setCursor(newTagMiddlePos);

            this.cm.doc.markText(
              markerPos.from,
              {
                line: markerPos.from.line,
                ch: markerPos.from.ch + emptyTagReplacement.length
              },
              {
                className: "tag",
                attributes: { "data-name": marker.attributes["data-name"] }
              }
            );
          }
        }
      });

      // Prevent editing first and last position of the doc
      this.cm.on("beforeChange", (cm, change) => {
        let tagsNames = cm.doc
          .findMarks(change.from, change.to)
          .map(m => m.className);
        if (change.origin == "+input") {
          if (!tagsNames.find(m => m == "tag")) {
            change.cancel();

            // If next to a tag replace range to modify the tag content
            let tagToMod = cm.doc
              .findMarks(
                { ...change.from, ch: change.from.ch - 1 },
                { ...change.to, ch: change.to.ch + 1 }
              )
              .find(m => m.className == "tag");

            if (tagToMod) {
              let tagToModPos = tagToMod.find();
              let currentText = cm.doc.getRange(tagToModPos.from, tagToModPos.to);
              cm.doc.replaceRange(
                currentText + change.text.join(""),
                tagToModPos.from,
                tagToModPos.to
              );

              cm.doc.markText(
                tagToModPos.from,
                {
                  ...tagToModPos.from,
                  ch:
                    tagToModPos.from.ch + change.text.length + currentText.length
                },
                {
                  attributes: {
                    "data-name": tagToMod.attributes["data-name"]
                  },
                  className: "tag"
                }
              );
            }
          }
        } else if (change.origin == "+delete") {
          let tagMark = cm.doc
            .findMarks(change.from, change.to)
            .find(m => m.className == "tag");
          if (tagMark) {
            let tagPos = tagMark.find();
            if (cm.doc.getRange(tagPos.from, tagPos.to).length <= 1) {
              setEmptyTag(
                tagPos.from,
                tagPos.to,
                tagMark.attributes["data-name"]
              );
            }
          }
          if (
            tagsNames.find(m => m == "b-tag") ||
            !tagsNames.find(m => m == "tag")
          ) {
            change.cancel();
          }
        }
      });

      this.cm.on("change", (cm, change) => {
        if (change.origin == "+input") {
          let bTags = cm.doc.getAllMarks().filter(m => m.className == "b-tag");
          for (let bTag of bTags) {
            let bTagPos = bTag.find();
            bTag.readOnly = false;
            cm.doc.replaceRange("", bTagPos.from, bTagPos.to);
            bTag.readOnly = true;
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

  .tag-empty {
    color: white !important;
  }
</style>