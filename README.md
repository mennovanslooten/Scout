# DummyJS
**Making headless testing a brainless activity**

DummyJS is a super simple Functional Testing extension for PhantomJS.

## Example

Here's an example of a test, functionally identical to the
[Google example for CasperJS](http://docs.casperjs.org/en/latest/quickstart.html).
It opens the French Google homepage, types "DummyJS" into the search box and
submits. Finally, it checks some properties of the results page.

```apache
## Google search retrieves 10 or more results
open               http://www.google.fr/
assertTitle        Google
assertExists       form[action="/search"]
type               input[name="q"]               DummyJS
submit             form[action="/search"]
assertTitle        DummyJS - Recherche Google
assertUrl          q=DummyJS
assertMinLength    h3.r                          10
```

Note the lack of callbacks or `waitFor` statements. **DummyJS waits between 
steps for processes like DOM updates and page loads to complete.**

Running this test in a terminal would produce something like this:

```
$ dummyjs demo_tests/google.dummy

################################################################
# Starting ./demo_tests/google.dummy (9 actions)
################################################################

# Google search retrieves 10 or more results
  ✓ open                    http://www.google.fr/
  ✓ assertTitle             Google
  ✓ assertExists            form[action="/search"]
  ✓ type                    input[name="q"]         dummy
  ✓ submit                  form[action="/search"]
  ✓ assertTitle             dummy - Recherche Google
  ✓ assertUrl               q=dummy
  ✓ assertMinLength         h3.r                    10
PASS: Executed 8 actions in 1s.
```

## Installation

Step 1 - clone this github repo:

    $ git clone https://github.com/mennovanslooten/DummyJS.git

Step 2 - cd into `DummyJS`:

    $ cd DummyJS

Step 3 - install with [npm](https://npmjs.org/):

    $ npm install . -g

This will automatically install the PhantomJS dependency if it's not installed
already. It's possible this command needs to be run with admin priviliges:

    $ sudo npm install . -g


## Writing Tests

Tests are simple plain-text files with a `.dummy` extension where every line is
a _command_. There are 4 kinds of commands: Comments, Logs, Asserts and User actions.

### Comments & Logs

```apache
# This is a comment. Comments and empty lines are ignored
## This is a log statement. It will be written to the terminal
```

### Asserts

Asserts test the DOM for certain properties. This is the "Testing" part in
"Functional Testing". Here are some examples of available asserts:

```apache
# assertExists tests if there is at least one element on the page that matches
# the selector
assertExists    .some-css-selector

# assertVisible tests if there is at least one visible element on the page that
# matches the selector
assertVisible   .some-css-selector

# assertHidden tests if all elements that match the selector are invisible
assertHidden    .some-css-selector
```

As you may have noticed, the parameters of each line are separated by spaces. 
It does not matter by how many spaces, as long as there are more than two.

Selector matching is done by jQuery, so
[all jQuery selector extensions](http://api.jquery.com/category/selectors/jquery-selector-extensions/)
are supported.

### User actions

User actions are instructions to DummyJS to simulate an action performed by
a user. This is the "Functional" part in "Functional Testing". Currently, 
there are three actions:

```apache
# "open" loads the provided URL into a headless browser instance.
open        http://google.com

# "click" simulates a user moving the mouse to the first element that matches
# the selector and then clicking
click       .some-css-selector

# "type" performs a "click" and then simulates the keystrokes needed to type
# the text
type        .some-css-selector     DummyJS
```

As real users can only `click` and `type` on elements that are visible,
DummyJS will silently do an `assertVisible` first for these actions. If the
elements are visible but outside of the page's viewport, they will be scrolled
into view before the actions are performed.
