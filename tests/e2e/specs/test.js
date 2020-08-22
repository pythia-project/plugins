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

// https://docs.cypress.io/api/introduction/api.html

beforeEach(function() {
  cy.server();
  cy.route("/api/tasks/*", "fixture:tasks/mixed/medium-size.json");
  cy.visit("/");
});

describe("Initial WebComp", () => {
  it("Should display four empty tags", () => {
    cy.get(".tag-empty").should("have.length", 4);
  });

  it("Should display elipsses in the empty tags", () => {
    cy.get(".tag-empty").should(($p) => {
      expect($p).to.have.length(4);
      expect($p.eq(0)).to.contain("\u22c5\u22c5\u22c5");
      expect($p.eq(1)).to.contain("\u22c5\u22c5\u22c5");
      expect($p.eq(2)).to.contain("\u22c5\u22c5\u22c5");
      expect($p.eq(3)).to.contain("\u22c5\u22c5\u22c5");
    });
  });
});

describe("EmptyTags", () => {
  it("should set an insert caret style to the cursor", () => {
    cy.get(".tag-empty")
      .eq(0)
      .click();
    cy.get(".tag-empty").should("have.length", 3);
    cy.get("#insert-caret-style").should("have.length", 1);

    cy.get(".tag-empty")
      .eq(0)
      .click();
    cy.get(".tag-empty").should("have.length", 3);
    cy.get("#insert-caret-style").should("have.length", 1);

    cy.get(".tag-empty")
      .eq(1)
      .click();
    cy.get(".tag-empty").should("have.length", 3);
    cy.get("#insert-caret-style").should("have.length", 1);

    cy.get(".tag-empty")
    .eq(0)
    .type("hello")

    cy.get(".tag-empty")
    .eq(0)
    .click()
    cy.get(".tag-empty").should("have.length", 2);
    cy.get("#insert-caret-style").should("have.length", 1);


    cy.get(".tag-empty")
    .eq(1)
    .type("hello")

    cy.get(".tag-empty")
    .eq(0)
    .click()
    cy.get(".tag-empty").should("have.length", 1);
    cy.get("#insert-caret-style").should("have.length", 1);


  });

  it("should swap the ellipse for a space", () => {
    cy.get(".tag-empty")
      .eq(0)
      .click();
    cy.get(".tag-empty").should("have.length", 3);
    cy.get(".insert-caret")
      .should("have.length", 1)
      .should("have.text", " ");

    cy.get(".tag-empty")
      .eq(0)
      .click();
    cy.get(".tag-empty").should("have.length", 3);
    cy.get(".insert-caret")
      .should("have.length", 1)
      .should("have.text", " ");

    cy.get(".tag-empty")
      .eq(1)
      .click();
    cy.get(".tag-empty").should("have.length", 3);
    cy.get(".insert-caret")
      .should("have.length", 1)
      .should("have.text", " ");
  });

  it("should clear the empty tag when the cursor is moved next to it", () => {
    cy.route("/api/tasks/*", "fixture:tasks/non-multiline/mini.json");
    cy.visit("/");

    cy.get(":nth-child(1) > .CodeMirror-line").click({ position: "left" });
    cy.get(".tag-empty").should("have.length", 1);
    cy.focused().type(
      "{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}"
    );
    cy.get(".tag-empty").should("have.length", 0);
    cy.focused().type("{rightarrow}");
    cy.get(".tag-empty").should("have.length", 1);

    cy.focused().type("{leftarrow}");
    cy.get(".tag-empty").should("have.length", 0);
  });
});

describe("Write in tag", () => {
  it("should remove the insert caret when you start writing", () => {
    cy.get(".tag-empty")
      .eq(0)
      .type("a");
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while a \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
  });

  it("should write in all the tag where I try to type", () => {
    cy.get(".tag-empty")
      .eq(0)
      .type("test1");
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while test1 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );

    cy.get(".tag-empty")
      .eq(0)
      .type("test2");
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while test1 test2:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );

    cy.get(".tag-empty")
      .eq(0)
      .type("test3");
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while test1 test2:2    print("hello test3")3\u22c5\u22c5\u22c5'
    );
    cy.get(".tag-empty")
      .eq(0)
      .type("test4");
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while test1 test2:2    print("hello test3")3test4'
    );
  });

  it("should write in a tag with the placeholder name as attribute", () => {
    cy.get(".tag-empty")
      .eq(0)
      .type("test1");
    cy.get(".tag")
      .eq(0)
      .should("have.text", "test1")
      .should("have.attr", "name", "cond");

    cy.get(".tag-empty")
      .eq(0)
      .type("test2");
    cy.get(".tag")
      .eq(1)
      .should("have.text", "test2")
      .should("have.attr", "name", "another");

    cy.get(".tag-empty")
      .eq(0)
      .type("test3");
    cy.get(".tag")
      .eq(2)
      .should("have.text", "test3")
      .should("have.attr", "name", "world");
    cy.get(".tag-empty")
      .eq(0)
      .type("test4");
    cy.get(".tag-multiline")
      .eq(0)
      .should("have.text", "test4")
      .should("have.attr", "name", "body");
  });
});

describe("Leave tag", () => {
  it("should re-set the ellipse when leave the tag", () => {
    cy.get(".tag-empty")
      .eq(0)
      .click();
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while   \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );

    cy.get(":nth-child(1) > .CodeMirror-line").click();
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );

    cy.get(".tag-empty")
      .eq(1)
      .click();
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5  :2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );

    cy.get(":nth-child(1) > .CodeMirror-line").click({ position: "left" });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );

    cy.get(".tag-empty")
      .eq(2)
      .click();
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello  ")3\u22c5\u22c5\u22c5'
    );

    cy.get(":nth-child(1) > .CodeMirror-line").click();
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
  });
});

describe("Delete text", () => {
  it("should reset the insert caret when all the text is deleted", () => {
    cy.get("#insert-caret-style").should("have.length", 0);

    cy.get(".tag-empty")
      .eq(0)
      .type("aa{backspace}{backspace}");
    cy.get("#insert-caret-style").should("have.length", 1);

    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while   \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
  });

  it("should reset the the insert caret when selecting and deleting all the text", () => {
    cy.get("#insert-caret-style").should("have.length", 0);

    cy.get(".tag-empty")
      .eq(0)
      .type("aa");
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while aa \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
    cy.get(".tag")
      .eq(0)
      .type("{selectall}")
      .type("{backspace}");
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while   \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
    cy.get("#insert-caret-style").should("have.length", 1);
  });

  it("should delete the text and put the ellipse in all the selected tags", () => {
    cy.get(".tag-empty")
      .eq(0)
      .type("a");
    cy.get(".tag-empty")
      .eq(0)
      .type("b");
    cy.get(".tag-empty")
      .eq(0)
      .type("c");

    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while a b:2    print("hello c")3\u22c5\u22c5\u22c5'
    );

    cy.get(":nth-child(1) > .CodeMirror-line").click();
    cy.focused().type(
      "{leftarrow}{shift}{leftarrow}{leftarrow}{leftarrow}"
    );
    cy.focused().type("{backspace}");
    cy.focused().type("{rightarrow}")

    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello c")3\u22c5\u22c5\u22c5'
    );
  });
});

xdescribe("Tab to navigate tags", () => {
  it("should go to the next tags when, when they are all empty, press tab ", () => {
    cy.get(".tag-empty")
      .eq(0)
      .click();
    cy.focused().tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5  :2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
    cy.focused().tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello  ")3\u22c5\u22c5\u22c5'
    );
    cy.focused().tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while   \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
    cy.focused().tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5  :2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
  });

  it("should keep the text when press tab", () => {
    cy.get(".tag")
      .eq(0)
      .click();
    cy.focused().tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5  :2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
    cy.focused()
      .type("hello")
      .tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 hello:2    print("hello  ")3\u22c5\u22c5\u22c5'
    );
    cy.focused().tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while   hello:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
    cy.focused().tab({ alt: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5 hello:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
  });

  it("should navigate to the first tab if no tag is selected", () => {
    cy.get(".CodeMirror-code").click();
    cy.focused().tab({ shift: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while   \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
    cy.focused().tab({ shift: true });
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while \u22c5\u22c5\u22c5  :2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
  });

});
describe("Multiline handeling", () => {
  it("should not allow to put a new line in a non-multiline tag", () => {
    cy.route("/api/tasks/*", "fixture:tasks/non-multiline/mini.json")
    cy.visit('/')

    cy.get(".tag-empty").first().click()
    cy.focused().type("this is line 1{enter}this is line two")
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while this is line 1this is line two:'
    );
  });

  it("should allow to put a new line in a multiline tag", () => {
    cy.route("/api/tasks/*", "fixture:tasks/multiline/mini.json")
    cy.visit('/')

    cy.get(".tag-empty").first().click()

    cy.focused().type("this is line 1{enter}this is line two")
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1def foo():2this is line 13this is line two'
    );
  });

  xit("should only copy the first line when pasting multiple line in a non-multiline tag", () => {
    cy.route("/api/tasks/*", "fixture:tasks/non-multiline/mini.json")
    cy.visit('/')

    // TODO: replace with a paste when available
    cy.get(".tag-empty").first().type("this is line 1\nthis is line two")
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while this is line 1:'
    );
  })

  xit("should copy all lines when pasting multiple line in a non-multiline tag", () => {
    cy.route("/api/tasks/*", "fixture:tasks/multiline/mini.json")
    cy.visit('/')

    // TODO: replace with a paste when available
    cy.get(".tag-empty").first().type("this is line 1\nthis is line two")
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1def foo():2this is line 13this is line two'
    );
  })
})

describe("Edit tag from a selection", () => {
  // Not working due to a issue from codemirror
  xit("should write in the selected tag if when there is only one selected", () => {
    cy.route("/api/tasks/*", "fixture:tasks/non-multiline/mini.json")
    cy.visit('/')
    cy.get(":nth-child(1) > .CodeMirror-line").click({ position: "left" });
    cy.focused().type("{shift}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}").type("hello")

    cy.get(".CodeMirror-code").should("have.text", "1while hello:")
  })

  // Paste is not available
  xit("should paste in the first tag when there are multiple tag selected", () => {
    cy.get(":nth-child(1) > .CodeMirror-line").click({ position: "left" });
    cy.focused().type("{shift}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}").type("hello")
    cy.get(".CodeMirror-code").should(
      "have.text",
      '1while hello \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")3\u22c5\u22c5\u22c5'
    );
  })
})
