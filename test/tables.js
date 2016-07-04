import { friend_channel } from '../lib/models'
import { user } from '../lib/models'
import { world_channel } from '../lib/models'
import vogels from 'vogels'
import Promise from 'bluebird'
import schemas from '../lib/models'
import config from '../config.js'
import Joi from 'joi'
import AWS from 'aws-sdk'

require('../lib/models')

module.exports.create = function () {
  var deferred = Promise.pending()
  vogels.createTables({
    'User': { readCapacity: 5, writeCapacity: 10 },
    'FriendChannel': { readCapacity: 20, writeCapacity: 4 },
    'WorldChannel': { readCapacity: 20, writeCapacity: 4 }
  }, function(err) {
    if (err) {
      console.log('Error creating tables: ', err);
      deferred.resolve(true)
    } else {
      console.log('Tables has been created');
      deferred.resolve(true)
    }
  });
  return deferred.promise
}


module.exports.delete = function () {
  var deferred = Promise.pending()

  AWS.config.update({
    accessKeyId: config.aws.aws_access_key_id, 
    secretAccessKey: config.aws.secret_access_key, 
    region: config.aws.region
  });
      
  var opts;

  if(!config.env.isProduction)
    opts = { endpoint: config.env.developement.aws_local_endpoint, apiVersion: '2012-08-10' };

  var dynamodb = new AWS.DynamoDB(opts);
  vogels.dynamoDriver(dynamodb);

  deleteTables([friend_channel, world_channel, user])
  .then(function (err) {
    deferred.resolve()
  })
  // friend_channel
  // .scan()
  // .loadAll()
  // .exec(function (err, items) {
  //   var items = (items.Items)
  //   items.map(function (item) {
  //     if(!item.attrs.channel_id) return
  //     friend_channel.destroy(item.attrs.channel_id, item.attrs.parent_hashtag)
  //   })
  //   deferred.resolve(err)
  // })

  return deferred.promise
}


function deleteTables (tables) {
  var _deferred = Promise.pending()
  var len = tables.length

  tables.map(function (table) {
    table.deleteTable((err) => {
      console.log(err)
      if(len-- == 1)
        _deferred.resolve()
    })
  })
 
  return _deferred.promise
}

module.exports.clear = function () {
  var deferred = Promise.pending()
  friend_channel
  .scan()
  .loadAll()
  .exec(function (err, items) {
    var items = (items.Items)
    items.map(function (item) {
      if(!item.attrs.channel_id) return
      friend_channel.destroy(item.attrs.channel_id, item.attrs.parent_hashtag)
    })
    deferred.resolve(err)
  })
  return deferred.promise
}


