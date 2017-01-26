/* eslint-env node, mocha */

var should = require('chai').should(),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');

describe('Testing the JSON API', function() {
    describe('/api/nonexisting', function() {
        it('returns an error when the method is unknown', function(done) {
            api.get('/api/nonexisting')
            .expect(404)
            .expect('Content-Type', 'application/json')
            .end(function(err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });
    });

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
                res.body.should.be.a('array');
                res.body[0].should.have.property('name');
                res.body[0].should.have.property('version');
                res.body[0].should.have.property('latestVersion');
                res.body[0].should.have.property('isLatestVersion');
                res.body[0].should.have.property('platformUsage');
                res.body[0].should.have.property('accessoryUsage');
                res.body[0].should.have.property('description');
                res.body[0].should.have.property('author');
                res.body[0].should.have.property('homepage');
                res.body[0].should.have.property('homebridgeMinVersion');
                done();
            });
        });
    });
});
