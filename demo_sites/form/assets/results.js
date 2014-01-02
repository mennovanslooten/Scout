(function($) {

    function decode(s) {
        return s ? decodeURIComponent(s.replace(/\+/g, ' ')) : '';
    }

    var query = location.search.substr(1);
    var parsed = {};

    var pairs = query.split('&');
    $.each(pairs, function(index, item) {
        var pair = item.split('=');
        var name = decode(pair[0]);
        var value = decode(pair[1]);
        //console.log(pair, name, value, name in parsed);
        if (!(name in parsed)) {
            parsed[name] = [value];
        } else {
            parsed[name].push(value);
        }
    });

    var results = $('#results');
    $.each(parsed, function(name, values) {
        results.append('<dt id="' + name + '">' + name + '</dt>');

        $.each(values, function(index, value) {
            results.append('<dd>' + value + '</dd>');
        });
    });

})(jQuery, undefined);
