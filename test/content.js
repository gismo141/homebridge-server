var should = require('chai').should(),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');

var sizeOfHeaderNavbarFooter = 2519;


describe('/', function() {
    it('returns the main HTML page', function(done) {
        api.get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            res.text.should.have.length.of.at.least(sizeOfHeaderNavbarFooter + 800);
            res.text.should.contain("<!-- file: header.html -->")
            res.text.should.contain("<!-- file: navbar.html -->")
            res.text.should.contain("<!-- file: footer.html -->")
            done();
        });
    });
});


describe('/listInstallablePlugins', function() {
    it('returns the main listInstallablePlugins page', function(done) {
        api.get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            res.text.should.have.length.of.at.least(sizeOfHeaderNavbarFooter + 800);
            res.text.should.contain("<!-- file: header.html -->")
            res.text.should.contain("<!-- file: navbar.html -->")
            res.text.should.contain("<!-- file: footer.html -->")
            done();
        });
    });
});


describe('/addPlatform', function() {
    it('returns the addPlatform HTML page', function(done) {
        api.get('/addPlatform')
        .expect(200)
        .expect('Content-Type', /html/)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            res.text.should.have.length.of.at.least(sizeOfHeaderNavbarFooter + 800);
            res.text.should.contain("<!-- file: header.html -->")
            res.text.should.contain("<!-- file: navbar.html -->")
            res.text.should.contain("<!-- file: footer.html -->")
            done();
        });
    });
});

describe('/addAccessory', function() {
    it('returns the addAccessory HTML page', function(done) {
        api.get('/addAccessory')
        .expect(200)
        .expect('Content-Type', /html/)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            res.text.should.have.length.of.at.least(sizeOfHeaderNavbarFooter + 700);
            res.text.should.contain("<!-- file: header.html -->")
            res.text.should.contain("<!-- file: navbar.html -->")
            res.text.should.contain("<!-- file: footer.html -->")
            done();
        });
    });
});


describe('/content/lib.js', function() {
    it('returns /content/lib.js', function(done) {
        api.get('/content/lib.js')
        .expect(200)
        .expect('Content-Type', 'application/javascript')
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            res.text.should.have.length.of.at.least(300);
            res.text.should.not.contain("<!-- file: header.html -->")
            res.text.should.not.contain("<!-- file: navbar.html -->")
            res.text.should.not.contain("<!-- file: footer.html -->")
            done();
        });
    });
});


describe('/style.css', function() {
    it('returns /style.css', function(done) {
        api.get('/style.css')
        .expect(200)
        .expect('Content-Type', 'text/css')
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            res.text.should.have.length.of.at.least(300);
            res.text.should.not.contain("<!-- file: header.html -->")
            res.text.should.not.contain("<!-- file: navbar.html -->")
            res.text.should.not.contain("<!-- file: footer.html -->")
            done();
        });
    });
});
