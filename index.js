var cp = require('child_process');
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
        res.end(JSON.stringify(gitData, false, 4));
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

    gitInfo.branch(function (branch) {

        gitData.branch = branch;

        cp.exec('git log -n5', function (err, res) {
            var lines = res.split('\n');

            /* Works only with single comment-line commits!!! */
            for (var l = 0; l < lines.length; l += 6) {

                var id = lines[l].split(" ")[1];
                var author = lines[l + 1].split(" ")[1];
                var date = lines[l + 2].split(" ")[1];
                var comments = lines[l + 4];

                gitData.commits.push({
                    id: id,
                    author: author,
                    date: date,
                    comments: comments
                });
            }

            cb();
        });
    });
}

async.parallel([
    loadGitInfo,
    setupWebServer
], function (err) {
    console.log('Service (QA Update) is ready...');
});
