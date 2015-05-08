var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json())

app.set('port', (process.env.PORT || 5000));


app.get('/discussions', function (req, res) {
  console.log('In handler for GET /discussions');
  result = [];
  var d = get_discussions();
  for (var i in d) {
    result.push(render_discussion(d[i]));
  }

  res.send(result);
});

app.get('/discussions/:id', function (req, res) {
  console.log('In handler for GET /discussions/:id', req.params.id);

  res.send(render_discussion(get_discussion(req.params.id)));
});

app.get('/discussions/:discussion_id/responses/:response_id', function (req, res) {
  console.log('In handler for GET /discussions/:discussion_id/responses/:response_id', req.params.discussion_id, req.params.response_id);

  var d = get_discussion(req.params.discussion_id);
  res.send(render_response(d, get_response(d, req.params.response_id)));
});

app.post('/discussions', function (req, res) {
  console.log('In handler for /discussions', req.body);

  if (!req.body['author_id']) {
    res.status(400).send('author_id field is required');
    return null;
  }
  if (!req.body['book_id']) {
    res.status(400).send('book_id field is required');
    return null;
  }
  if (!req.body['title']) {
    res.status(400).send('title field is required');
    return null;
  }
  if (!req.body['subject']) {
    res.status(400).send('subject field is required');
    return null;
  }

  var discussions = get_discussions();
  var d = create_new_discussion(req.body, discussions);
  discussions.push(d);

  save_discussions(discussions);

  res.send(render_discussion(d));
});

app.post('/discussions/:discussion_id/responses', function (req, res) {
  console.log('In handler for POST /discussions/:discussion_id/responses', req.params.discussion_id, req.body);

  var discussions = get_discussions();

  var new_response = create_new_response(res, req.body, discussions);
  if (!new_response) return;

  var discussion = get_discussion(req.params.discussion_id, discussions);
  discussion['responses'] = discussion['responses'] || [];
  discussion['responses'].push(new_response);

  save_discussions(discussions);

  res.send(render_response(discussion, new_response));
});

app.post('/discussions/:discussion_id/responses/:response_id/responses', function (req, res) {
  console.log('In handler for /discussions/:discussion_id/responses/:response_id/responses', req.params.discussion_id, req.params.response_id, req.body);

  var discussions = get_discussions();
  var new_response = create_new_response(res, req.body, discussions);
  if (!new_response) return;

  var discussion = get_discussion(req.params.discussion_id, discussions);
  var comment = get_response(discussion, req.params.response_id);
  comment['responses'] = comment['responses'] || []
  comment['responses'].push(new_response);

  save_discussions(discussions);

  res.send(render_response(discussion, new_response));
});


var render_discussion = function(discussion) {
  console.log('In render_discussion', discussion);

  discussion['url'] = '/discussions/' + discussion['id'];
  discussion['responses'] = render_responses(discussion, discussion['responses']);
  return discussion;
}

var render_responses = function(discussion, responses) {
  console.log('In render_responses', discussion, responses);

  for (var i in responses) {
    render_response(discussion, responses[i]);
  }
  return responses;
};

var render_response = function(discussion, response) {
  console.log('In render_response', discussion, response);

  response['url'] = '/discussions/' + discussion['id'] + '/responses/' + response['id']
  if (response['responses']) {
    response['responses'] = render_responses(discussion, response['responses']);
  }
  return response;
};


var get_discussion = function(id, discussions) {
  console.log('In get_discussion', id, discussions);

  discussions = discussions || get_discussions();
  for (var i in discussions) {
    var d = discussions[i];
    if (d['id'] == id) {
      return d;
    }
  }
  return null;
};

var get_response = function(discussion, id) {
  console.log('In get_response', discussion, id);

  return get_response_recursive(discussion['responses'], id);
}

var get_response_recursive = function(responses, id) {
  console.log('In get_response_recursive', responses, id);

  if (!responses) {
    return null;
  }

  for (var i in responses) {
    var response = responses[i];
    if (response['id'] == id) {
      return response;
    }

    var subresponse = get_response_recursive(response['responses'], id);
    if (subresponse) {
      return subresponse;
    }
  }

  return null;
}

var get_next_discussion_id = function(discussions) {
  console.log('In get_next_discussion_id', discussions);

  max_discussion_id = 0;
  for (var i in discussions) {
    var d = discussions[i];
    max_discussion_id = Math.max(max_discussion_id, d['id']);
  }

  return max_discussion_id + 1;
};

var create_new_discussion = function(new_discussion_info, discussions) {
  console.log('In create_new_discussion', new_discussion_info, discussions);

  return {
    'id': get_next_discussion_id(discussions),
    'author_id': new_discussion_info['author_id'],
    'book_id': new_discussion_info['book_id'],
    'title': new_discussion_info['title'],
    'subject': new_discussion_info['subject']
  };
};

var get_next_response_id = function(discussions) {
  console.log('In get_next_response_id', discussions);

  max_response_id = 0;
  for (var i in discussions) {
    var d = discussions[i];
    max_response_id = get_max_response_id_recursive(d['responses'], max_response_id);
  }

  return max_response_id + 1;
};

var get_max_response_id_recursive = function(responses, current_max_id) {
  console.log('In get_max_response_id_recursive', responses, current_max_id);
  if (!responses) {
    return current_max_id;
  }

  for (var i in responses) {
    var response = responses[i];
    current_max_id = Math.max(current_max_id, response['id']);
    current_max_id = get_max_response_id_recursive(response['responses'], current_max_id);
  }

  return current_max_id;
};

var create_new_response = function(res, new_response_info, discussions) {
  if (!new_response_info['author_id']) {
    res.status(400).send('author_id field is required');
    return null;
  }
  if (!new_response_info['comment']) {
    res.status(400).send('comment field is required');
    return null;
  }

  var discussions = get_discussions();
  return {
    'id': get_next_response_id(discussions),
    'author_id': new_response_info['author_id'],
    'comment': new_response_info['comment']
  };
};

var get_discussions = function() {
  console.log('In get_discussions');

  fs = require('fs');
  return JSON.parse(fs.readFileSync(process.cwd() + '/discussions.json'));
};

var save_discussions = function(discussions) {
  console.log('In save_discussions', discussions);

  fs = require('fs');
  return fs.writeFile(process.cwd() + '/discussions.json', JSON.stringify(discussions, null, 4));
  // return JSON.parse(fs.readFileSync(process.cwd() + '/discussions.json'));
}

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
