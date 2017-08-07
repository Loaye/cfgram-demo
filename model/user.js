'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const createError = require('http-errors');
const debug = require('debug')('cfgram:user');
const promise = require('bluebird');

const Schema = mongoose.Schema;

const userSchema = Schema({
  username: {type: String, required:true, unique:true},
  email: {type: String, required:true, unique:true},
  password: {type:String, required:true},
  findHash: { type: String, unique: true}
});

userSchema.methods.generatePasswordHash = function(password){
  debug('generatePasswordHash');
  //app gets a password
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err , hash) => {
      if(err) return reject(err);
      this.password = hash;
      resolve(this);
    });
  });
};

userSchema.methods.comparePasswordHash = function(password){   //where bcrypt does magic
  debug('comparePasswordHash');
  return new Promise((resolve,reject) => {
    bcrypt.compare(password, this.password, (err, valid) => {
      if(err) return reject(err);
      if(!valid) return reject(createError(401, 'invalid password'));
      resolve(this);
    });
  });
};

userSchema.methods.generateFindHash = function(){
  debug('generateFindHash');
  //using some recursion
  return new Promise((resolve,reject)=> {
    let tries = 0;

    _generateFindHash.call(this);

    function _generateFindHash(){
      this.findHash = crypto.randomBytes(32).toString('hex'); //uses node crypto module to generate a 32 bit hexi string
      this.save()//mongoose methods
      .then( () => resolve(this.findHash))
      .catch( err => {
        if( tries > 3) return reject(err);
        tries++;
        _generateFindHash.call(this); //call cahnges the context, gives us the ability to call a function with the specified context
      });
    }
  });
};

userSchema.methods.generateToken = function(){
  debug('generateToken');

  return new Promise((resolve, reject) => {
    this.generateFindHash()//returns a Promise
    .then( findHash => resolve(jwt.sign({ token: findHash}, process.env.APP_SECRET)))
    .catch( err => reject(err));
  });
};

module.exports = mongoose.model('user', userSchema);