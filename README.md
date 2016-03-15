# jquery.gavel

Easily extendable jQuery validation plugin. This plugin acts as a highly customizable framework for validation rather than a "fully-featured" validation engine. It provides basic validation for most situations but its strength lies in how easy it is to add additional features.

##Usage

To add Gavel to a project, inlcude the jquery library as well as jquery.gavel in the ```<head>``` of your HTML:

```html
<script type="text/javascript" src="jquery.min.js"></script>
<script type="text/javascript" src="jquery.gavel.js"></script>
```

Now, add a form to your ```<body>```:

```html
<form method="GET" name="example" id="example">
    <input name="example_input1" type="text"/>
    <input value="Submit" id="submit" type="submit"/>
</form>
```

In order to include form inputs into the Gavel validation, add 'data-gavel' to the inputs:

```html
<form method="GET" name="example" id="example">
    <input name="example_input1" type="text" data-gavel/>
    <input value="Submit" id="submit" type="submit"/>
</form>
```

You will now want to add a list of rules the input should validate against:

```html
<form method="GET" name="example" id="example">
    <input name="example_input1" type="text" data-gavel="required|alphabetic"/>
    <input value="Submit" id="submit" type="submit"/>
</form>
```

Finally, to initiate Gavel on the form add the following line to your JavaScript:

```javascript
$("#example").gavel();
```

This will initiate Gavel on '#example' in the simplest manner possible. Meaning you will get all the default configuration settings without any additional validation rules or messages.

To specifiy a different container for errors, add 'data-gavel-errorcont' like this:

```html
<form method="GET" name="example" id="example">
    <input name="example_input1" type="text" data-gavel="required|alphabetic" data-gavel-errorcont=".errorContainer1"/>
    <div class="errorContainer1"></div>
    <input value="Submit" id="submit" type="submit"/>
</form>
```

This can be useful when dealing with radio and checbox inputs.

###Settings

Option | Type | Default | Description
------ | ---- | ------- | -----------
errorText | booelan | true | Indicates whether a text error should be outputted
errorContainer | string | 'span' | The HTML element used to output text errors
errorClass | string | 'gavelError' | Class used for the default errorContainer
afterEach | function | null | Function called after each input is validated
afterAll | function | null | Function called once the form has been validated
initiated | boolean | false | Indicates whether the plugin has been initiated
validation | object | See 'Rules' below | Object containing all validation rules
inputEvents | array|['keyup', 'change', 'blur'] | List of input events that trigger Gavel validation
formEvents | array|['submit'] | List of form events that trigger Gavel validation

###Rules

Rule | Message | Usage
---- | ------- | -----
alphanumeric | Only alphanumeric characters are permitted | data-gavel="alphanumeric"
numeric | Only numeric characters are permitted | data-gavel="numeric"
alphabetic | Only alphabetic characters are permitted | data-gavel="alphabetic"
email | Only valid email addresses are permitted | data-gavel="email"
telephone | Only valid telephone numbers are permitted (eg. +27 00 000 0000) | data-gavel="telephone"
date | Only valid dates are permitted (eg. dd-mm-yyyy) | data-gavel="date"
required | This is a required field | data-gavel="required"
match | The fields must match | data-gavel="match[name_of_element_to_match]"
min | The min characters permitted is {min} | data-gavel="min[10]"
max | The max characters permitted is {max} | data-gavel="max[15]"

You can overide the above rules. To do this, alter the instantiation of Gavel:

```javascript
$("#example").gavel({
    validation : {
        required : { //This is how you overide the message of a rule
            message : "You must insert a value for this field"
        }
    }
});
```

You can alter any of the values of the validation rules (message, method, regex). To see more details regarding regex, methods and what else can be changed take a look at the Gavel source.

Alternatively, you can add additional rules like this:

```javascript
$("#example").gavel({
    validation : { 
        custom1 : { // This is how you add a custom validation rule that calls a function
            message : 'Must equal 123 - the following is a tag replaced value: {tag1}!',
            regex   : null,
            method  : custom1Function
        },
        custom2 : { // This is how you add a custom validation rule that uses regex
            message : 'Required - the following is a tag replaced value!', // Tag replacement is not available for regex validation
            regex   : /\S+/,
            method  : null
        }
    }
});
```

###Custom Function Formats

Gavel allows you to use custom functions when declaring afterEach, afterAll and custom validation rules. There are certain guidelines you should follow when creating these functions:

**afterEach:**

Instantiation:

```javascript
$("#example").gavel({
    afterEach : testEachFunction
}); 
```

Function: 

```javascript
function testEachFunction(valid, element) {
    // To overide an elements validity change the 'valid' object like this:
    //
    // valid.error = true;
    // valid.message = 'Form Test error';
    return valid;
}
```

**afterAll:**

Instantiation:

```javascript
$("#example").gavel({
    afterAll : testAllFunction
});
```

Function:

```javascript
function testAllFunction(valid, form) {
    // To overide an elements validity change the 'valid' object like this:
    //
    // valid.error = true;
    // valid.message = 'Form Test error';
    return valid;
}
```

**validation:**

Instantiation:

```javascript
$("#example").gavel({
    validation : { 
        custom1 : { // This is how you add a custom validation rule that calls a function
            message : 'Must equal 123 - the following is a tag replaced value: {tag1}!',
            regex   : null,
            method  : custom1Function
        }
    }
});
```

Function:

```javascript
function custom1Function(element, extra) {
    // Return a boolean of false or true to indicate validity like:
    //
    // return false // Indicates something isn't valid (return true to indicate validity)
    //
    // Or return an object containing tags that can be used to replace message placeholders, like:
    //
    // return {error: true, tags: {'tag1': 'value1'}}
    //
    // The 'extra' field will contain any bracket enclosed values in a rule, for instance ruleName[extraValues]
    return valid;
}
```

Usage: 

```html
data-gavel="custom1"
```

###Messages

Gavel has a tag replacement system that can be used to easily implement messages with parts that change based on a variable. This tag replacement system will work when a custom function is used or when certain built in functions are used.

**Builit In:**

*min:* 

Any string of "{min}" included in the message will be replaced by the min amount indicated on the rule

*max:* 

Any string of "{max}" included in the message will be replaced by the max amount indicated on the rule

**Custom**

Add an additional value in the 'valid' object returned by the custom function:

```javascript
function custom1Function(element, extra) {
    return {error: true, tags: {'{tag1}': 'Replaced Tag'}};
}
```

The above custom function will replace '{tag1}' (if found in the rule's message) with 'Replaced Tag'. 

##Examples

For example plugin usage take a look at the 'example.html' file in the 'test' directory. It contains examples of almost every features available to the plugin.
