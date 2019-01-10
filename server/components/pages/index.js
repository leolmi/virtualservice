'use strict';

module.exports.api = function(req, res) {
  const viewFilePath = 'api';
  const result = {status: 200};
  res.status(result.status);
  res.render(viewFilePath, function (err) {
    if (err) { return res.json(result, result.status); }
    res.render(viewFilePath);
  });
};