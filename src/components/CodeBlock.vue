<template>
  <codemirror
    ref="codemirror"
    :value="infos.sourceCode[0].template"
  ></codemirror>
</template>

<script>
export default {
  name: "CodeBlock",
  props: {
    infos: Object,
    value: Object,
  },
  computed: {
    cm() {
      return this.$refs.codemirror.codemirror;
    },
  },
  mounted() {
    const regex = /@[^@]*@([\w-]+)@[^@]*@/;

    let setEmptyTag = (from, to, name, init = false) => {
      const emptyTag = "\u22c5\u22c5\u22c5";
      // Replace the tag with the ...
      this.cm.doc.replaceRange(emptyTag, from, to, "pythia-set-empty");

      let endOfEmptyTag = { line: from.line, ch: from.ch + emptyTag.length };

      // Place holder as editable
      this.cm.doc.markText(from, endOfEmptyTag, {
        className: "tag-empty",
        clearWhenEmpty: false,
        attributes: { "data-name": name },
      });
      if (init) {
        this.cm.doc.markText(from, endOfEmptyTag, {
          className: "tag",
          attributes: { "data-name": name },
          inclusiveLeft: true,
          inclusiveRight: true,
          clearWhenEmpty: false,
          readOnly: true,
        });
      }
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
          readOnly: true,
        }
      );
      cm.doc.replaceRange(" ", tagPos.to, tagPos.to, "pythia-set-one-space");
      cm.doc.markText(
        tagPos.to,
        { ...tagPos.to, ch: tagPos.to.ch + 1 },
        {
          className: "b-tag",
          attributes: { "data-name": tag.attributes["data-name"] },
          readOnly: true,
        }
      );
      cm.doc.setCursor(newCursorPos);
    };

    let getDocBoundaries = (doc) => {
      let lastLineNumber = doc.lastLine();
      return {
        start: {
          line: doc.firstLine(),
          ch: 0,
        },
        end: {
          line: lastLineNumber,
          ch: doc.getLine(lastLineNumber).length,
        },
      };
    };

    let posEqual = (p1, p2) => {
      return p1.line == p2.line && p1.ch == p2.ch;
    };

    let inRange = ({ from, to }, pos, included = false) => {
      return (
        from.line <= pos.line &&
        pos.line <= to.line &&
        (included ? from.ch <= pos.ch : from.ch < pos.ch) &&
        (included ? pos.ch <= to.ch : pos.ch < to.ch)
      );
    };

    let endOfLastMatch = getDocBoundaries(this.cm.doc).start;
    this.cm.doc.eachLine((line) => {
      for (let res of this.cm
        .lineInfo(line)
        .text.matchAll(new RegExp(regex, "g"))) {
        let lineInfo = this.cm.lineInfo(line);
        let startOfMatch = {
          line: lineInfo.line,
          ch: lineInfo.text.indexOf(res[0]),
        };
        let endOfMatch = {
          ...startOfMatch,
          ch: startOfMatch.ch + res[0].length,
        };

        // Put codeBase in readOnly
        this.cm.doc.markText(endOfLastMatch, startOfMatch, {
          className: "code-base",
          readOnly: true,
        });
        let tagsOptions = this.infos.sourceCode[0]?.options?.placeholders[
          res[1]
        ] || {
          name: res[1],
          multiline: false,
        };

        if (tagsOptions && tagsOptions.multiline) {
          this.cm.doc.addLineClass(line, "wrap", "tag");
          this.cm.doc.replaceRange(
            "",
            startOfMatch,
            endOfMatch,
            "pythia-set-empty"
          );
          endOfLastMatch = startOfMatch;
          this.cm.doc.markText(startOfMatch, endOfLastMatch, {
            className: "tag-multiline",
            attributes: { "data-name": res[1] },
            clearWhenEmpty: false,
            inclusiveLeft: true,
            inclusiveRight: true,
          });
        } else {
          endOfLastMatch = setEmptyTag(startOfMatch, endOfMatch, res[1], true);
        }
      }
    });
    // ReadOnly from last match to the end of the doc
    this.cm.doc.markText(endOfLastMatch, getDocBoundaries(this.cm.doc).end, {
      className: "code-base",
      readOnly: true,
    });

    this.cm.on("cursorActivity", (cm) => {
      let cursorPos = cm.doc.getCursor();
      let marksAtCursor = cm.doc.findMarksAt(cursorPos).filter((m) => {
        let pos = m.find();
        return inRange(pos, cursorPos);
      });

      let allTags = cm.doc.getAllMarks().filter((m) => m.className == "tag");
      let tagAtCursor = marksAtCursor.find((m) => m.className == "tag");
      let tagNotAtCursor;
      if (tagAtCursor) {
        tagNotAtCursor = allTags.filter((m) => m.id != tagAtCursor.id);
      } else {
        tagNotAtCursor = allTags;
      }
      let tagsToReset = tagNotAtCursor.filter((m) => {
        let pos = m.find();
        let content = cm.doc.getRange(pos.from, pos.to);
        return content == "  ";
      });

      for (let tag of tagsToReset) {
        let tagPos = tag.find();
        let bTagsToRemove = cm.doc
          .findMarks(tagPos.from, tagPos.to)
          .filter((m) => m.className == "b-tag");
        for (let bTag of bTagsToRemove) {
          bTag.readOnly = false;
        }
        let endOfEmptyTag = setEmptyTag(
          tagPos.from,
          tagPos.to,
          tag.attributes["data-name"]
        );
        if (inRange(tagPos, cursorPos, true)) {
          if (cursorPos.ch - tagPos.from.ch < endOfEmptyTag.ch - cursorPos.ch) {
            cm.doc.setCursor(tagPos.from);
          } else {
            cm.doc.setCursor(endOfEmptyTag);
          }
        }
        tag.readOnly = true;
      }

      let emptyTagAtCursor = marksAtCursor.find(
        (m) => m.className == "tag-empty"
      );
      if (emptyTagAtCursor) {
        let pos = emptyTagAtCursor.find();
        tagAtCursor.readOnly = false;
        cm.doc.replaceRange("", pos.from, pos.to, "pythia-remove-empty-tag");
      }
    });

    // Prevent editing first and last position of the doc
    this.cm.on("beforeChange", (cm, change) => {
      let docBoundaries = getDocBoundaries(cm.doc);
      let tag = cm.doc
        .findMarksAt(change.from)
        .find((m) => m.className == "tag" || m.className == "tag-multiline");
      if (
        posEqual(change.to, docBoundaries.start) ||
        (posEqual(change.from, docBoundaries.end) && !tag)
      ) {
        change.cancel();
      }
    });

    // update the value input
    this.cm.on("change", (cm) => {
      let allMarks = cm.doc.getAllMarks();
      let tagMarks = allMarks.filter(
        (m) => m.className == "tag" || m.className == "tag-multiline"
      );
      let emptyTag = allMarks.filter(
        (m) => m.className == "tag-empty" || m.className == "b-tag"
      );
      let newValue = {};
      for (let mark of tagMarks) {
        let markPos = mark.find();
        newValue[mark.attributes["data-name"]] = cm.doc.getRange(
          markPos.from,
          markPos.to
        );
      }
      for (let mark of emptyTag) {
        newValue[mark.attributes["data-name"]] = "";
      }
      this.$emit("input", newValue);
    });

    // Handle tabs
    this.cm.setOption("extraKeys", {
      "Shift-Tab": function(cm) {
        let cursorPos = cm.doc.getCursor();
        let currentTag = cm.doc
          .findMarksAt(cursorPos)
          .find((m) => m.className == "tag");

        let tags = cm.doc
          .getAllMarks()
          .filter(
            (m) => m.className == "tag" || m.className == "tag-multiline"
          );
        let newTagIndex = 0;
        if (currentTag) {
          let currentTagIndex = tags.indexOf(currentTag);
          newTagIndex = (currentTagIndex + 1) % tags.length;
        }
        let newTagPos = tags[newTagIndex].find();
        let emptyTag = cm.doc
          .findMarksAt(newTagPos.from)
          .find((m) => m.className == "tag-empty");
        if (emptyTag) {
          cm.doc.setCursor({ ...newTagPos.to, ch: newTagPos.to.ch - 1 });
        } else {
          cm.doc.setCursor(newTagPos.to);
        }
      },
    });

    // handles the b-tags
    this.cm.on("change", (cm, change) => {
      const rejectOrigin = ["pythia-remove-space", "pythia-set-one-space"];
      if (rejectOrigin.indexOf(change.origin) > -1) return;

      let editedMarks = cm.doc.findMarksAt(change.from);

      let foundTag = editedMarks.find((m) => m.className == "tag");
      if (!foundTag) return;

      let tagPos = foundTag.find();
      let tagContent = cm.doc.getRange(tagPos.from, tagPos.to);

      if (tagContent.length > 0) {
        let bTagsToRemove = cm.doc
          .findMarks(tagPos.from, tagPos.to)
          .filter((m) => m.className == "b-tag");
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

    this.cm.on("change", (cm, change) => {
      let tag = cm.doc
        .findMarksAt(change.from)
        .find((m) => m.className == "tag-multiline");
      if (!tag) return;

      let tagPos = tag.find();
      if (change.text.length > 1) {
        for (let i = tagPos.from.line; i <= tagPos.to.line; i++)
          cm.doc.addLineClass(i, "wrap", "tag");
      }
    });
  },
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
