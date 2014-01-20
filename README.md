# DummyJS
**Making headless testing a brainless activity**

DummyJS is a super simple Functional Testing extension for PhantomJS. It's
heavily inspired by the functional testing of [CasperJS](http://casperjs.org/)
but not nearly as flexible and way easier. You could say it's like CasperJS for dummies.

## Example

Here's an example of a test, more or less identical to the
[Google example for CasperJS](http://docs.casperjs.org/en/latest/quickstart.html).
It opens the Dutch Google homepage, types "DummyJS" into the search box and
presses the enter key. Finally, it checks some properties of the results page.

```apache
## Google search retrieves 10 or more results
open               http://www.google.com/
assertTitle        Google
assertExists       form[action="/search"]
type               input[name="q"]              DummyJS<Enter>
assertTitle        DummyJS - Google zoeken
assertUrl          q=DummyJS
assertMinLength    h3.r                         10
```

Note the lack of callbacks or `waitFor` statements. **DummyJS waits between 
steps for processes like DOM updates and page loads to complete.** 

Running this test in a terminal would produce something like this:

```
$ dummyjs demo_tests/google.dummy

################################################################
# Starting ./demo_tests/google.dummy (8 actions)
################################################################

# Google search retrieves 10 or more results
  ✓ open                    http://www.google.nl/
  ✓ assertTitle             Google
  ✓ assertExists            form[action="/search"]
  ✓ type                    input[name="q"]         DummyJS<Enter>
  ✓ assertTitle             DummyJS - Google zoeken
  ✓ assertUrl               q=DummyJS
  ✓ assertMinLength         h3.r                    10
PASS: Executed 7 actions in 1s.
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

Test your installation by running an empty test

```
$ touch mytest.dummy && dummyjs mytest.dummy

################################################################
# Starting ./mytest.dummy (0 actions)
################################################################
PASS: Executed 0 actions in 0s.
```


## Writing Tests

Tests are simple plain-text files with a `.dummy` extension where every line is
a _command_. There are 4 kinds of commands: Comments, Logs, Asserts and User actions.

### Comments & Logs

```apache
# Lines starting with "#" are comments. Comments and empty lines are ignored

## Lines starting with "##" are log statements. They are written to the terminal
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

# assertHasClass tests if there is an element that matches the selector and
# also has the provided class name
assertHasClass  .some-css-selector    .extra-class

# assertText tests if there is at least one visible element on the page that
# matches the selector and contains the provided text
assertText      .some-css-selector    Lorem ipsum dolor
```

As you may have noticed, the parameters of each line are separated by spaces. 
It does not matter by how many spaces, as long as there are more than two.

Selector matching is done by jQuery, so
[all jQuery selector extensions](http://api.jquery.com/category/selectors/jquery-selector-extensions/)
are supported. If jQuery is not already included in the page that is tested, it
is *injected* into the page.

### User actions

User actions are instructions to DummyJS to simulate an action performed by
a user. This is the "Functional" part in "Functional Testing". Currently, 
these are the actions:

```apache
# "open" loads the provided URL into a headless browser instance.
open        http://google.com

# "click" simulates a user moving the mouse to the first element that matches
# the selector and then performing a left mouse click. 
click       .some-css-selector

# Alternatively, you can pass `x, y` pixel coordinates in stead of a selector:
click       123, 456

# Double-clicking is also supported:
dblclick    .some-css-selector

# "type" performs a "click" and then simulates the keystrokes needed to type
# the text
type        .some-css-selector     DummyJS
```

As real users can only `click` and `type` on elements that are visible,
DummyJS will silently do an `assertVisible` first for these actions. If the
elements are visible but outside of the page's viewport, they will be scrolled
into view before the actions are performed.

## Running tests

If you have installed DummyJS with npm and saved your DummyJS test file with a 
`.dummy` extension, you can run it from the command line:

    $ dummyjs mytest.dummy

This will run this single test file. If you want to run more than one test, you
can add them as arguments:

    $ dummyjs mytest.dummy anothertest.dummy yetanother.dummy

You can combine test files in a directory and run all of them by passing the
directory name as an argument. Note: this will run *all* `.dummy` files in the
directory, even if they are in deeper directories.

    $ dummyjs /path/to/my/tests

## Why?

In case you're wondering "Why do we need _another_ way to write Functional
Tests?" you probably don't and that's fine. 
