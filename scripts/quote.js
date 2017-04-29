function getQuote() {
    return $.ajax({
        url: 'https://andruxnet-random-famous-quotes.p.mashape.com/',
        headers: {
            'X-Mashape-Key': 'MUzqdeOSo1mshCuear7hljNznBWrp1N5SPTjsngfXZ9xvMJ9dv'
        },
        method: 'POST',
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'json',
    })
};