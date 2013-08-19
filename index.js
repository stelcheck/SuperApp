var nodegit = require('nodegit');
var gitInfo = require('git-rev');
var async = require('async');
var connect = require('connect');
var config = require('config');
var fs = require('fs');

var gitData = {
    branch: null,
    commits: []
};

config.listen = config.listen || './server.sock';

function setupWebServer (cb) {

    var server = connect();

    server.use(function (req, res, next) {
        res.end(JSON.stringify(gitData));
    });

    var listen = config.listen;

    server.listen(listen, function () {

        if (listen.toString().indexOf('server.sock') > 0) {
            fs.chmodSync(listen, 0777);
        }

        cb();
    });
}

function loadGitInfo (cb) {

    nodegit.repo('.git', function (err, repo) {

        if (err) {
            throw new Error(err);
        }

        gitInfo.branch(function (branch) {

            gitData.branch = branch;

            repo.branch(branch, function (err, branch) {

                branch.history().on('commit', function (err, commit) {

                    gitData.commits.push(commit);
                });

                cb();
            });
        });

    });
}

async.parallel([
    loadGitInfo,
    setupWebServer
], function (err) {
    console.log('Service is ready');
});
