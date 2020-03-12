// https://docs.cypress.io/api/introduction/api.html

beforeEach(function () {
  cy.visit('/')
});

describe('My First Test', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('button', 'Submit')
  })
})

describe('Initial WebComp', () => {
  it('Should display three empty tags', () => {
    cy.visit('/')
    cy.get('.tag-empty').should('have.length', 3)
  })

  it('Should display elipsses in the empty tags', () => {
    cy.get('.tag-empty').should(($p) => {
      for (let el of $p) {
        expect(el).to.contain('\u22c5\u22c5\u22c5')
      }
    })
  })

  it('Should have the data-name attribute corresponding to the tag', () => {
    cy.get('.tag-empty').should(($p) => {
      const dataNames = $p.map((i, el) => {
        return Cypress.$(el).attr('data-name')
      })

      expect(dataNames.get()).to.deep.eq([
        'cond', 'another', 'world'
      ])

    })
  })
})

describe('Click on emptyTags', () => {
  it('should diplay two b-tag instead', () => {
    cy.visit('/')


    cy.get('.tag-empty').eq(0).click()
    cy.get('.tag-empty').should('have.length', 2)
    cy.get('.b-tag').should('have.length', 2)

    cy.get('.tag-empty').eq(0).click()
    cy.get('.tag-empty').should('have.length', 2)
    cy.get('.b-tag').should('have.length', 2)

    cy.get('.tag-empty').eq(1).click()
    cy.get('.tag-empty').should('have.length', 2)
    cy.get('.b-tag').should('have.length', 2)

  })

  it('b-tag should have the data-name attribute corresponding to the tag', () => {
    cy.get('.tag-empty').eq(0).click()
    cy.get('.b-tag').should('have.attr', 'data-name', 'cond')

    cy.get('.tag-empty').eq(0).click()
    cy.get('.b-tag').should('have.attr', 'data-name', 'another')


    cy.get('.tag-empty').eq(1).click()
    cy.get('.b-tag').should('have.attr', 'data-name', 'world')

    cy.get('body').click()
    cy.get('.tag-empty').eq(1).click()
    cy.get('.b-tag').should('have.attr', 'data-name', 'another')

    cy.get('body').click()
    cy.get('.tag-empty').eq(2).click()
    cy.get('.b-tag').should('have.attr', 'data-name', 'world')

  })

  it('b-tag text should be one space', () => {
    cy.get('body').click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
    
    cy.get('body').click()
    cy.get('.tag-empty').eq(0).click()
    cy.get('.CodeMirror-code').should('have.text', '1while    \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')

    cy.get('body').click()
    cy.get('.tag-empty').eq(1).click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5   :2    print("hello \u22c5\u22c5\u22c5")')

    cy.get('body').click()
    cy.get('.tag-empty').eq(2).click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello   ")')
    cy.get('body').click()

  })
})

describe('Write in tag', () => {
  it('should remove the b-tag when you start writing', () => {
    cy.get('.tag-empty').eq(0).type('a')
    cy.get('.CodeMirror-code').should('have.text', '1while a \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
  })

  it('should leave the written text when clicking somewere else', () => {
    cy.get('.tag-empty').eq(0).type('aaaa')
    cy.get('body').click()
    cy.get('.CodeMirror-code').should('have.text', '1while aaaa \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
  })

  it('should write in all the tag where I try to type', () => {
    cy.get('.tag-empty').eq(0).type('test1')
    cy.get('.CodeMirror-code').should('have.text', '1while test1 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
    
    cy.get('.tag-empty').eq(0).type('test2')
    cy.get('.CodeMirror-code').should('have.text', '1while test1 test2:2    print("hello \u22c5\u22c5\u22c5")')

    cy.get('.tag-empty').eq(0).type('test3')
    cy.get('.CodeMirror-code').should('have.text', '1while test1 test2:2    print("hello test3")')

  })
})

describe('Leave tag', () => {
  it('should re-set the ellipse when leave the tag', () => {
    cy.get('.tag-empty').eq(0).click()
    cy.get('.CodeMirror-code').should('have.text', '1while    \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
    cy.get('body').click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')

    cy.get('.tag-empty').eq(1).click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5   :2    print("hello \u22c5\u22c5\u22c5")')
    cy.get('body').click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')

    cy.get('.tag-empty').eq(2).click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello   ")')
    cy.get('body').click()
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
  })
})

describe('Delete text', () => {
  it("should reset the two spaces when all the text is deleted", () => {
    cy.get('.tag-empty').eq(0).type("aa{backspace}{backspace}")
    cy.get('.CodeMirror-code').should('have.text', '1while    \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
  })

  it('should reset the two spaces when selecting and deleting all the text', () => {
    cy.get('.tag-empty').eq(0).type("aa")
    cy.get('.CodeMirror-code').should('have.text', '1while aa \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
    cy.get('.tag').eq(0).type('{backspace}')
    cy.get('.CodeMirror-code').should('have.text', '1while    \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
    cy.get('.tag-empty').should('have.length', 2)
    cy.get('.b-tag').should('have.length', 2)
  })

  it('should have a tag if you select an existing tag and write another text', () => {
    cy.get('.tag-empty').eq(0).type("aa")
    cy.get('.tag').eq(0).type('bb')
    cy.get('.CodeMirror-code').should('have.text', '1while bb \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
  })
})

describe('Tab to navigate tags', () => {
  it('should go to the next tags when, when they are all empty, press tab ', () => {
    cy.get('.tag').eq(0).click()
    cy.focused().tab({ shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5   :2    print("hello \u22c5\u22c5\u22c5")')
    cy.focused().tab({ shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 \u22c5\u22c5\u22c5:2    print("hello   ")')
    cy.focused().tab({ shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while    \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
    cy.focused().tab({ shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5   :2    print("hello \u22c5\u22c5\u22c5")')
  })

  it('should keep the text when press tab', () => {
    cy.get('.tag').eq(0).click()
    cy.focused().tab({shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5   :2    print("hello \u22c5\u22c5\u22c5")')
    cy.focused().type("hello").tab({ shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 hello:2    print("hello   ")')
    cy.focused().tab({shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while    hello:2    print("hello \u22c5\u22c5\u22c5")')
    cy.focused().tab({shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5 hello:2    print("hello \u22c5\u22c5\u22c5")')

  })

  it('should navigate to the first tab if no tag is selected', () => {
    cy.get('.CodeMirror-code').click()
    cy.focused().tab({ shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while    \u22c5\u22c5\u22c5:2    print("hello \u22c5\u22c5\u22c5")')
    cy.focused().tab({ shift: true })
    cy.get('.CodeMirror-code').should('have.text', '1while \u22c5\u22c5\u22c5   :2    print("hello \u22c5\u22c5\u22c5")')

  })
})
