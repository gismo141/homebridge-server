var should = require('chai').should(),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');

describe('Testing the JSON API', function() {
    describe('/api/bridgeInfo', function() {
        it('returns a JSON with bridge infos', function(done) {
            api.get('/api/bridgeInfo')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.a('object');
                res.body.should.have.property('bridgePin');
                res.body.should.have.property('bridgeName');
                res.body.should.have.property('bridgeUsername');
                res.body.should.have.property('bridgeVersion');
                res.body.should.have.property('latestVersion');
                res.body.should.have.property('bridgeMemoryUsed');
                res.body.should.have.property('bridgeUptime');
                res.body.should.have.property('bridgeHostOS');
                done();
            });
        });
    });

    describe('/api/installedPlatforms', function() {
        it('returns a JSON with a list of installed platforms', function(done) {
            api.get('/api/installedPlatforms')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property('platform');
                res.body[0].should.have.property('hbServer_pluginName');
                res.body[0].should.have.property('hbServer_active_flag');
                done();
            });
        });
    });

    describe('/api/accessories', function() {
        it('returns a JSON with a list of installed accessories', function(done) {
            api.get('/api/accessories')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.a('array');
                res.body.length.should.be.eql(0);
                done();
            });
        });
    });

    describe('/api/installedPlugins', function() {
        it('returns a JSON with a list of installed plugins', function(done) {
            api.get('/api/installedPlugins')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                console.log(res.body);
                res.body.should.be.a('array');
                // res.body.length.should.be.eql(0);
                done();
            });
        });
    });
});
