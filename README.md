# DummyJS

DummyJS is a super simple Functional Testing extension for PhantomJS. PhantomJS testing is headless, DummyJS is brainless.

## Example

Here's an example of a test, functionally identical to the [Google example for CasperJS](http://docs.casperjs.org/en/latest/quickstart.html):

```apache
## Google search retrieves 10 or more results
open               http://www.google.fr/
assertTitle        Google
assertExists       form[action="/search"]
type               input[name="q"]               dummy
submit             form[action="/search"]
assertTitle        dummy - Recherche Google
assertUrl          q=dummy
assertMinLength    h3.r                          10
```

Note the lack of callbacks or `waitFor` statements. DummyJS waits between steps for processes like DOM updates and page loads to complete.

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


