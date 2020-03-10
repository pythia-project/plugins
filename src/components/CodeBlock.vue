<template>
  <codemirror ref="codemirror" :value="value.codeBase"></codemirror>
</template>

<script>
  import Vue from "vue";
  export default {
    name: "CodeBlock",
    props: {
      value: Object
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
        this.cm.doc.replaceRange(emptyTag, from, to, "pythia-set-empty");

        let endOfEmptyTag = { line: from.line, ch: from.ch + emptyTag.length };

        // Place holder as editable
        this.cm.doc.markText(from, endOfEmptyTag, {
          className: "tag-empty",
          attributes: { "data-name": name }
        });
        return endOfEmptyTag;
      };

      let setBlankTags = (cm, tag) => {
        let tagPos = tag.find();
        let prevCursorPos = cm.doc.getCursor();
        let newCursorPos = { ...prevCursorPos, ch: prevCursorPos.ch + 1 };
        cm.doc.replaceRange(
          " ",
          tagPos.from,
          tagPos.from,
          "pythia-set-one-space"
        );
        cm.doc.markText(
          tagPos.from,
          { ...tagPos.from, ch: tagPos.from.ch + 1 },
          {
            className: "b-tag",
            attributes: { "data-name": tag.attributes["data-name"] },
            readOnly: true
          }
        );
        cm.doc.replaceRange(" ", tagPos.to, tagPos.to, "pythia-set-one-space");
        cm.doc.markText(
          tagPos.to,
          { ...tagPos.to, ch: tagPos.to.ch + 1 },
          {
            className: "b-tag",
            attributes: { "data-name": tag.attributes["data-name"] },
            readOnly: true
          }
        );
        cm.doc.setCursor(newCursorPos);
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

      let posEqual = (p1, p2) => {
        return p1.line == p2.line && p1.ch == p2.ch;
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
            className: "code-base",
            readOnly: true
          });

          endOfLastMatch = setEmptyTag(startOfMatch, endOfMatch, res[1]);
        }
      });
      // ReadOnly from last match to the end of the doc
      this.cm.doc.markText(endOfLastMatch, getDocBoundaries(this.cm.doc).end, {
        className: "code-base",
        readOnly: true
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

        for (let marker of markersAtCursor) {
          if (marker.className == "tag-empty") {
            let markerPos = marker.find();

            cm.doc.replaceRange(
              "",
              markerPos.from,
              markerPos.to,
              "pythia-remove-empty-tag"
            );

            this.cm.doc.markText(markerPos.from, markerPos.from, {
              className: "tag",
              attributes: { "data-name": marker.attributes["data-name"] },
              inclusiveLeft: true,
              inclusiveRight: true,
              clearWhenEmpty: false
            });
          }
        }
      });

      // Prevent editing first and last position of the doc
      this.cm.on("beforeChange", (cm, change) => {
        let docBoundaries = getDocBoundaries(cm.doc);
        if (
          posEqual(change.to, docBoundaries.start) ||
          posEqual(change.from, docBoundaries.end)
        ) {
          change.cancel();
        }
      });

      // update the value input
      this.cm.on("change", cm => {
        let allMarks = cm.doc.getAllMarks();
        let tagMarks = allMarks.filter(m => m.className == "tag");
        let emptyTag = allMarks.filter(m => m.className == "tag-empty");
        for (let mark of tagMarks) {
          let markPos = mark.find();
          Vue.set(
            this.value.input,
            mark.attributes["data-name"],
            cm.doc.getRange(markPos.from, markPos.to)
          );
        }
        for (let mark of emptyTag) {
          Vue.set(this.value.input, mark.attributes["data-name"], "");
        }
        this.$emit("input", this.value);
      });

      // handles the b-tags
      this.cm.on("change", (cm, change) => {
        const rejectOrigin = ["pythia-remove-space", "pythia-set-one-space"];
        if (rejectOrigin.indexOf(change.origin) > -1) return;

        let editedMarks = cm.doc.findMarksAt(change.from);
        let foundTag = editedMarks.find(m => m.className == "tag");
        if (!foundTag) return;

        let tagPos = foundTag.find();
        let tagContent = cm.doc.getRange(tagPos.from, tagPos.to);
        if (tagContent.length > 0) {
          let bTagsToRemove = cm.doc
            .findMarks(
              { ...tagPos.from, ch: tagPos.from - 1 },
              { ...tagPos.to, ch: tagPos.to + 1 }
            )
            .filter(m => m.className == "b-tag");
          for (let bTag of bTagsToRemove) {
            let bTagPos = bTag.find();
            bTag.readOnly = false;
            cm.doc.replaceRange(
              "",
              bTagPos.from,
              bTagPos.to,
              "pythia-remove-space"
            );
            bTag.readOnly = true;
          }
        } else {
          setBlankTags(cm, foundTag);
        }
      });
    }
  };
</script>
<style>
  .tag,
  .b-tag,
  .tag-empty {
    background: #ffffff1c;
  }

  .tag-empty {
    color: white !important;
  }
</style>