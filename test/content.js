var should = require('chai').should(),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');

var sizeOfHeaderNavbarFooter = 2519;

describe('Testing the content requests', function() {

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
                res.text.should.have.length.of.at.least(sizeOfHeaderNavbarFooter + 800);
                res.text.should.contain("<!-- file: header.html -->")
                res.text.should.contain("<!-- file: navbar.html -->")
                res.text.should.contain("<!-- file: footer.html -->")
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

    describe('Serving JS files works...', function() {
        it('/js/global.js returns javascript file', function(done) {
            api.get('/js/global.js')
            .expect(200)
            .expect('Content-Type', 'text/javascript')
            .end(function(err, res) {
                if (err) { return done(err); }
                res.text.should.have.length.of.at.least(10);
                done();
            });
        });
        it('/js/plugins.js returns javascript file', function(done) {
            api.get('/js/plugins.js')
            .expect(200)
            .expect('Content-Type', 'text/javascript')
            .end(function(err, res) {
                if (err) { return done(err); }
                res.text.should.have.length.of.at.least(10);
                done();
            });
        });
        it('/js/showLog.js returns javascript file', function(done) {
            api.get('/js/showLog.js')
            .expect(200)
            .expect('Content-Type', 'text/javascript')
            .end(function(err, res) {
                if (err) { return done(err); }
                res.text.should.have.length.of.at.least(10);
                done();
            });
        });
        it('/js/main.js returns javascript file', function(done) {
            api.get('/js/main.js')
            .expect(200)
            .expect('Content-Type', 'text/javascript')
            .end(function(err, res) {
                if (err) { return done(err); }
                res.text.should.have.length.of.at.least(10);
                done();
            });
        });
        it('/js/addAccessory.js returns javascript file', function(done) {
            api.get('/js/addAccessory.js')
            .expect(200)
            .expect('Content-Type', 'text/javascript')
            .end(function(err, res) {
                if (err) { return done(err); }
                res.text.should.have.length.of.at.least(10);
                done();
            });
        });
        it('/js/addPlatform.js returns javascript file', function(done) {
            api.get('/js/addPlatform.js')
            .expect(200)
            .expect('Content-Type', 'text/javascript')
            .end(function(err, res) {
                if (err) { return done(err); }
                res.text.should.have.length.of.at.least(10);
                done();
            });
        });
        it('/js/footer.js returns javascript file', function(done) {
            api.get('/js/footer.js')
            .expect(200)
            .expect('Content-Type', 'text/javascript')
            .end(function(err, res) {
                if (err) { return done(err); }
                res.text.should.have.length.of.at.least(10);
                done();
            });
        });
    });

    describe('Requesting unknown file', function() {
        it('returns 404 error', function(done) {
            api.get('/imnotexisting.html')
            .expect(404, done);
            // .end(function (err, res) {
                // done();
            // });
        });
    });
});
