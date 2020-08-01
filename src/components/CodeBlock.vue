<template>
  <codemirror
    ref="codemirror"
    :value="infos.sourceCode[0].template"
  ></codemirror>
</template>

<script>
import CodeMirror from "codemirror";

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
    /*
     *
     * Set up of the document. All the code will be in read only except for the placeholders.
     *
     */

    let tags = {};
    const regex = /@[^@]*@([\w-]+)@[^@]*@/;

    let isFirstBlock = true;
    let endOfLastTag = getDocBoundaries(this.cm.doc).start;
    let newValue = {};

    this.cm.doc.eachLine((line) => {
      const lineMatches = this.cm
        .lineInfo(line)
        .text.matchAll(new RegExp(regex, "g"));

      for (let res of lineMatches) {
        // The line is changed later on in the loop so we need to get each time the line infos
        let lineInfo = this.cm.lineInfo(line);
        let startOfMatch = {
          line: lineInfo.line,
          ch: lineInfo.text.indexOf(res[0]),
        };
        let endOfMatch = {
          ...startOfMatch,
          ch: startOfMatch.ch + res[0].length,
        };

        // Replace the mark with two space. Each space will be called a blank
        this.cm.doc.replaceRange("", startOfMatch, endOfMatch, "remove-marker");

        // Put codeBase with left blank in readOnly
        this.cm.doc.markText(endOfLastTag, startOfMatch, {
          className: "code-base",
          inclusiveLeft: isFirstBlock,
          inclusiveRight: false,
          readOnly: true,
        });

        let tagType = "tag";
        const multiline = this.infos.sourceCode[0].options?.placeholders[res[1]]
          ?.multiline;
        if (multiline) tagType = "tag-multiline";

        //  Set the placeholderspot
        const tag = this.cm.doc.markText(startOfMatch, startOfMatch, {
          className: tagType,
          attributes: { name: res[1] },
          inclusiveLeft: true,
          inclusiveRight: true,
          clearWhenEmpty: false,
          readOnly: false,
        });

        tags[res[1]] = {
          marker: tag,
          content: "",
          cursorIn: false,
          multiline: multiline,
        };

        isFirstBlock = false;

        setEmptyTag(this.cm, startOfMatch);
        newValue[res[1]] = "";

        endOfLastTag = startOfMatch;
      }
    });

    this.$emit("input", newValue);

    // ReadOnly from last match to the end of the doc
    this.cm.doc.markText(endOfLastTag, getDocBoundaries(this.cm.doc).end, {
      className: "code-base",
      inclusiveLeft: false,
      inclusiveRight: true,
      readOnly: true,
    });

    // Remove the deletion of the markers from the history.
    this.cm.doc.clearHistory();

    /*
     *
     * Signal Emitters
     *
     */

    // Emit a singal when a tag changed
    this.cm.on("changes", (cm) => {
      for (const tagName in tags) {
        const tag = tags[tagName];
        const { from, to } = tag.marker.find();
        const newContent = cm.doc.getRange(from, to);
        if (tag.content !== newContent) {
          tag.content = newContent;
          CodeMirror.signal(cm, "tagContentChange", cm, {...tag, name: tagName});
        }
      }
    });

    // Emit a signal when the cursor enter or leaves a tag
    this.cm.on("cursorActivity", (cm) => {
      if(cm.doc.somethingSelected()) return;
      const cursorPos = cm.doc.getCursor();

      for (const tagName in tags) {
        const tag = tags[tagName];

        if (inRange(tag.marker.find(), cursorPos, true) && !tag.cursorIn) {
          tag.cursorIn = true;
          CodeMirror.signal(cm, "tagEnter", cm, tag);
        } else if (
          !inRange(tag.marker.find(), cursorPos, true) &&
          tag.cursorIn
        ) {
          tag.cursorIn = false;
          CodeMirror.signal(cm, "tagLeave", cm, tag);
        }
      }
    });

    /*
     *
     * Event Handlers
     *
     */

    // Update values with the new tag contents
    this.cm.on("change", (cm) => {
      const allFullTags = cm.doc
        .getAllMarks()
        .filter((m) => m.className === "full-tag");

      let newValue = { ...this.value };

      for (let fullTag of allFullTags) {
        fullTag = { ...fullTag, ...fullTag.find() };

        const marksInRange = cm.findMarks(fullTag.from, fullTag.to);
        const tag = marksInRange.find(
          (m) => m.className === "tag" || m.className === "tag-multiline"
        );

        const tagName = tag.attributes.name;
        const content = getMarkContent(cm, tag);
        newValue[tagName] = content;
      }
      this.$emit("input", newValue);
    });

    // Set empty tag when a tag is beeing emptied
    this.cm.on("tagContentChange", (cm, tag) => {
      const tagPos = tag.marker.find();
      const cursorPos = cm.doc.getCursor();
      if (tag.content.length === 0 && !inRange(tagPos, cursorPos, true)) {
        setEmptyTag(cm, tagPos.to);
      }
    });

    // Remove the empty tag when enter an empty tag
    this.cm.on("tagEnter", (cm, tag) => {
      if (tag.content.length > 0) return;

      const tagPos = tag.marker.find();
      const emptyTagAtCursor = cm.doc
        .findMarksAt(tagPos.from)
        .filter((m) => m.type === "bookmark")
        .find((m) => m.replacedWith?.className === "tag-empty");

      emptyTagAtCursor?.clear();
    });

    // Add an empty tag when leaving an empty tag
    this.cm.on("tagLeave", (cm, tag) => {
      if (tag.content.length > 0) return;

      const tagPos = tag.marker.find();
      setEmptyTag(cm, tagPos.from);
    });

    // Set style of multiline placehorders
    this.cm.on("tagEnter", (cm, tag) => {
      if (!tag.multiline) return;

      let tagPos = tag.marker.find();

      cm.doc.addLineClass(tagPos.from.line, "wrap", "tag-wrap");
    });

    // Remove style of multiline placehorders
    this.cm.on("tagLeave", (cm, tag) => {
      if (!tag.multiline || tag.content.length > 0) return;

      let tagPos = tag.marker.find();
      cm.doc.removeLineClass(tagPos.from.line, "wrap", "tag-wrap");
    });

    // Add multiline tag style on new lines
    this.cm.on("tagContentChange", (cm, tag) => {
      if (!tag.multiline) return;

      const { from, to } = tag.marker.find();

      // The first line of the tag already has the style from the tagEnter
      for (let i = from.line + 1; i <= to.line; i++)
        cm.doc.addLineClass(i, "wrap", "tag-wrap");
    });

    // Set an insert caret style when entering an empty tag
    this.cm.on("tagEnter", (cm, tag) => {
      if (tag.content.length > 0) return;

      const { to } = tag.marker.find();
      setBlinkCaret(cm, to);
    });

    this.cm.on("tagLeave", (cm, tag) => {
      const { to } = tag.marker.find();
      cm.doc
        .findMarksAt(to)
        .filter((m) => m.type === "bookmark")
        .find((m) => m.replacedWith.className === "insert-caret")
        ?.clear();
      document.getElementById("insert-caret-style")?.remove();
    });

    this.cm.on("tagContentChange", (cm, tag) => {
      const { to } = tag.marker.find();
      if (tag.content.length === 0) {
        setBlinkCaret(cm, to);
      } else {
        cm.doc
          .findMarksAt(to)
          .filter((m) => m.type === "bookmark")
          .find((m) => m.replacedWith.className === "insert-caret")
          ?.clear();
        document.getElementById("insert-caret-style")?.remove();
      }
    });

    // Prevent new lines in non-multiline tags
    this.cm.on("beforeChange", (cm, change) => {
      if (change.origin === "undo" || change.origin === "redo") return;
      // Get the first tag marker in the change range.
      // That is where the changes will be applied
      const markers = [
        ...cm.doc.findMarks(change.from, change.to),
        ...cm.doc.findMarksAt(change.from),
        ...cm.doc.findMarksAt(change.to),
      ];

      const firstTagMarker = markers.find(
        (m) => m?.className === "tag" || m?.className === "tag-multiline"
      );

      // We don't need to prevent new line if the first tag is multiline
      if (firstTagMarker.className === "tag-multiline") return;
      change.update(change.from, change.to, change.text.slice(0, 1));
    });

    // Emit to input the updated values of the tag
    this.cm.on("tagContentChange", (cm, tag) => {
      this.$emit("input", {...this.value, [tag.name]: tag.content})
    })

    // Handle alt-tab to navigate between tags
    this.cm.addKeyMap({
      "Alt-Tab": function(cm) {
        let cursorPos = cm.doc.getCursor();
        let currentTag = cm.doc
          .findMarksAt(cursorPos)
          .find((m) => m.className == "tag" || m.className == "tag-multiline");

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

    /*
     *
     * Utility functions
     *
     */

    function getDocBoundaries(doc) {
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
    }

    // function posEqual(p1, p2) {
    //   return p1.line == p2.line && p1.ch == p2.ch;
    // }

    function getMarkContent(cm, mark) {
      const { from, to } = mark.find();
      return cm.doc.getRange(from, to);
    }

    function setEmptyTag(cm, pos) {
      // Create empty tag widget element.
      let widget = document.createElement("span");
      widget.textContent = "\u22c5\u22c5\u22c5";
      widget.className = "tag-empty";

      // Set the placeholder

      let emptyMarker = cm.doc.setBookmark(pos, widget);

      CodeMirror.on(widget, "mousedown", function(e) {
        const newCursorPos = emptyMarker.find();
        emptyMarker.clear();
        cm.focus();
        cm.doc.setCursor(newCursorPos);
        CodeMirror.e_preventDefault(e);
      });
    }

    function setBlinkCaret(cm, pos) {
      const widget = document.createElement("span");
      widget.textContent = "\u0020";
      widget.className = "insert-caret";
      cm.doc.setBookmark(pos, { insertLeft: true, widget });

      let cursorStyle = document.createElement("style");
      cursorStyle.id = "insert-caret-style";
      cursorStyle.innerHTML = `.CodeMirror div.CodeMirror-cursor {border-left-width: ${cm.defaultCharWidth()}px}`;
      document.head.appendChild(cursorStyle);
    }

    function inRange({ from, to }, pos, included = false) {
      return (
        from.line <= pos.line &&
        pos.line <= to.line &&
        (included ? from.ch <= pos.ch : from.ch < pos.ch) &&
        (included ? pos.ch <= to.ch : pos.ch < to.ch)
      );
    }
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
