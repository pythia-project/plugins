(function(mod) {
  // CommonJS
  mod(require("codemirror"));
})(function(CodeMirror) {
  let tags = {};

  CodeMirror.defineOption("editableAreas", false, function(cm, val, old) {
    if (old == CodeMirror.Init) {
      //
      // Empty tag handeling
      //

      // Set empty tag when a tag is beeing emptied
      cm.on("tagContentChange", setEmptyTagOnChanged);

      // Remove the empty tag when enter a tag without any content
      cm.on("tagEnter", clearEmptyTagOnEntry);

      // Add an empty tag when leaving an empty tag
      cm.on("tagLeave", setEmptyTagOnLeave);

      //
      // Tag Style handeling
      //

      // Set style of multiline placehorders
      cm.on("tagEnter", setMultilineStyleOnEnter);

      // Remove style of multiline placehorders
      cm.on("tagLeave", clearMultilineStyleOnEnter);

      // Add multiline tag style on new lines
      cm.on("tagContentChange", setMultilineStyleOnChange);

      // Set an insert caret style when entering an empty tag
      cm.on("tagEnter", setInsertCaretOnEnter);

      // Remove insert caret style when leaving a tag
      cm.on("tagLeave", clearInsertCaretOnLeave);

      // Remove insert caret style when a content is set in the tag
      // Set insert caret style when tag is emptied
      cm.on("tagContentChange", insertCaretOnChange);

      //
      // Others
      //

      // Prevent new lines in non-multiline tags
      cm.on("beforeChange", preventNewLineBeforeChange);

      // Handle alt-tab to navigate between tags
      cm.addKeyMap({
        "Alt-Tab": function(cm) {
          navigateTags(cm, true);
        },
        "Shift-Tab": function(cm) {
          navigateTags(cm, false);
        },
      });
    } else {
      cm.off("changes", onChnages);
      cm.off("cursorActivity", onCursorActivity);
      cm.off("change", setupOnChnage);
    }

    /*
     *
     * Signal Emitters
     *
     */

    setup(cm);
    cm.on("change", setupOnChnage);
    cm.on("changes", onChnages);
    cm.on("cursorActivity", onCursorActivity);
  });

  function setupOnChnage(cm, change) {
    if (change.origin !== "setValue") return;
  }
  function setup(cm) {
    cm.getAllMarks().forEach((m) => m.clear());

    tags = {};
    let isFirstBlock = true;
    let endOfLastTag = getDocBoundaries(cm.doc).start;
    const { regex, tagsInfos } = cm.options.editableAreas;
    cm.doc.eachLine((line) => {
      const lineMatches = cm
        .lineInfo(line)
        .text.matchAll(new RegExp(regex, "g"));

      for (let res of lineMatches) {
        // The line is changed later on in the loop so we need to get each time the line infos
        let lineInfo = cm.lineInfo(line);
        let startOfMatch = {
          line: lineInfo.line,
          ch: lineInfo.text.indexOf(res[0]),
        };
        let endOfMatch = {
          ...startOfMatch,
          ch: startOfMatch.ch + res[0].length,
        };

        // Replace the mark with two space. Each space will be called a blank
        cm.doc.replaceRange("", startOfMatch, endOfMatch, "remove-marker");

        // Put codeBase with left blank in readOnly
        cm.doc.markText(endOfLastTag, startOfMatch, {
          className: "code-base",
          inclusiveLeft: isFirstBlock,
          inclusiveRight: false,
          readOnly: true,
        });

        let tagType = "tag";
        const multiline = tagsInfos ? tagsInfos[res[1]]?.multiline : false;
        if (multiline) tagType = "tag-multiline";

        //  Set the placeholderspot
        const tag = cm.doc.markText(startOfMatch, startOfMatch, {
          className: tagType,
          attributes: { name: res[1] },
          inclusiveLeft: true,
          inclusiveRight: true,
          clearWhenEmpty: false,
          readOnly: false,
        });

        // TODO: Give more infos on the error
        if (res[1] in tags) {
          CodeMirror.signal(cm, "configurationError");
          cm.setValue("");
          return;
        } else if (!isFirstBlock && posEqual(endOfLastTag, startOfMatch)) {
          CodeMirror.signal(cm, "configurationError");
          cm.setValue("");
          return;
        }

        tags[res[1]] = {
          marker: tag,
          content: "",
          cursorIn: false,
          multiline: multiline,
        };

        isFirstBlock = false;

        setEmptyTag(cm, startOfMatch);

        endOfLastTag = startOfMatch;
      }
    });

    // ReadOnly from last match to the end of the doc
    cm.doc.markText(endOfLastTag, getDocBoundaries(cm.doc).end, {
      className: "code-base",
      inclusiveLeft: false,
      inclusiveRight: true,
      readOnly: true,
    });

    // Remove the deletion of the markers from the history.
    cm.doc.clearHistory();
  }

  /*
   *
   * Event Handlers
   *
   */

  // Set empty tag when a tag is beeing emptied
  function setEmptyTagOnChanged(cm, tag) {
    const tagPos = tag.marker.find();
    const cursorPos = cm.doc.getCursor();
    if (tag.content.length === 0) {
      if (!inRange(tagPos, cursorPos, true) || cm.doc.somethingSelected())
        setEmptyTag(cm, tagPos.to);
    } else {
      cm.doc
        .findMarksAt(tagPos.from)
        .filter((m) => m.type === "bookmark")
        .find((m) => m.replacedWith?.className === "tag-empty")
        ?.clear();
    }
  }

  // Remove the empty tag when enter an empty tag
  function clearEmptyTagOnEntry(cm, tag) {
    if (tag.content.length > 0) return;

    const tagPos = tag.marker.find();
    const emptyTagAtCursor = cm.doc
      .findMarksAt(tagPos.from)
      .filter((m) => m.type === "bookmark")
      .find((m) => m.replacedWith?.className === "tag-empty");

    emptyTagAtCursor?.clear();
  }

  // Add an empty tag when leaving an empty tag
  function setEmptyTagOnLeave(cm, tag) {
    const tagPos = tag.marker.find();
    const emptyTagAtCursor = cm.doc
      .findMarksAt(tagPos.from)
      .filter((m) => m.type === "bookmark")
      .find((m) => m.replacedWith?.className === "tag-empty");

    if (tag.content.length > 0 || emptyTagAtCursor) return;

    setEmptyTag(cm, tagPos.from);
  }

  // Set style of multiline placehorders
  function setMultilineStyleOnEnter(cm, tag) {
    if (!tag.multiline) return;

    let tagPos = tag.marker.find();

    cm.doc.addLineClass(tagPos.from.line, "wrap", "tag-wrap");
  }

  // Remove style of multiline placehorders
  function clearMultilineStyleOnEnter(cm, tag) {
    if (!tag.multiline || tag.content.length > 0) return;

    let tagPos = tag.marker.find();
    cm.doc.removeLineClass(tagPos.from.line, "wrap", "tag-wrap");
  }

  // Add multiline tag style on new lines
  function setMultilineStyleOnChange(cm, tag) {
    if (!tag.multiline) return;

    const { from, to } = tag.marker.find();

    // The first line of the tag already has the style from the tagEnter
    for (let i = from.line + 1; i <= to.line; i++)
      cm.doc.addLineClass(i, "wrap", "tag-wrap");
  }

  // Set an insert caret style when entering an empty tag
  function setInsertCaretOnEnter(cm, tag) {
    if (tag.content.length > 0) return;

    const { to } = tag.marker.find();
    setBlinkCaret(cm, to);
  }

  // Remove insert caret style when leaving a tag
  function clearInsertCaretOnLeave(cm, tag) {
    if (tag.content.length > 0) return;
    const { to } = tag.marker.find();
    cm.doc
      .findMarksAt(to)
      .filter((m) => m.type === "bookmark")
      .find((m) => m.replacedWith.className === "insert-caret")
      ?.clear();
    document.getElementById("insert-caret-style")?.remove();
  }

  // Remove insert caret style when a content is set in the tag
  // Set insert caret style when tag is emptied
  function insertCaretOnChange(cm, tag) {
    const tagPos = tag.marker.find();
    if (tag.content.length === 0) {
      const cursorPos = cm.doc.getCursor();
      if (inRange(tagPos, cursorPos, true) && !cm.doc.somethingSelected())
        setBlinkCaret(cm, tagPos.to);
    } else {
      cm.doc
        .findMarksAt(tagPos.to)
        .filter((m) => m.type === "bookmark")
        .find((m) => m.replacedWith.className === "insert-caret")
        ?.clear();
      document.getElementById("insert-caret-style")?.remove();
    }
  }

  // Prevent new lines in non-multiline tags
  function preventNewLineBeforeChange(cm, change) {
    if (["undo", "redo", "setValue"].includes(change.origin)) return;
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
    if (firstTagMarker?.className === "tag-multiline") return;
    change.update(change.from, change.to, change.text.slice(0, 1));
  }

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

  function posEqual(p1, p2) {
    return p1.line === p2.line && p1.ch === p2.ch
  }

  // Emit a singal when a tag changed
  function onChnages(cm) {
    for (const tagName in tags) {
      const tag = tags[tagName];
      const { from, to } = tag.marker.find();
      const newContent = cm.doc.getRange(from, to);
      if (tag.content !== newContent) {
        tag.content = newContent;
        CodeMirror.signal(cm, "tagContentChange", cm, {
          ...tag,
          name: tagName,
        });
      }
    }
  }

  // Emit a signal when the cursor enter or leaves a tag
  function onCursorActivity(cm) {
    if (cm.doc.somethingSelected()) return;
    const cursorPos = cm.doc.getCursor();

    for (const tagName in tags) {
      const tag = tags[tagName];

      if (inRange(tag.marker.find(), cursorPos, true) && !tag.cursorIn) {
        tag.cursorIn = true;
        CodeMirror.signal(cm, "tagEnter", cm, tag);
      } else if (!inRange(tag.marker.find(), cursorPos, true) && tag.cursorIn) {
        tag.cursorIn = false;
        CodeMirror.signal(cm, "tagLeave", cm, tag);
      }
    }
  }

  // Navigate backward and forward through the tags
  function navigateTags(cm, forward) {
    let cursorPos = cm.doc.getCursor();
    let currentTag = cm.doc
      .findMarksAt(cursorPos)
      .find((m) => m.className == "tag" || m.className == "tag-multiline");

    let tags = cm.doc
      .getAllMarks()
      .filter((m) => m.className == "tag" || m.className == "tag-multiline");

    if (tags.length === 0) return;

    let newTagIndex = forward ? 0 : tags.length - 1;

    if (currentTag) {
      const shiftValue = forward ? 1 : -1;
      const inverterValue = forward ? 0 : tags.length;
      let currentTagIndex = tags.indexOf(currentTag);
      newTagIndex =
        (currentTagIndex + shiftValue + inverterValue) % tags.length;
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
  }
});
